
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { HealthMetric } from '@/lib/types';
import { format } from 'date-fns';

const healthMetricSchema = z.object({
  date: z.string(),
  weight: z.coerce.number().optional(),
  systolic: z.coerce.number().optional(),
  diastolic: z.coerce.number().optional(),
  bloodSugar: z.coerce.number().optional(),
  heartRate: z.coerce.number().optional(),
}).refine(data => {
    return !!data.weight || !!data.systolic || !!data.diastolic || !!data.bloodSugar || !!data.heartRate;
}, {
    message: "At least one health metric must be filled.",
    path: ['weight'], // you can assign this error to any field
});


export function AddHealthMetricForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isGuest } = useAuth();
  const [localHealthMetrics, setLocalHealthMetrics] = useLocalStorage<HealthMetric[]>('guest-health-metrics', []);

  const form = useForm<z.infer<typeof healthMetricSchema>>({
    resolver: zodResolver(healthMetricSchema),
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
    },
  });

  async function onSubmit(values: z.infer<typeof healthMetricSchema>) {
    if (isGuest || !user) {
        toast({
            title: "Not Signed In",
            description: "Please sign in to save your health data.",
            variant: "destructive"
        });
        return;
    }
    
    const healthMetricData: Omit<HealthMetric, 'id' | 'userId'> & {userId?: string} = {
        date: new Date(values.date).toISOString(),
        weight: values.weight,
        bloodPressure: (values.systolic && values.diastolic) ? { systolic: values.systolic, diastolic: values.diastolic } : undefined,
        bloodSugar: values.bloodSugar,
        heartRate: values.heartRate,
    }
    
    const finalData: Omit<HealthMetric, 'id'> = {
        ...healthMetricData,
        userId: user.uid,
    }

    try {
        await addDoc(collection(db, 'users', user.uid, 'healthMetrics'), finalData);
        toast({
            title: "Health Data Saved",
            description: `Your metrics for ${format(new Date(values.date), 'MMMM d')} have been logged.`,
        });
        router.push('/health');
    } catch (error) {
        console.error("Error adding document: ", error);
        toast({ title: "Error", description: "Could not save health data. Please try again.", variant: "destructive"});
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
          name="weight"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weight (kg)</FormLabel>
              <FormControl>
                <Input type="number" step="0.1" placeholder="e.g., 70.5" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-2">
            <FormLabel>Blood Pressure (mmHg)</FormLabel>
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="systolic"
                render={({ field }) => (
                    <FormItem>
                    <FormControl>
                        <Input type="number" placeholder="Systolic (e.g., 120)" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="diastolic"
                render={({ field }) => (
                    <FormItem>
                    <FormControl>
                        <Input type="number" placeholder="Diastolic (e.g., 80)" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
        </div>
        
        <FormField
          control={form.control}
          name="bloodSugar"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Blood Sugar (mg/dL)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 90" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="heartRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Heart Rate (bpm)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 75" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : 'Save Health Data'}
        </Button>
      </form>
    </Form>
  );
}
