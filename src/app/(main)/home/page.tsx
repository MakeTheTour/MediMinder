
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, ShieldAlert, Stethoscope, Pill as PillIcon, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Medication, Appointment, AdherenceLog, FamilyMember } from '@/lib/types';
import { MedicationCard } from '@/components/medication-card';
import { AppointmentCard } from '@/components/appointment-card';
import { format, parse, isToday, isFuture, addMinutes, differenceInHours, differenceInMinutes } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { MedicationReminderDialog } from '@/components/medication-reminder-dialog';
import { trackAdherence } from '@/ai/flows/track-adherence-flow';
import { useToast } from '@/hooks/use-toast';
import { generateFamilyAlert } from '@/ai/flows/family-alert-flow';
import { generateAppointmentReminder } from '@/ai/flows/appointment-reminder-flow';
import { intelligentSnooze } from '@/ai/flows/intelligent-snooze';

export default function HomePage() {
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [localMedications, setLocalMedications] = useLocalStorage<Medication[]>('guest-medications', []);
  const [localAppointments, setLocalAppointments] = useLocalStorage<Appointment[]>('guest-appointments', []);
  const [localAdherence, setLocalAdherence] = useLocalStorage<AdherenceLog[]>('guest-adherence', []);
  const [sentAppointmentReminders, setSentAppointmentReminders] = useLocalStorage<string[]>('sent-appointment-reminders', []);
  const [sentNotifications, setSentNotifications] = useLocalStorage<string[]>('sent-notifications', []);
  const [snoozedUntil, setSnoozedUntil] = useLocalStorage<Record<string, string>>('snoozed-until', {});


  const [firestoreMedications, setFirestoreMedications] = useState<Medication[]>([]);
  const [firestoreAppointments, setFirestoreAppointments] = useState<Appointment[]>([]);
  const [firestoreAdherence, setFirestoreAdherence] = useState<AdherenceLog[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);

  const [greeting, setGreeting] = useState('');
  const [reminder, setReminder] = useState<{ medication: Medication; time: string } | null>(null);

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
        setFamilyMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FamilyMember)));
      });


      return () => {
        medUnsub();
        apptUnsub();
        adherenceUnsub();
        familyUnsub();
      };
    } else {
      setFirestoreMedications([]);
      setFirestoreAppointments([]);
      setFirestoreAdherence([]);
      setFamilyMembers([]);
    }
  }, [user, isGuest, setLocalAdherence, setLocalAppointments, setLocalMedications]);

  const activeMedications = isGuest ? localMedications : firestoreMedications;
  const activeAppointments = isGuest ? localAppointments : firestoreAppointments;
  const adherenceLogs = isGuest ? localAdherence : firestoreAdherence;

  const todaysMedications = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // Sunday - 0, Monday - 1
    const unsortedMeds = activeMedications.filter(med => {
        if (med.frequency === 'Daily') return true;
        if (med.frequency === 'Weekly') return med.daysOfWeek?.includes(dayOfWeek);
        if (med.frequency === 'Monthly') return med.dayOfMonth === today.getDate();
        return false;
    });

    return unsortedMeds.flatMap(med => med.times.map(time => ({ time, data: med })))
                       .sort((a, b) => a.time.localeCompare(b.time));

  }, [activeMedications]);

    const handleFamilyAlert = useCallback(async (medication: Medication, reason: string) => {
        if (isGuest || !user) {
            toast({ title: 'Sign In Required', description: 'Please sign in to alert family members.', variant: 'destructive'});
            return;
        }
        const acceptedFamilyMember = familyMembers.find(m => m.status === 'accepted');
        if (!acceptedFamilyMember) {
            toast({ title: 'No Linked Family Member', description: 'Please add and link a family member in the Family tab first.', variant: 'destructive'});
            return;
        }
        
        try {
            toast({ title: 'Sending Alert...', description: `Notifying ${acceptedFamilyMember.name}.` });
            const result = await generateFamilyAlert({
                patientName: user.displayName || 'A family member',
                medicationName: `${medication.name} (${reason})`,
                familyName: acceptedFamilyMember.name,
            });
            // Here you would typically send the alert via SMS/email
            console.log("Family Alert Message:", result.alertMessage);
            toast({ title: 'Alert Sent!', description: `${acceptedFamilyMember.name} has been notified.` });
        } catch (error) {
            toast({ title: 'Error', description: 'Could not send alert. Please try again.', variant: 'destructive'});
        }
    }, [isGuest, user, familyMembers, toast]);


  const checkReminders = useCallback(() => {
    const now = new Date();
    
    const medsForToday = activeMedications.filter(med => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        if (med.frequency === 'Daily') return true;
        if (med.frequency === 'Weekly') return med.daysOfWeek?.includes(dayOfWeek);
        if (med.frequency === 'Monthly') return med.dayOfMonth === today.getDate();
        return false;
    });
    
    for (const med of medsForToday) {
      for (const time of med.times) {
        const scheduledTime = parse(time, 'HH:mm', new Date());
        
        const alreadyHandled = adherenceLogs.some(
          log => log.medicationId === med.id && 
                 format(new Date(log.takenAt), 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd') &&
                 log.scheduledTime === time
        );
        
        const notificationId = `${med.id}-${time}-${format(now, 'yyyy-MM-dd')}`;
        const alreadyNotified = sentNotifications.includes(notificationId);

        const isSnoozed = snoozedUntil[notificationId] && new Date(snoozedUntil[notificationId]) > now;

        if (now >= scheduledTime && now < addMinutes(scheduledTime, 1) && !alreadyHandled && !alreadyNotified && !isSnoozed) {
          
          if (Notification.permission === "granted") {
            new Notification("Medication Reminder", {
              body: `It's time to take your ${med.name}.`,
              icon: '/icon.png' 
            });
          }
          
          if (!reminder) {
            setReminder({ medication: med, time });
          }

          setSentNotifications(prev => [...prev, notificationId]);
          return; 
        }
      }
    }
  }, [adherenceLogs, activeMedications, reminder, sentNotifications, setSentNotifications, snoozedUntil]);

  const checkMissedDoses = useCallback(async () => {
    const now = new Date();
    const medsForToday = activeMedications.filter(med => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        if (med.frequency === 'Daily') return true;
        if (med.frequency === 'Weekly') return med.daysOfWeek?.includes(dayOfWeek);
        if (med.frequency === 'Monthly') return med.dayOfMonth === today.getDate();
        return false;
    });

    for (const med of medsForToday) {
        for (const time of med.times) {
            const scheduledTime = parse(time, 'HH:mm', new Date());
            const minutesSinceScheduled = differenceInMinutes(now, scheduledTime);

            if (minutesSinceScheduled > 30) {
                const wasHandled = adherenceLogs.some(log => 
                    log.medicationId === med.id &&
                    format(new Date(log.takenAt), 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd') &&
                    log.scheduledTime === time
                );
                
                if (!wasHandled) {
                    toast({
                        title: `Dose Missed: ${med.name}`,
                        description: `You missed your ${time} dose. Notifying family.`,
                        variant: 'destructive',
                    });

                    await handleFamilyAlert(med, 'dose missed');

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
  }, [activeMedications, adherenceLogs, user, isGuest, handleFamilyAlert, setLocalAdherence, toast]);


  const checkAppointmentReminders = useCallback(async () => {
    if (isGuest || !user) return;

    const now = new Date();
    const acceptedFamilyMember = familyMembers.find(m => m.status === 'accepted');

    for (const appt of activeAppointments) {
      const apptDateTime = parse(`${appt.date} ${appt.time}`, 'yyyy-MM-dd HH:mm', new Date());
      const hoursUntil = differenceInHours(apptDateTime, now);

      const checkAndSend = async (reminderType: '24h' | '1h') => {
        const reminderId = `${appt.id}-${reminderType}`;
        if (!sentAppointmentReminders.includes(reminderId)) {
          const reminderTime = reminderType === '24h' ? 24 : 1;
          
          const sound = new Audio('/notification.mp3');
          sound.play().catch(e => console.error("Failed to play notification sound:", e));
          
          toast({
            title: `Appointment Reminder (${reminderTime}h)`,
            description: `Your appointment with Dr. ${appt.doctorName} is coming up.`,
          });

          if (acceptedFamilyMember) {
            const result = await generateAppointmentReminder({
              patientName: user.displayName || 'A family member',
              familyName: acceptedFamilyMember.name,
              doctorName: appt.doctorName,
              specialty: appt.specialty,
              appointmentDate: appt.date,
              appointmentTime: appt.time,
              reminderTime: `${reminderTime} hour(s)`
            });
            console.log("Appointment Reminder for Family:", result.reminderMessage);
             toast({
                title: 'Family Notified',
                description: `${acceptedFamilyMember.name} was reminded about the appointment.`,
                variant: 'default',
            });
          }
          
          setSentAppointmentReminders(prev => [...prev, reminderId]);
        }
      };

      if (hoursUntil > 23 && hoursUntil <= 24) {
        await checkAndSend('24h');
      }

      if (hoursUntil > 0 && hoursUntil <= 1) {
        await checkAndSend('1h');
      }
    }
  }, [isGuest, user, activeAppointments, sentAppointmentReminders, setSentAppointmentReminders, familyMembers, toast]);


  useEffect(() => {
    const reminderInterval = setInterval(checkReminders, 10000); // Check every 10 seconds
    const missedDoseInterval = setInterval(checkMissedDoses, 60000 * 5); // Check every 5 minutes
    const appointmentReminderInterval = setInterval(checkAppointmentReminders, 60000 * 10); // Check every 10 minutes

    checkReminders();
    checkMissedDoses();
    checkAppointmentReminders();

    return () => {
      clearInterval(reminderInterval);
      clearInterval(missedDoseInterval);
      clearInterval(appointmentReminderInterval);
    };
  }, [checkReminders, checkMissedDoses, checkAppointmentReminders]);


  const handleReminderAction = async (medication: Medication, scheduledTime: string, status: 'taken' | 'skipped' | 'stock_out' | 'muted') => {
    const logEntry: Omit<AdherenceLog, 'id'> = {
      medicationId: medication.id,
      medicationName: medication.name,
      takenAt: new Date().toISOString(),
      status: status,
      userId: user?.uid || 'guest',
      scheduledTime: scheduledTime,
    };

    if (isGuest || !user) {
      setLocalAdherence([...localAdherence, { ...logEntry, id: new Date().toISOString() }]);
    } else {
      await trackAdherence({
          ...logEntry,
          userId: user.uid,
      });
    }

    if (status === 'stock_out') {
        await handleFamilyAlert(medication, 'is out of stock');
    }
    setReminder(null);
  };
  
    const handleSnooze = async (medication: Medication, time: string) => {
        setReminder(null);
        try {
            const pastSnoozes = adherenceLogs
                .filter(log => log.medicationId === medication.id && log.status === 'snoozed')
                .map(log => log.snoozeDuration || 5); // Default to 5 mins if no duration

            const { snoozeInterval, reasoning } = await intelligentSnooze({
                medicationType: medication.dosage,
                pastSnoozeBehavior: pastSnoozes,
                userSchedule: "User has a meeting from 10:00 to 11:00 AM.", // Example schedule
            });
            
            toast({
                title: `Snoozed for ${snoozeInterval} minutes`,
                description: reasoning,
            });

            const notificationId = `${medication.id}-${time}-${format(new Date(), 'yyyy-MM-dd')}`;
            const snoozedTime = addMinutes(new Date(), snoozeInterval);
            
            setSnoozedUntil(prev => ({...prev, [notificationId]: snoozedTime.toISOString() }));
            
            // Log snooze to adherence
            const logEntry: Omit<AdherenceLog, 'id'> = {
                medicationId: medication.id,
                medicationName: medication.name,
                takenAt: new Date().toISOString(),
                status: 'snoozed',
                userId: user?.uid || 'guest',
                scheduledTime: time,
                snoozeDuration: snoozeInterval,
            };

            if (isGuest || !user) {
                setLocalAdherence([...localAdherence, { ...logEntry, id: new Date().toISOString() }]);
            } else {
                await trackAdherence({ ...logEntry, userId: user.uid });
            }

        } catch (error) {
            toast({
                title: "Could not snooze",
                description: "Something went wrong. Please try again.",
                variant: 'destructive'
            });
        }
    };


  const todaysAppointments = useMemo(() => {
    return activeAppointments
      .filter(app => isToday(new Date(app.date)))
      .sort((a,b) => a.time.localeCompare(b.time));
  }, [activeAppointments]);

  const nextAppointment = useMemo(() => {
    const futureAppointments = activeAppointments.filter(app => {
        const appDate = new Date(app.date);
        return isFuture(appDate) || isToday(appDate);
    });
    return futureAppointments[0] || null;
  }, [activeAppointments]);
  
  const nextMedication = useMemo(() => {
    const now = new Date();
    // Find the first medication time in the sorted list that is in the future
    return todaysMedications.find(item => parse(item.time, 'HH:mm', new Date()) > now) || null;
  }, [todaysMedications]);


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
            medication={reminder.medication}
            time={reminder.time}
            onTake={() => handleReminderAction(reminder.medication, reminder.time, 'taken')}
            onSkip={() => handleReminderAction(reminder.medication, reminder.time, 'muted')}
            onStockOut={() => handleReminderAction(reminder.medication, reminder.time, 'stock_out')}
            onSnooze={() => handleSnooze(reminder.medication, reminder.time)}
        />
    )}
    <div className="container mx-auto max-w-2xl p-4 space-y-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">{greeting}, {user?.displayName || 'Guest'}!</h1>
        <p className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
      </header>
      
      {nextMedication && (
        <Card className="bg-primary/10 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <PillIcon/>
                    Next Medication
                </CardTitle>
            </CardHeader>
            <CardContent>
                <MedicationCard medication={nextMedication.data} specificTime={nextMedication.time} />
            </CardContent>
        </Card>
      )}
      
      {nextAppointment && (
        <Card className="bg-primary/10 border-primary/20">
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
          {todaysMedications.length > 0 ? (
            <div className="space-y-4">
              {todaysMedications.map((item, index) => (
                  <MedicationCard key={`${item.data.id}-${item.time}-${index}`} medication={item.data} specificTime={item.time} />
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

    

    