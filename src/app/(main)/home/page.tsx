
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Plus, ShieldAlert, Stethoscope, Pill as PillIcon, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Medication, Appointment, AdherenceLog, FamilyMember, UserProfile } from '@/lib/types';
import { MedicationCard } from '@/components/medication-card';
import { AppointmentCard } from '@/components/appointment-card';
import { format, parse, isToday, isFuture, differenceInHours, isBefore, startOfDay } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { collection, onSnapshot, query, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { MedicationReminderDialog } from '@/components/medication-reminder-dialog';
import { trackAdherence } from '@/ai/flows/track-adherence-flow';
import { useToast } from '@/hooks/use-toast';
import { generateAppointmentReminder } from '@/ai/flows/appointment-reminder-flow';
import { generateFamilyAlert } from '@/ai/flows/generate-family-alert-flow';
import { GroupedMedicationCard } from '@/components/grouped-medication-card';
import { AdCard } from '@/components/ad-card';
import { type ReminderSettings } from '@/app/(main)/settings/reminders/page';

export default function HomePage() {
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [localMedications, setLocalMedications] = useLocalStorage<Medication[]>('guest-medications', []);
  const [localAppointments, setLocalAppointments] = useLocalStorage<Appointment[]>('guest-appointments', []);
  const [localAdherence, setLocalAdherence] = useLocalStorage<AdherenceLog[]>('guest-adherence', []);
  const [sentAppointmentReminders, setSentAppointmentReminders] = useLocalStorage<string[]>('sent-appointment-reminders', []);
  const [reminderSettings] = useLocalStorage<ReminderSettings>('reminder-settings', { 
    initialDuration: 1, 
    secondAlert: 3, 
    familyAlert: 10 
  });

  const [firestoreMedications, setFirestoreMedications] = useState<Medication[]>([]);
  const [firestoreAppointments, setFirestoreAppointments] = useState<Appointment[]>([]);
  const [firestoreAdherence, setFirestoreAdherence] = useState<AdherenceLog[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [reminder, setReminder] = useState<{ medications: Medication[]; time: string } | null>(null);
  const [greeting, setGreeting] = useState('');
  
  const reminderTimers = useRef<Record<string, NodeJS.Timeout[]>>({});

  useEffect(() => {
    if (user && !isGuest) {
      setLocalMedications([]);
      setLocalAppointments([]);
      setLocalAdherence([]);

      const medUnsub = onSnapshot(collection(db, 'users', user.uid, 'medications'), (snapshot) => {
        setFirestoreMedications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Medication)));
      });

      const apptQuery = query(collection(db, 'users', user.uid, 'appointments'), orderBy('date', 'asc'));
      const apptUnsub = onSnapshot(apptQuery, (snapshot) => {
        setFirestoreAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment)));
      });

      const adherenceUnsub = onSnapshot(collection(db, 'users', user.uid, 'adherenceLogs'), (snapshot) => {
        setFirestoreAdherence(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdherenceLog)));
      });
      
      const familyUnsub = onSnapshot(collection(db, 'users', user.uid, 'familyMembers'), (snapshot) => {
          setFamilyMembers(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as FamilyMember)));
      });
      
      const userProfileUnsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
            setUserProfile(doc.data() as UserProfile);
        }
      });

      return () => {
        medUnsub();
        apptUnsub();
        adherenceUnsub();
        familyUnsub();
        userProfileUnsub();
        Object.values(reminderTimers.current).forEach(timers => timers.forEach(clearTimeout));
      };
    } else {
      setFirestoreMedications([]);
      setFirestoreAppointments([]);
      setFirestoreAdherence([]);
      setFamilyMembers([]);
      setUserProfile(null);
    }
  }, [user, isGuest, setLocalAdherence, setLocalAppointments, setLocalMedications]);

  const activeMedications = isGuest ? localMedications : firestoreMedications;
  const activeAppointments = isGuest ? localAppointments : firestoreAppointments;
  const adherenceLogs = isGuest ? localAdherence : firestoreAdherence;

  const todaysMedicationsByTime = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // Sunday - 0, Monday - 1
    const todaysMeds = activeMedications.filter(med => {
        if (med.frequency === 'Daily') return true;
        if (med.frequency === 'Weekly') return med.daysOfWeek?.includes(dayOfWeek);
        if (med.frequency === 'Monthly') return med.dayOfMonth === today.getDate();
        return false;
    });

    const groupedByTime = todaysMeds.reduce((acc, med) => {
        med.times.forEach(time => {
            if (!acc[time]) {
                acc[time] = [];
            }
            acc[time].push(med);
        });
        return acc;
    }, {} as Record<string, Medication[]>);

    return Object.entries(groupedByTime)
        .sort(([timeA], [timeB]) => timeA.localeCompare(timeB))
        .map(([time, medications]) => ({ time, medications }));

  }, [activeMedications]);

  const nextMedication = useMemo(() => {
    const now = new Date();
    return todaysMedicationsByTime
      .find(item => parse(item.time, 'HH:mm', new Date()) > now) || null;
  }, [todaysMedicationsByTime]);

  const clearReminderTimers = useCallback((notificationId: string) => {
    if (reminderTimers.current[notificationId]) {
      reminderTimers.current[notificationId].forEach(clearTimeout);
      delete reminderTimers.current[notificationId];
    }
  }, []);
  
  const handleReminderAction = useCallback(async (medications: Medication[], scheduledTime: string, status: 'taken' | 'stock_out' | 'missed') => {
    const notificationId = `${medications[0].id}-${scheduledTime}-${format(new Date(), 'yyyy-MM-dd')}`;
    clearReminderTimers(notificationId);

    const logPromises = medications.map(medication => {
      const logEntry: Omit<AdherenceLog, 'id'> = {
        medicationId: medication.id,
        medicationName: medication.name,
        takenAt: new Date().toISOString(),
        status: status,
        userId: user?.uid || 'guest',
        scheduledTime: scheduledTime,
      };

      if (isGuest || !user) {
        setLocalAdherence(prev => [...prev, { ...logEntry, id: new Date().toISOString() }]);
        return Promise.resolve();
      } else {
        return trackAdherence({
            ...logEntry,
            userId: user.uid,
        });
      }
    });

    await Promise.all(logPromises);
    setReminder(null);
  }, [user, isGuest, setLocalAdherence, clearReminderTimers]);
  
  const logMissedDoseAndAlertFamily = useCallback(async (medications: Medication[], scheduledTime: string) => {
    const notificationId = `${medications[0].id}-${scheduledTime}-${format(new Date(), 'yyyy-MM-dd')}`;
    clearReminderTimers(notificationId);

    for (const medication of medications) {
        const logEntry: Omit<AdherenceLog, 'id'> = {
          medicationId: medication.id,
          medicationName: medication.name,
          takenAt: new Date().toISOString(),
          status: 'missed',
          userId: user?.uid || 'guest',
          scheduledTime: scheduledTime,
        };

        if (isGuest || !user) {
          setLocalAdherence(prev => [...prev, { ...logEntry, id: new Date().toISOString() }]);
        } else {
          await trackAdherence({
              ...logEntry,
              userId: user.uid,
          });
        }
        
        toast({
          title: `Dose Logged as Missed`,
          description: `Your ${format(parse(scheduledTime, 'HH:mm', new Date()), 'h:mm a')} dose for ${medication.name} was missed.`,
          variant: 'destructive',
        });

        if (familyMembers.length > 0 && userProfile?.isPremium) {
            for (const member of familyMembers) {
                if (member.status === 'accepted') {
                    const alert = await generateFamilyAlert({
                        patientName: user?.displayName || 'A user',
                        medicationName: medication.name,
                        familyName: member.name,
                    });
                    console.log(`Sending alert to ${member.name}: ${alert.alertMessage}`);
                    toast({
                        title: 'Family Alert Sent',
                        description: `Notified ${member.name} about missed dose of ${medication.name}.`,
                    });
                }
            }
        }
    }
    
    // Show reminder one last time to inform user it was missed, then close it.
    setReminder({ medications, time: scheduledTime });
    setTimeout(() => setReminder(null), 60 * 1000);

  }, [user, isGuest, setLocalAdherence, toast, familyMembers, userProfile, clearReminderTimers]);


  const checkReminders = useCallback(() => {
    const now = new Date();
    
    for (const group of todaysMedicationsByTime) {
      const { time, medications } = group;
      const scheduledTime = parse(time, 'HH:mm', new Date());
      const notificationId = `${medications[0].id}-${time}-${format(now, 'yyyy-MM-dd')}`;
      
      const isHandled = medications.some(med => 
        adherenceLogs.some(log => 
          log.medicationId === med.id &&
          isToday(new Date(log.takenAt)) &&
          log.scheduledTime === time
        )
      );

      if (isBefore(now, scheduledTime) || isHandled || reminderTimers.current[notificationId]) {
        continue;
      }
      
      const showReminder = () => {
        if (!reminder) {
          setReminder({ medications, time });
           try {
            new Notification('Time for your medication!', {
                body: `It's time for your ${format(scheduledTime, 'h:mm a')} dose.`,
            });
          } catch (e) {
            console.error("Notification API error: ", e);
          }
        }
      };

      reminderTimers.current[notificationId] = [];

      // Initial Alert
      showReminder();
      const t1 = setTimeout(() => setReminder(null), reminderSettings.initialDuration * 60 * 1000);

      // Second Alert
      const t2 = setTimeout(() => {
        showReminder();
        const t3 = setTimeout(() => setReminder(null), 1 * 60 * 1000); // Ring for 1 minute
        reminderTimers.current[notificationId].push(t3);
      }, reminderSettings.secondAlert * 60 * 1000);

      // Final Missed Alert + Family Alert
      const t4 = setTimeout(async () => {
        await logMissedDoseAndAlertFamily(medications, time);
      }, reminderSettings.familyAlert * 60 * 1000);

      reminderTimers.current[notificationId].push(t1, t2, t4);
    }
  }, [todaysMedicationsByTime, adherenceLogs, reminder, reminderSettings, logMissedDoseAndAlertFamily]);


  const checkMissedDosesOnLoad = useCallback(async () => {
    const now = new Date();
    let missedCount = 0;
  
    for (const { time, medications } of todaysMedicationsByTime) {
      const scheduledTime = parse(time, 'HH:mm', startOfDay(now));
      
      if (isBefore(scheduledTime, now)) {
        for(const med of medications) {
            const isHandled = adherenceLogs.some(log =>
                log.medicationId === med.id &&
                isToday(new Date(log.takenAt)) &&
                log.scheduledTime === time
            );
            
            if (!isHandled) {
                missedCount++;
                const logEntry: Omit<AdherenceLog, 'id'> = {
                  medicationId: med.id,
                  medicationName: med.name,
                  takenAt: new Date().toISOString(),
                  status: 'missed',
                  userId: user?.uid || 'guest',
                  scheduledTime: time,
                };
                 if (isGuest || !user) {
                  setLocalAdherence(prev => [...prev, { ...logEntry, id: new Date().toISOString() }]);
                } else {
                  await trackAdherence({ ...logEntry, userId: user.uid });
                }
            }
        }
      }
    }
    if(missedCount > 0) {
        toast({
            title: "You have missed doses!",
            description: `We've logged ${missedCount} missed dose${missedCount > 1 ? 's' : ''} from earlier today. Check your reports for details.`,
            variant: "destructive",
            duration: 10000,
        });
    }
  }, [todaysMedicationsByTime, adherenceLogs, toast, user, isGuest, setLocalAdherence]);


  const checkAppointmentReminders = useCallback(async () => {
    if (isGuest || !user) return;
    const now = new Date();
    
    for (const appt of activeAppointments) {
      const apptDateTime = parse(`${appt.date} ${appt.time}`, 'yyyy-MM-dd HH:mm', new Date());
      const hoursUntil = differenceInHours(apptDateTime, now);

      const checkAndSend = async (reminderType: '24h' | '3h') => {
        const reminderId = `${appt.id}-${reminderType}`;
        if (!sentAppointmentReminders.includes(reminderId)) {
          const reminderTime = reminderType === '24h' ? 24 : 3;
          
          const result = await generateAppointmentReminder({
              patientName: user.displayName || 'User',
              doctorName: appt.doctorName,
              specialty: appt.specialty,
              appointmentDate: appt.date,
              appointmentTime: appt.time,
              reminderTime: `${reminderTime} hour(s)`
          });
          
          toast({
            title: `Appointment Reminder (${reminderTime}h)`,
            description: result.reminderMessage,
          });
          
          if (familyMembers.length > 0 && userProfile?.isPremium) {
            for (const member of familyMembers) {
              if(member.status === 'accepted') {
                toast({
                  title: `Family Alert Sent`,
                  description: `Notified ${member.name} about ${user.displayName}'s upcoming appointment.`
                })
              }
            }
          }
          setSentAppointmentReminders(prev => [...prev, reminderId]);
        }
      };

      if (hoursUntil > 23 && hoursUntil <= 24) await checkAndSend('24h');
      if (hoursUntil > 2 && hoursUntil <= 3) await checkAndSend('3h');
    }
  }, [isGuest, user, activeAppointments, sentAppointmentReminders, setSentAppointmentReminders, toast, familyMembers, userProfile]);

  // Run on first load
  useEffect(() => {
    checkMissedDosesOnLoad();
  }, [checkMissedDosesOnLoad]);

  useEffect(() => {
    const reminderInterval = setInterval(checkReminders, 5000); // Check every 5 seconds for more responsive initial alert
    const appointmentReminderInterval = setInterval(checkAppointmentReminders, 60000 * 5); // check every 5 mins

    checkReminders();
    checkAppointmentReminders();

    return () => {
      clearInterval(reminderInterval);
      clearInterval(appointmentReminderInterval);
      Object.values(reminderTimers.current).forEach(timers => timers.forEach(clearTimeout));
    };
  }, [checkReminders, checkAppointmentReminders]);


  const todaysAppointments = useMemo(() => {
    return activeAppointments
      .filter(app => isToday(new Date(`${app.date}T00:00:00`)))
      .sort((a,b) => a.time.localeCompare(b.time));
  }, [activeAppointments]);

  const nextAppointment = useMemo(() => {
    return activeAppointments.find(app => {
        const appDate = parse(`${app.date} ${app.time}`, 'yyyy-MM-dd HH:mm', new Date());
        return isFuture(appDate);
    }) || null;
  }, [activeAppointments]);


  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  return (
    <>
    {reminder && (
        <MedicationReminderDialog
            isOpen={!!reminder}
            medications={reminder.medications}
            time={reminder.time}
            onTake={() => handleReminderAction(reminder.medications, reminder.time, 'taken')}
            onStockOut={() => handleReminderAction(reminder.medications, reminder.time, 'stock_out')}
            onMiss={() => handleReminderAction(reminder.medications, reminder.time, 'missed')}
            onClose={() => {
                const notificationId = `${reminder.medications[0].id}-${reminder.time}-${format(new Date(), 'yyyy-MM-dd')}`;
                clearReminderTimers(notificationId);
                setReminder(null);
            }}
        />
    )}
    <div className="container mx-auto max-w-2xl p-4 space-y-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">{greeting}, {user?.displayName || 'Guest'}!</h1>
        <p className="text-muted-foreground">{format(new Date(), 'EEEE, dd/MM/yy')}</p>
      </header>
      
      {!userProfile?.isPremium && <AdCard />}

      {nextMedication && (
        <Card className="bg-primary/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <PillIcon/>
                    Next Medication
                </CardTitle>
            </CardHeader>
            <CardContent>
                <GroupedMedicationCard time={nextMedication.time} medications={nextMedication.medications} highlight />
            </CardContent>
        </Card>
      )}
      
      {nextAppointment && (
        <Card className="bg-primary/10">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <Stethoscope/>
                    Upcoming Appointment
                </CardTitle>
            </CardHeader>
            <CardContent>
                <AppointmentCard appointment={nextAppointment} />
            </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><PillIcon/> Today's Medications</CardTitle>
              <CardDescription>Your medication schedule for today.</CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/medicine/add">
                <Plus className="mr-2 h-4 w-4" /> Add Medicine
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {todaysMedicationsByTime.length > 0 ? (
            <div className="space-y-4">
              {todaysMedicationsByTime.map((group) => (
                  <GroupedMedicationCard key={group.time} time={group.time} medications={group.medications} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-4">{isGuest ? "Try adding a medication to see it here." : "You have no medications scheduled for today."}</p>
                <Button asChild>
                  <Link href="/medicine/add">
                    <Plus className="mr-2 h-4 w-4" /> Add Medication
                  </Link>
                </Button>
               {isGuest && (
                 <p className="text-sm text-muted-foreground mt-4">
                  <Link href="/login" className="text-primary underline">Sign in</Link> to save your schedule across devices.
                 </p>
                )}
            </div>
          )}
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CalendarDays/> Today's Appointments</CardTitle>
          <CardDescription>Your appointments for today.</CardDescription>
        </CardHeader>
        <CardContent>
          {todaysAppointments.length > 0 ? (
            <div className="space-y-4">
              {todaysAppointments.map((item) => (
                  <AppointmentCard key={item.id} appointment={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-4">{isGuest ? "Try adding an appointment to see it here." : "You have no appointments scheduled for today."}</p>
                 <Button asChild variant="secondary">
                   <Link href="/appointments/add">
                    <Plus className="mr-2 h-4 w-4" /> Add Appointment
                  </Link>
                </Button>
               {isGuest && (
                 <p className="text-sm text-muted-foreground mt-4">
                  <Link href="/login" className="text-primary underline">Sign in</Link> to save your schedule across devices.
                 </p>
                )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
