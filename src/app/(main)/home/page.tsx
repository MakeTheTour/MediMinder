'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Medication, Appointment } from '@/lib/types';
import { MedicationCard } from '@/components/medication-card';
import { AppointmentCard } from '@/components/appointment-card';
import { format } from 'date-fns';
import { useAuth } from '@/context/auth-context';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function HomePage() {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    if (!user) return;

    const medUnsub = onSnapshot(collection(db, 'users', user.uid, 'medications'), (snapshot) => {
        setMedications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Medication)));
    });

    const apptUnsub = onSnapshot(collection(db, 'users', user.uid, 'appointments'), (snapshot) => {
        setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment)));
    });

    return () => {
        medUnsub();
        apptUnsub();
    }
  }, [user]);

  const todaysAppointments = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    return appointments.filter(app => app.date === todayStr);
  }, [appointments]);

  const todaysMedications = useMemo(() => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    return medications.filter(med => {
        if (med.frequency === 'Daily') return true;
        if (med.frequency === 'Weekly') return med.daysOfWeek?.includes(dayOfWeek);
        if (med.frequency === 'Monthly') return med.dayOfMonth === today.getDate();
        return false;
    });
  }, [medications]);


  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const sortedSchedule = useMemo(() => {
    return [
      ...todaysMedications.flatMap(med => med.times.map(time => ({ type: 'medication' as const, time, data: med }))),
      ...todaysAppointments.map(app => ({ type: 'appointment' as const, time: app.time, data: app }))
    ].sort((a, b) => a.time.localeCompare(b.time));
  }, [todaysMedications, todaysAppointments]);


  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">{greeting}, {user?.displayName || 'User'}!</h1>
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
                   <MedicationCard key={`${item.data.id}-${item.time}`} medication={item.data} specificTime={item.time} />
                ) : (
                  <AppointmentCard key={item.data.id} appointment={item.data} />
                )
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-muted-foreground mb-4">You have a clear schedule today!</p>
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
