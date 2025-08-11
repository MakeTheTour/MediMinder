'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Medication } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MedicationCard } from '@/components/medication-card';
import { AppointmentCard } from '@/components/appointment-card';
import { Appointment } from '@/lib/types';

export default function MedicinePage() {
  const [medications, setMedications] = useLocalStorage<Medication[]>('medications', []);
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('appointments', []);

  const handleDeleteMedication = (id: string) => {
    setMedications(meds => meds.filter(m => m.id !== id));
  };
  
  const handleDeleteAppointment = (id: string) => {
    setAppointments(apps => apps.filter(a => a.id !== id));
  };

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Schedule</h1>
        <div className="flex gap-2">
            <Button asChild size="sm">
                <Link href="/medicine/add">
                <Plus className="mr-2 h-4 w-4" /> Medication
                </Link>
            </Button>
            <Button asChild size="sm" variant="secondary">
                <Link href="/appointments/add">
                <Plus className="mr-2 h-4 w-4" /> Appointment
                </Link>
            </Button>
        </div>
      </header>

      <section>
        <h2 className="text-xl font-semibold mb-4">Medications</h2>
        {medications.length > 0 ? (
          <div className="space-y-4">
            {medications.map(med => (
              <MedicationCard key={med.id} medication={med} onDelete={handleDeleteMedication} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No medications added yet.</p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Appointments</h2>
        {appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map(app => (
              <AppointmentCard key={app.id} appointment={app} onDelete={handleDeleteAppointment} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-4">No appointments scheduled.</p>
        )}
      </section>
    </div>
  );
}
