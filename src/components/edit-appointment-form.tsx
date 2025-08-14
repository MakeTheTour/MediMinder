
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Appointment } from '@/lib/types';

const appointmentSchema = z.object({
  doctorName: z.string().min(1, 'Doctor name is required.'),
  specialty: z.string().min(1, 'Specialty is required.'),
  date: z.string().min(1, 'Date is required.'),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  location: z.string().min(1, 'Location is required.'),
  notes: z.string().optional(),
});

interface EditAppointmentFormProps {
    appointmentId: string;
}

export function EditAppointmentForm({ appointmentId }: EditAppointmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isGuest } = useAuth();
  const [localAppointments, setLocalAppointments] = useLocalStorage<Appointment[]>('guest-appointments', []);

  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      doctorName: '',
      specialty: '',
      date: '',
      time: '',
      location: '',
      notes: '',
    },
  });

  useEffect(() => {
    const fetchAppointmentData = async () => {
        if (isGuest) {
            const apptToEdit = localAppointments.find(a => a.id === appointmentId);
            if (apptToEdit) {
                form.reset(apptToEdit);
            }
        } else if (user) {
            const docRef = doc(db, "users", user.uid, "appointments", appointmentId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                form.reset(docSnap.data());
            } else {
                toast({ title: "Error", description: "Appointment not found.", variant: "destructive" });
                router.push('/medicine');
            }
        }
    };
    fetchAppointmentData();
  }, [user, isGuest, appointmentId, form, router, toast, localAppointments]);


  async function onSubmit(values: z.infer<typeof appointmentSchema>) {
    if (isGuest) {
        const updatedAppointments = localAppointments.map(appt => appt.id === appointmentId ? { ...appt, ...values } : appt);
        setLocalAppointments(updatedAppointments);
        toast({
            title: "Appointment Updated Locally",
            description: `Your appointment with Dr. ${values.doctorName} has been updated.`,
        });
        router.push('/medicine');
        return;
    }
    
    if (!user) {
        toast({ title: "Not Signed In", description: "Please sign in to update appointments.", variant: "destructive" });
        return;
    }
    
    try {
        const apptRef = doc(db, 'users', user.uid, 'appointments', appointmentId);
        await updateDoc(apptRef, values);
        toast({
            title: "Appointment Updated",
            description: `Your appointment with Dr. ${values.doctorName} has been updated.`,
        });
        router.push('/medicine');
    } catch (error) {
        console.error("Error updating document: ", error);
        toast({ title: "Error", description: "Could not update appointment. Please try again.", variant: "destructive"});
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="doctorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Doctor's Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="specialty"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Specialty</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Cardiologist" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                    <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Time</FormLabel>
                <FormControl>
                    <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., City Hospital, 2nd Floor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Problem Notes for Visit</FormLabel>
              <FormControl>
                <Textarea placeholder="e.g., Experiencing mild headaches, check blood pressure..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  );
}
