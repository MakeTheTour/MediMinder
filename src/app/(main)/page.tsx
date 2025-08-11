'use client';

import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Medication, Appointment } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { MedicationCard } from '@/components/medication-card';
import { AppointmentCard } from '@/components/appointment-card';
import { format } from 'date-fns';

export default function HomePage() {
  const [medications] = useLocalStorage<Medication[]>('medications', []);
  const [appointments] = useLocalStorage<Appointment[]>('appointments', []);
  const [greeting, setGreeting] = useState('');
  const [todaysMedications, setTodaysMedications] = useState<Medication[]>([]);
  const [todaysAppointments, setTodaysAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');

    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const dayOfWeek = today.getDay();

    const filteredMeds = medications.filter(med => {
        if (med.frequency === 'Daily') return true;
        if (med.frequency === 'Weekly') return med.daysOfWeek?.includes(dayOfWeek);
        if (med.frequency === 'Monthly') return med.dayOfMonth === today.getDate();
        return false;
    });
    setTodaysMedications(filteredMeds);

    const filteredAppointments = appointments.filter(app => app.date === todayStr);
    setTodaysAppointments(filteredAppointments);

  }, [medications, appointments]);

  const sortedSchedule = [
    ...todaysMedications.flatMap(med => med.times.map(time => ({ type: 'medication' as const, time, data: med }))),
    ...todaysAppointments.map(app => ({ type: 'appointment' as const, time: app.time, data: app }))
  ].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">{greeting}</h1>
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
