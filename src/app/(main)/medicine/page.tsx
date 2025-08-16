
'use client';

import Link from 'next/link';
import { Plus, Pill, Stethoscope, CalendarPlus } from 'lucide-react';
import { Medication } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MedicationCard } from '@/components/medication-card';
import { AppointmentCard } from '@/components/appointment-card';
import { Appointment } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useRouter } from 'next/navigation';

export default function MedicinePage() {
  const { user, isGuest } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const [localMedications, setLocalMedications] = useLocalStorage<Medication[]>('guest-medications', []);
  const [localAppointments, setLocalAppointments] = useLocalStorage<Appointment[]>('guest-appointments', []);
  
  const [firestoreMedications, setFirestoreMedications] = useState<Medication[]>([]);
  const [firestoreAppointments, setFirestoreAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!user || isGuest) {
        setFirestoreMedications([]);
        setFirestoreAppointments([]);
        return;
    };

    const medUnsub = onSnapshot(collection(db, 'users', user.uid, 'medications'), (snapshot) => {
      setFirestoreMedications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Medication)));
    });

    const apptUnsub = onSnapshot(collection(db, 'users', user.uid, 'appointments'), (snapshot) => {
      setFirestoreAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment)));
    });

    return () => {
      medUnsub();
      apptUnsub();
    }
  }, [user, isGuest]);

  const medications = isGuest ? localMedications : firestoreMedications;
  const appointments = isGuest ? localAppointments : firestoreAppointments;

  const handleEditMedication = (id: string) => {
    router.push(`/medicine/edit/${id}`);
  };

  const handleEditAppointment = (id: string) => {
    router.push(`/appointments/edit/${id}`);
  };

  const handleDeleteMedication = async (id: string) => {
    if(isGuest) {
      setLocalMedications(localMedications.filter(med => med.id !== id));
      toast({ title: "Medication Removed", description: "The medication has been removed from your local schedule."});
      return;
    }
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'medications', id));
      toast({ title: "Medication Deleted", description: "The medication has been removed from your schedule."});
    } catch (error) {
      toast({ title: "Error", description: "Could not delete medication. Please try again.", variant: "destructive"});
    }
  };
  
  const handleDeleteAppointment = async (id: string) => {
    if (isGuest) {
      setLocalAppointments(localAppointments.filter(app => app.id !== id));
      toast({ title: "Appointment Removed", description: "The appointment has been removed from your local schedule."});
      return;
    }
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'appointments', id));
       toast({ title: "Appointment Deleted", description: "The appointment has been removed from your schedule."});
    } catch (error) {
       toast({ title: "Error", description: "Could not delete appointment. Please try again.", variant: "destructive"});
    }
  };

  const EmptyState = ({ title, description, buttonText, buttonLink, icon: Icon }: { title: string, description: string, buttonText: string, buttonLink: string, icon: React.ElementType }) => (
    <div className="text-center py-12">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
        <Icon className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <Button asChild size="sm" className="mt-4">
        <Link href={buttonLink}>
          <Plus className="mr-2 h-4 w-4" /> {buttonText}
        </Link>
      </Button>
      {isGuest && (
        <p className="text-sm text-muted-foreground mt-4">
          <Link href="/login" className="text-primary underline">Sign in</Link> to save your data.
        </p>
      )}
    </div>
  );

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6 flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold">My Schedule</h1>
            <p className="text-muted-foreground">Manage all your medications and appointments in one place.</p>
        </div>
         <Button asChild size="sm">
            <Link href={"/medicine/add"}>
                <Plus className="mr-2 h-4 w-4" /> Add New
            </Link>
        </Button>
      </header>

      <Tabs defaultValue="medications" className="w-full">
        <TabsList className="mb-4">
            <TabsTrigger value="medications">
                <Pill className="mr-2 h-4 w-4" />
                Medications
            </TabsTrigger>
            <TabsTrigger value="appointments">
                <Stethoscope className="mr-2 h-4 w-4" />
                Appointments
            </TabsTrigger>
        </TabsList>
        <TabsContent value="medications">
          <Card>
            <CardContent className="p-4">
               {medications.length > 0 ? (
                <div className="space-y-4">
                  {medications.map(med => (
                    <MedicationCard key={med.id} medication={med} onDelete={handleDeleteMedication} onEdit={handleEditMedication} />
                  ))}
                </div>
              ) : (
                <EmptyState 
                  title="No Medications Added"
                  description="Keep track of your prescriptions by adding them here."
                  buttonText="Add Medication"
                  buttonLink="/medicine/add"
                  icon={Pill}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="appointments">
          <Card>
             <CardContent className="p-4">
              {appointments.length > 0 ? (
                <div className="space-y-4">
                  {appointments.map(app => (
                    <AppointmentCard key={app.id} appointment={app} onDelete={handleDeleteAppointment} onEdit={handleEditAppointment}/>
                  ))}
                </div>
              ) : (
                <EmptyState 
                  title="No Appointments Scheduled"
                  description="Never miss a doctor's visit. Add your appointments now."
                  buttonText="Add Appointment"
                  buttonLink="/appointments/add"
                  icon={CalendarPlus}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
