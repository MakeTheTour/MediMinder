'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Medication } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MedicationCard } from '@/components/medication-card';
import { AppointmentCard } from '@/components/appointment-card';
import { Appointment } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function MedicinePage() {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const { toast } = useToast();

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

  const handleDeleteMedication = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'medications', id));
      toast({ title: "Medication Deleted", description: "The medication has been removed from your schedule."});
    } catch (error) {
      toast({ title: "Error", description: "Could not delete medication. Please try again.", variant: "destructive"});
    }
  };
  
  const handleDeleteAppointment = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'appointments', id));
       toast({ title: "Appointment Deleted", description: "The appointment has been removed from your schedule."});
    } catch (error) {
       toast({ title: "Error", description: "Could not delete appointment. Please try again.", variant: "destructive"});
    }
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
