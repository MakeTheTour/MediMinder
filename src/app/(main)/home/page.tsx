
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Plus, ShieldAlert, Stethoscope, Pill as PillIcon, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Medication, Appointment, AdherenceLog, FamilyMember, UserProfile } from '@/lib/types';
import { MedicationCard } from '@/components/medication-card';
import { AppointmentCard } from '@/components/appointment-card';
import { format, parse, isToday, isFuture, addMinutes, differenceInHours, differenceInMinutes, startOfDay, isAfter } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { collection, onSnapshot, query, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { MedicationReminderDialog } from '@/components/medication-reminder-dialog';
import { trackAdherence } from '@/ai/flows/track-adherence-flow';
import { useToast } from '@/hooks/use-toast';
import { generateAppointmentReminder } from '@/ai/flows/appointment-reminder-flow';
import { generateFamilyAlert } from '@/ai/flows/family-alert-flow';
import { GroupedMedicationCard } from '@/components/grouped-medication-card';

export default function HomePage() {
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [localMedications, setLocalMedications] = useLocalStorage<Medication[]>('guest-medications', []);
  const [localAppointments, setLocalAppointments] = useLocalStorage<Appointment[]>('guest-appointments', []);
  const [localAdherence, setLocalAdherence] = useLocalStorage<AdherenceLog[]>('guest-adherence', []);
  const [sentAppointmentReminders, setSentAppointmentReminders] = useLocalStorage<string[]>('sent-appointment-reminders', []);
  const [sentNotifications, setSentNotifications] = useLocalStorage<string[]>('sent-notifications', []);

  const [firestoreMedications, setFirestoreMedications] = useState<Medication[]>([]);
  const [firestoreAppointments, setFirestoreAppointments] = useState<Appointment[]>([]);
  const [firestoreAdherence, setFirestoreAdherence] = useState<AdherenceLog[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [reminder, setReminder] = useState<{ medications: Medication[]; time: string } | null>(null);
  const [greeting, setGreeting] = useState('');
  
  const escalationTimerRef = useRef<NodeJS.Timeout | null>(null);

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
          setFamilyMembers(snapshot.docs.map(doc => doc.data() as FamilyMember));
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
    // Find the first medication time in the sorted list that is in the future
    return todaysMedicationsByTime
      .find(item => parse(item.time, 'HH:mm', new Date()) > now) || null;
  }, [todaysMedicationsByTime]);

  const handleReminderAction = useCallback(async (medications: Medication[], scheduledTime: string, status: 'taken' | 'stock_out' | 'missed') => {
    if (escalationTimerRef.current) {
        clearTimeout(escalationTimerRef.current);
        escalationTimerRef.current = null;
    }
    
    // Log for all medications in the group
    for (const medication of medications) {
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
        } else {
          await trackAdherence({
              ...logEntry,
              userId: user.uid,
          });
        }
        
        // Family alert logic for Stock Out or Missed
        if ((status === 'stock_out' || status === 'missed') && familyMembers.length > 0 && userProfile?.isPremium) {
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
                        description: `Notified ${member.name} about ${medication.name}.`,
                    });
                }
            }
        }
    }
    
    if (status === 'missed') {
      toast({
        title: `Dose Missed`,
        description: `You missed your ${scheduledTime} dose.`,
        variant: 'destructive',
      })
    }
    setReminder(null);
  }, [user, isGuest, setLocalAdherence, toast, familyMembers, userProfile]);


  const checkReminders = useCallback(() => {
    const now = new Date();
    
    // Do not show new reminders if one is already active
    if (reminder) return;

    for (const group of todaysMedicationsByTime) {
      const { time, medications } = group;
      const scheduledTime = parse(time, 'HH:mm', new Date());

      // Check if it's time for the medication
      const isTimeToShow = isAfter(now, scheduledTime);
      if (!isTimeToShow) continue;

      // Check if this dose has already been handled today
      const anyMedicationHandled = medications.some(med => 
        adherenceLogs.some(log => 
          log.medicationId === med.id &&
          isToday(new Date(log.takenAt)) &&
          log.scheduledTime === time
        )
      );
      
      const notificationId = `${medications[0].id}-${time}-${format(now, 'yyyy-MM-dd')}`;
      const alreadyNotified = sentNotifications.includes(notificationId);

      if (!anyMedicationHandled && !alreadyNotified && !reminder) {
        
        setReminder({ medications, time });
        
        if (escalationTimerRef.current) clearTimeout(escalationTimerRef.current);
        
        // Auto-miss after 2 minutes
        escalationTimerRef.current = setTimeout(() => {
            handleReminderAction(medications, time, 'missed');
        }, 2 * 60 * 1000);
        
        setSentNotifications(prev => [...prev, notificationId]);
        return; // Show one reminder at a time
      }
    }
  }, [todaysMedicationsByTime, adherenceLogs, reminder, sentNotifications, setSentNotifications, handleReminderAction]);


  const checkMissedDoses = useCallback(async () => {
    const now = new Date();
  
    for (const { time, medications } of todaysMedicationsByTime) {
      const scheduledTime = parse(time, 'HH:mm', new Date());
      
      // Check for doses missed by 30-35 minutes to send alert
      const timeSinceScheduled = differenceInMinutes(now, scheduledTime);
      if (timeSinceScheduled >= 30 && timeSinceScheduled < 35) {

        const anyMedHandled = medications.some(med =>
          adherenceLogs.some(log =>
            log.medicationId === med.id &&
            isToday(new Date(log.takenAt)) &&
            log.scheduledTime === time
          )
        );
        
        const missedNotificationId = `missed-${medications[0].id}-${time}-${format(now, 'yyyy-MM-dd')}`;
        const alreadyNotified = sentNotifications.includes(missedNotificationId);
  
        if (!anyMedHandled && !alreadyNotified) {
          toast({
            title: `Your Dose already Missed`,
            description: `Your ${format(scheduledTime, 'h:mm a')} dose was missed. You can still log it if needed.`,
            variant: 'destructive',
            duration: 10000,
          });
          setSentNotifications(prev => [...prev, missedNotificationId]);
          
          // Send family alert for missed dose
          if (!isGuest && user && familyMembers.length > 0 && userProfile?.isPremium) {
               for (const member of familyMembers) {
                  if (member.status === 'accepted') {
                      for(const medication of medications) {
                          await handleReminderAction([medication], time, 'missed');
                      }
                  }
              }
          }
        }
      }
    }
  }, [todaysMedicationsByTime, adherenceLogs, user, isGuest, familyMembers, toast, userProfile, handleReminderAction, sentNotifications, setSentNotifications]);


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
          
          // Also notify family members for appointments
          if (familyMembers.length > 0 && userProfile?.isPremium) {
            for (const member of familyMembers) {
              if(member.status === 'accepted') {
                console.log(`Notifying family member ${member.name} about appointment.`);
                // In a real app, you would generate a specific alert for the family member
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

      if (hoursUntil > 23 && hoursUntil <= 24) {
        await checkAndSend('24h');
      }

      if (hoursUntil > 2 && hoursUntil <= 3) {
        await checkAndSend('3h');
      }
    }
  }, [isGuest, user, activeAppointments, sentAppointmentReminders, setSentAppointmentReminders, toast, familyMembers, userProfile]);


  useEffect(() => {
    const reminderInterval = setInterval(checkReminders, 10000); // Check every 10 seconds
    const missedDoseInterval = setInterval(checkMissedDoses, 60000); // Check every minute
    const appointmentReminderInterval = setInterval(checkAppointmentReminders, 60000 * 10);

    checkReminders();
    checkMissedDoses();
    checkAppointmentReminders();

    return () => {
      clearInterval(reminderInterval);
      clearInterval(missedDoseInterval);
      clearInterval(appointmentReminderInterval);
    };
  }, [checkReminders, checkMissedDoses, checkAppointmentReminders]);


  const todaysAppointments = useMemo(() => {
    return activeAppointments
      .filter(app => isToday(new Date(`${app.date}T00:00:00`)))
      .sort((a,b) => a.time.localeCompare(b.time));
  }, [activeAppointments]);

  const nextAppointment = useMemo(() => {
    const futureAppointments = activeAppointments.filter(app => {
        const appDate = new Date(`${app.date}T00:00:00`);
        return isFuture(appDate) || isToday(appDate);
    });
    return futureAppointments[0] || null;
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
        />
    )}
    <div className="container mx-auto max-w-2xl p-4 space-y-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">{greeting}, {user?.displayName || 'Guest'}!</h1>
        <p className="text-muted-foreground">{format(new Date(), 'EEEE, dd/MM/yy')}</p>
      </header>
      
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
