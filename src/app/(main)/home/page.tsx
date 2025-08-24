
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, Stethoscope, Pill as PillIcon, CalendarDays } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Medication, Appointment, UserProfile } from '@/lib/types';
import { AppointmentCard } from '@/components/appointment-card';
import { format, parse, isToday, isFuture } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { GroupedMedicationCard } from '@/components/grouped-medication-card';
import { AdCard } from '@/components/ad-card';

export default function HomePage() {
  const { user, isGuest } = useAuth();

  const [localMedications] = useLocalStorage<Medication[]>('guest-medications', []);
  const [localAppointments] = useLocalStorage<Appointment[]>('guest-appointments', []);

  const [firestoreMedications, setFirestoreMedications] = useState<Medication[]>([]);
  const [firestoreAppointments, setFirestoreAppointments] = useState<Appointment[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    if (user && !isGuest) {
      const medUnsub = onSnapshot(collection(db, 'users', user.uid, 'medications'), (snapshot) => {
        setFirestoreMedications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Medication)));
      });

      const apptQuery = query(collection(db, 'users', user.uid, 'appointments'), orderBy('date', 'asc'));
      const apptUnsub = onSnapshot(apptQuery, (snapshot) => {
        setFirestoreAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment)));
      });
      
      const userProfileUnsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        if (doc.exists()) {
            setUserProfile(doc.data() as UserProfile);
        }
      });

      return () => {
        medUnsub();
        apptUnsub();
        userProfileUnsub();
      };
    } else {
      setFirestoreMedications([]);
      setFirestoreAppointments([]);
      setUserProfile(null);
    }
  }, [user, isGuest]);

  const activeMedications = isGuest ? localMedications : firestoreMedications;
  const activeAppointments = isGuest ? localAppointments : firestoreAppointments;

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

  const todaysAppointments = useMemo(() => {
    return activeAppointments
      .filter(app => isToday(parse(app.date, 'yyyy-MM-dd', new Date())))
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
    <div className="container mx-auto max-w-2xl p-4 space-y-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">{greeting}, {user?.displayName || 'Guest'}!</h1>
        <p className="text-muted-foreground">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>
      </header>
      
      {!userProfile?.isPremium && (
        <Card>
            <CardContent className="p-0">
                <AdCard />
            </CardContent>
        </Card>
      )}

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
          <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><CalendarDays/> Today's Appointments</CardTitle>
                <CardDescription>Your appointments for today.</CardDescription>
              </div>
              <Button asChild size="sm" variant="outline">
                  <Link href="/appointments/add">
                    <Plus className="mr-2 h-4 w-4" /> Add Appointment
                  </Link>
              </Button>
          </div>
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
  );
}

    