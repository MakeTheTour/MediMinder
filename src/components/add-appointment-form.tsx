'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

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
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Appointment } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"

const appointmentSchema = z.object({
  doctorName: z.string().min(1, 'Doctor name is required.'),
  specialty: z.string().min(1, 'Specialty is required.'),
  date: z.string().min(1, 'Date is required.'),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)'),
  location: z.string().min(1, 'Location is required.'),
});


export function AddAppointmentForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [appointments, setAppointments] = useLocalStorage<Appointment[]>('appointments', []);

  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      doctorName: '',
      specialty: '',
      date: '',
      time: '10:00',
      location: '',
    },
  });

  function onSubmit(values: z.infer<typeof appointmentSchema>) {
    const newAppointment: Appointment = {
      id: new Date().toISOString(),
      ...values,
    };
    setAppointments([...appointments, newAppointment]);
    toast({
        title: "Appointment Scheduled",
        description: `Your appointment with Dr. ${values.doctorName} has been added.`,
      })
    router.push('/medicine');
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
        <Button type="submit" className="w-full">Save Appointment</Button>
      </form>
    </Form>
  );
}
