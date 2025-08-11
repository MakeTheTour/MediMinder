
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Medication, Appointment, AdherenceLog, FamilyMember } from '@/lib/types';
import { MedicationCard } from '@/components/medication-card';
import { AppointmentCard } from '@/components/appointment-card';
import { format, parse } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { MedicationReminderDialog } from '@/components/medication-reminder-dialog';
import { trackAdherence } from '@/ai/flows/track-adherence-flow';
import { useToast } from '@/hooks/use-toast';
import { generateFamilyAlert } from '@/ai/flows/family-alert-flow';

export default function HomePage() {
  const { user, isGuest } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [localMedications, setLocalMedications] = useLocalStorage<Medication[]>('guest-medications', []);
  const [localAppointments, setLocalAppointments] = useLocalStorage<Appointment[]>('guest-appointments', []);
  const [localAdherence, setLocalAdherence] = useLocalStorage<AdherenceLog[]>('guest-adherence', []);

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

      const apptUnsub = onSnapshot(collection(db, 'users', user.uid, 'appointments'), (snapshot) => {
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
  }, [user, isGuest, setLocalMedications, setLocalAppointments, setLocalAdherence]);

  const activeMedications = isGuest ? localMedications : firestoreMedications;
  const activeAppointments = isGuest ? localAppointments : firestoreAppointments;
  const adherenceLogs = isGuest ? localAdherence : firestoreAdherence;

  const todaysMedications = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // Sunday - 0, Monday - 1
    return activeMedications.filter(med => {
        if (med.frequency === 'Daily') return true;
        if (med.frequency === 'Weekly') return med.daysOfWeek?.includes(dayOfWeek);
        if (med.frequency === 'Monthly') return med.dayOfMonth === today.getDate();
        return false;
    });
  }, [activeMedications]);

    const handleFamilyAlert = useCallback(async (medication: Medication) => {
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
                medicationName: medication.name,
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
    if (reminder) return; // Don't check for new reminders if one is already showing

    const now = new Date();
    
    for (const med of todaysMedications) {
      for (const time of med.times) {
        const reminderTime = parse(time, 'HH:mm', new Date());
        
        // Check if a log already exists for this specific medication at this specific time on this day
        const alreadyHandled = adherenceLogs.some(
          log => log.medicationId === med.id && 
                 format(new Date(log.takenAt), 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd') &&
                 format(parse(time, 'HH:mm', new Date()), 'HH:mm') === format(reminderTime, 'HH:mm')
        );
        
        if (now >= reminderTime && !alreadyHandled) {
          setReminder({ medication: med, time });
          return; // Show one reminder at a time
        }
      }
    }
  }, [adherenceLogs, todaysMedications, reminder]);

  useEffect(() => {
    const interval = setInterval(checkReminders, 30000); // Check every 30 seconds
    checkReminders(); // Check immediately on load

    return () => clearInterval(interval);
  }, [checkReminders]);


  const handleReminderAction = async (medication: Medication, status: 'taken' | 'skipped') => {
    const logEntry: Omit<AdherenceLog, 'id'> = {
      medicationId: medication.id,
      medicationName: medication.name,
      takenAt: new Date().toISOString(),
      status: status,
      userId: user?.uid || 'guest'
    };

    if (isGuest || !user) {
      setLocalAdherence([...localAdherence, { ...logEntry, id: new Date().toISOString() }]);
    } else {
      await trackAdherence({
          medicationId: medication.id,
          medicationName: medication.name,
          takenAt: new Date().toISOString(),
          status: status,
          userId: user.uid,
      });
    }

    if (status === 'skipped') {
        handleFamilyAlert(medication);
    }
    setReminder(null);
  };


  const todaysAppointments = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    return activeAppointments.filter(app => app.date === todayStr);
  }, [activeAppointments]);


  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const sortedSchedule = useMemo(() => {
    const items = [
      ...todaysMedications.flatMap(med => med.times.map(time => ({ type: 'medication' as const, time, data: med }))),
      ...todaysAppointments.map(app => ({ type: 'appointment' as const, time: app.time, data: app }))
    ];
    return items.sort((a, b) => a.time.localeCompare(b.time));
  }, [todaysMedications, todaysAppointments]);


  return (
    <>
    {reminder && (
        <MedicationReminderDialog
            isOpen={!!reminder}
            medication={reminder.medication}
            time={reminder.time}
            onTake={() => handleReminderAction(reminder.medication, 'taken')}
            onSkip={() => handleReminderAction(reminder.medication, 'skipped')}
        />
    )}
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">{greeting}, {user?.displayName || 'Guest'}!</h1>
        <p className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Today's Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedSchedule.length > 0 ? (
            <div className="space-y-4">
              {sortedSchedule.map((item, index) => (
                item.type === 'medication' ? (
                   <MedicationCard key={`${item.data.id}-${item.time}`} medication={item.data} specificTime={item.time} onFamilyAlert={() => handleFamilyAlert(item.data)} />
                ) : (
                  <AppointmentCard key={item.data.id} appointment={item.data} />
                )
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-4">{isGuest ? "Try adding a medication or appointment to see it here." : "You have no items on your schedule today!"}</p>
              <div className="flex justify-center gap-4">
                <Button asChild>
                  <Link href="/medicine/add">
                    <Plus className="mr-2 h-4 w-4" /> Add Medication
                  </Link>
                </Button>
                 <Button asChild variant="secondary">
                   <Link href="/appointments/add">
                    <Plus className="mr-2 h-4 w-4" /> Add Appointment
                  </Link>
                </Button>
              </div>
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
