
'use client';

import { ReactNode, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BottomNavbar } from '@/components/bottom-navbar';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import { doc, getDoc, updateDoc, collection, onSnapshot, query, orderBy, where, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Medication, Appointment, AdherenceLog, FamilyMember, UserProfile, FamilyAlert } from '@/lib/types';
import { MedicationReminderDialog } from '@/components/medication-reminder-dialog';
import { FamilyAlertDialog } from '@/components/family-alert-dialog';
import { format, parse, isToday, isFuture, differenceInHours, isBefore, startOfDay } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { generateAppointmentReminder } from '@/ai/flows/appointment-reminder-flow';
import { generateFamilyAlert } from '@/ai/flows/generate-family-alert-flow';
import { trackAdherence } from '@/ai/flows/track-adherence-flow';
import { type ReminderSettings } from '@/app/(main)/settings/notifications/page';

export default function MainLayout({ children }: { children: ReactNode }) {
  const { user, loading, isGuest } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  const [localMedications, setLocalMedications] = useLocalStorage<Medication[]>('guest-medications', []);
  const [localAppointments, setLocalAppointments] = useLocalStorage<Appointment[]>('guest-appointments', []);
  const [localAdherence, setLocalAdherence] = useLocalStorage<AdherenceLog[]>('guest-adherence', []);
  const [sentAppointmentReminders, setSentAppointmentReminders] = useLocalStorage<string[]>('sent-appointment-reminders', []);
  const [reminderSettings] = useLocalStorage<ReminderSettings>('reminder-settings', { 
    initialDuration: 1, 
    secondAlertDelay: 3,
    familyAlert: 10 
  });

  const [firestoreMedications, setFirestoreMedications] = useState<Medication[]>([]);
  const [firestoreAppointments, setFirestoreAppointments] = useState<Appointment[]>([]);
  const [firestoreAdherence, setFirestoreAdherence] = useState<AdherenceLog[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [adherenceLoading, setAdherenceLoading] = useState(true);

  const [reminder, setReminder] = useState<{ medications: Medication[]; time: string } | null>(null);
  const [activeFamilyAlert, setActiveFamilyAlert] = useState<FamilyAlert | null>(null);

  const reminderTimers = useRef<Record<string, NodeJS.Timeout[]>>({});
  const initialLoadCheckDone = useRef(false);

  const noNavPaths = ['/login', '/signup', '/'];
  const showNav = !noNavPaths.includes(pathname) && !pathname.startsWith('/admin');

  useEffect(() => {
    if (user && !isGuest) {
      const medUnsub = onSnapshot(collection(db, 'users', user.uid, 'medications'), (snapshot) => {
        setFirestoreMedications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Medication)));
      });

      const apptQuery = query(collection(db, 'users', user.uid, 'appointments'), orderBy('date', 'asc'));
      const apptUnsub = onSnapshot(apptQuery, (snapshot) => {
        setFirestoreAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment)));
      });

      const adherenceUnsub = onSnapshot(collection(db, 'users', user.uid, 'adherenceLogs'), (snapshot) => {
        setFirestoreAdherence(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdherenceLog)));
        setAdherenceLoading(false);
      });
      
      const familyUnsub = onSnapshot(collection(db, 'users', user.uid, 'familyMembers'), (snapshot) => {
          setFamilyMembers(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()} as FamilyMember)));
      });
      
      const userProfileUnsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
            setUserProfile(doc.data() as UserProfile);
        }
      });
      
      const familyAlertQuery = query(collection(db, 'familyAlerts'), where('familyMemberId', '==', user.uid));
      const familyAlertUnsub = onSnapshot(familyAlertQuery, (snapshot) => {
          if (!snapshot.empty) {
              const latestAlert = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() } as FamilyAlert))
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
              setActiveFamilyAlert(latestAlert);
          } else {
              setActiveFamilyAlert(null);
          }
      });

      return () => {
        medUnsub();
        apptUnsub();
        adherenceUnsub();
        familyUnsub();
        userProfileUnsub();
        familyAlertUnsub();
        Object.values(reminderTimers.current).forEach(timers => timers.forEach(clearTimeout));
      };
    } else {
      setFirestoreMedications([]);
      setFirestoreAppointments([]);
      setFirestoreAdherence([]);
      setFamilyMembers([]);
      setUserProfile(null);
      setAdherenceLoading(false);
    }
  }, [user, isGuest]);

  const activeMedications = isGuest ? localMedications : firestoreMedications;
  const activeAppointments = isGuest ? localAppointments : firestoreAppointments;
  const adherenceLogs = isGuest ? localAdherence : firestoreAdherence;

  const todaysMedicationsByTime = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const todaysMeds = activeMedications.filter(med => {
        if (med.frequency === 'Daily') return true;
        if (med.frequency === 'Weekly') return med.daysOfWeek?.includes(dayOfWeek);
        if (med.frequency === 'Monthly') return med.dayOfMonth === today.getDate();
        return false;
    });
    return todaysMeds.reduce((acc, med) => {
        med.times.forEach(time => {
            if (!acc[time]) acc[time] = [];
            acc[time].push(med);
        });
        return acc;
    }, {} as Record<string, Medication[]>);
  }, [activeMedications]);

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
        reminderId: medication.id,
        reminderType: 'medicine',
        reminderContent: medication.name,
        takenAt: new Date().toISOString(),
        status: status,
        userId: user?.uid || 'guest',
        scheduledTime: scheduledTime,
      };

      if (isGuest || !user) {
        setLocalAdherence(prev => [...prev, { ...logEntry, id: new Date().toISOString() }]);
        return Promise.resolve();
      } else {
        if ((status === 'missed' || status === 'stock_out') && familyMembers.length > 0 && userProfile?.isPremium) {
            familyMembers.forEach(member => {
                if (member.status === 'accepted') {
                     generateFamilyAlert({
                        patientName: user?.displayName || 'A user',
                        medicationName: medication.name,
                        familyName: member.name,
                        familyMemberId: member.uid,
                        reason: status,
                    });
                }
            });
        }
        return trackAdherence({ ...logEntry, userId: user.uid });
      }
    });
    await Promise.all(logPromises);
    setReminder(null);
  }, [user, isGuest, setLocalAdherence, clearReminderTimers, familyMembers, userProfile]);
  
  const logMissedDoseAndAlertFamily = useCallback(async (medications: Medication[], scheduledTime: string) => {
    handleReminderAction(medications, scheduledTime, 'missed');
  }, [handleReminderAction]);

  const checkReminders = useCallback(() => {
    const now = new Date();
    for (const time in todaysMedicationsByTime) {
      const medications = todaysMedicationsByTime[time];
      const scheduledTime = parse(time, 'HH:mm', new Date());
      const notificationId = `${medications[0].id}-${time}-${format(now, 'yyyy-MM-dd')}`;
      
      const isHandled = medications.some(med => 
        adherenceLogs.some(log => 
          log.reminderId === med.id && isToday(new Date(log.takenAt)) && log.scheduledTime === time
        )
      );

      if (isBefore(now, scheduledTime) || isHandled || reminderTimers.current[notificationId]) continue;
      
      const showReminder = () => {
          setReminder({ medications, time });
           try {
              if (typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator) {
                if (Notification.permission === "granted") {
                    navigator.serviceWorker.getRegistration().then(reg => {
                        if (reg) {
                            reg.showNotification("Time for your medication!", {
                                body: `It's time for your ${format(scheduledTime, 'h:mm a')} dose.`,
                                icon: "/icons/icon-192x192.png"
                            });
                        }
                    });
                }
              }
          } catch (e) { console.error("Notification API error: ", e); }
      };

      reminderTimers.current[notificationId] = [];
      const t1 = setTimeout(showReminder, 0); 
      const t2 = setTimeout(() => setReminder(null), reminderSettings.initialDuration * 60 * 1000);
      const t3 = setTimeout(showReminder, reminderSettings.secondAlertDelay * 60 * 1000);
      const t4 = setTimeout(() => setReminder(null), (reminderSettings.secondAlertDelay + reminderSettings.initialDuration) * 60 * 1000);
      const t5 = setTimeout(() => logMissedDoseAndAlertFamily(medications, time), reminderSettings.familyAlert * 60 * 1000);
      reminderTimers.current[notificationId].push(t1, t2, t3, t4, t5);
    }
  }, [todaysMedicationsByTime, adherenceLogs, reminderSettings, logMissedDoseAndAlertFamily]);

  const checkMissedDosesOnLoad = useCallback(async () => {
    if (adherenceLoading || initialLoadCheckDone.current) return;
    initialLoadCheckDone.current = true;

    const now = new Date();
    let missedCount = 0;
  
    for (const time in todaysMedicationsByTime) {
      const medications = todaysMedicationsByTime[time];
      const scheduledTime = parse(time, 'HH:mm', startOfDay(now));
      
      if (isBefore(scheduledTime, now)) {
        for(const med of medications) {
            const isHandled = adherenceLogs.some(log => log.reminderId === med.id && isToday(new Date(log.takenAt)) && log.scheduledTime === time);
            if (!isHandled) {
                missedCount++;
                const logEntry: Omit<AdherenceLog, 'id'> = {
                  reminderId: med.id, reminderType: 'medicine', reminderContent: med.name,
                  takenAt: new Date().toISOString(), status: 'missed', userId: user?.uid || 'guest', scheduledTime: time,
                };
                 if (isGuest || !user) setLocalAdherence(prev => [...prev, { ...logEntry, id: new Date().toISOString() }]);
                 else await trackAdherence({ ...logEntry, userId: user.uid });
            }
        }
      }
    }
    if(missedCount > 0) {
        toast({
            title: "You have missed doses!",
            description: `We've logged ${missedCount} missed dose${missedCount > 1 ? 's' : ''} from earlier today. Check your reports for details.`,
            variant: "destructive", duration: 10000,
        });
    }
  }, [todaysMedicationsByTime, adherenceLogs, toast, user, isGuest, setLocalAdherence, adherenceLoading]);

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
              patientName: user.displayName || 'User', doctorName: appt.doctorName, specialty: appt.specialty,
              appointmentDate: appt.date, appointmentTime: appt.time, reminderTime: `${reminderTime} hour(s)`
          });
          toast({ title: `Appointment Reminder (${reminderTime}h)`, description: result.reminderMessage });
          if (familyMembers.length > 0 && userProfile?.isPremium) {
            for (const member of familyMembers) { if(member.status === 'accepted') toast({ title: `Family Alert Sent`, description: `Notified ${member.name} about ${user.displayName}'s upcoming appointment.` }) }
          }
          setSentAppointmentReminders(prev => [...prev, reminderId]);
        }
      };
      if (hoursUntil > 23 && hoursUntil <= 24) await checkAndSend('24h');
      if (hoursUntil > 2 && hoursUntil <= 3) await checkAndSend('3h');
    }
  }, [isGuest, user, activeAppointments, sentAppointmentReminders, setSentAppointmentReminders, toast, familyMembers, userProfile]);

  useEffect(() => { checkMissedDosesOnLoad(); }, [checkMissedDosesOnLoad]);
  useEffect(() => {
    const reminderInterval = setInterval(checkReminders, 5000);
    const appointmentReminderInterval = setInterval(checkAppointmentReminders, 60000 * 5);
    return () => {
        clearInterval(reminderInterval);
        clearInterval(appointmentReminderInterval);
        Object.values(reminderTimers.current).forEach(timers => timers.forEach(clearTimeout));
    };
  }, [checkReminders, checkAppointmentReminders]);

  useEffect(() => {
    if (pathname?.startsWith('/admin')) return;
    if (!loading && !user && !isGuest) router.push('/login');
  }, [user, loading, router, isGuest, pathname]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js')
          .then(reg => console.log('Service Worker Registered', reg))
          .catch(err => console.error('SW registration failed', err));
    }
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (user && !isGuest) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.isPremium && userData.premiumEndDate) {
            const endDate = new Date(userData.premiumEndDate);
            if (endDate < new Date()) await updateDoc(userRef, { isPremium: false, premiumCycle: null, premiumEndDate: null });
          }
        }
      }
    };
    checkPremiumStatus();
  }, [user, isGuest]);
  
  const handleAlertClose = async (alertId: string) => {
    try {
        await deleteDoc(doc(db, 'familyAlerts', alertId));
        setActiveFamilyAlert(null);
    } catch (e) {
        toast({ title: 'Error', description: 'Could not dismiss the alert. It may reappear.', variant: 'destructive' });
    }
  }

  if (loading && !isGuest && !pathname.startsWith('/admin')) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }
  if (pathname?.startsWith('/admin')) return <>{children}</>;
  if (!user && !isGuest) return null;

  return (
    <>
      {reminder && (
          <MedicationReminderDialog
              isOpen={!!reminder} medications={reminder.medications} time={reminder.time}
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
      {activeFamilyAlert && <FamilyAlertDialog isOpen={!!activeFamilyAlert} alert={activeFamilyAlert} onClose={() => handleAlertClose(activeFamilyAlert.id)} />}
      <div className="flex min-h-screen flex-col">
        <main className="flex-1 pb-24">{children}</main>
        {showNav && <BottomNavbar />}
      </div>
    </>
  );
}
