
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
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
    path: ['weight'],
});

interface EditHealthMetricFormProps {
    healthMetricId: string;
}

export function EditHealthMetricForm({ healthMetricId }: EditHealthMetricFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isGuest } = useAuth();

  const form = useForm<z.infer<typeof healthMetricSchema>>({
    resolver: zodResolver(healthMetricSchema),
    defaultValues: {
      date: '',
      weight: undefined,
      systolic: undefined,
      diastolic: undefined,
      bloodSugar: undefined,
      heartRate: undefined,
    },
  });

  useEffect(() => {
    const fetchHealthMetricData = async () => {
        if (!user || isGuest) {
            toast({ title: "Error", description: "You must be signed in to edit data.", variant: "destructive" });
            router.push('/health');
            return;
        }

        const docRef = doc(db, "users", user.uid, "healthMetrics", healthMetricId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data() as HealthMetric;
            form.reset({
                date: format(new Date(data.date), 'yyyy-MM-dd'),
                weight: data.weight,
                systolic: data.bloodPressure?.systolic,
                diastolic: data.bloodPressure?.diastolic,
                bloodSugar: data.bloodSugar,
                heartRate: data.heartRate,
            });
        } else {
            toast({ title: "Error", description: "Health metric not found.", variant: "destructive" });
            router.push('/health');
        }
    };
    fetchHealthMetricData();
  }, [user, isGuest, healthMetricId, form, router, toast]);

  async function onSubmit(values: z.infer<typeof healthMetricSchema>) {
    if (isGuest || !user) {
        toast({ title: "Not Signed In", description: "Please sign in to update your data.", variant: "destructive" });
        return;
    }
    
    const healthMetricData = {
        date: new Date(values.date).toISOString(),
        weight: values.weight,
        bloodPressure: (values.systolic && values.diastolic) ? { systolic: values.systolic, diastolic: values.diastolic } : undefined,
        bloodSugar: values.bloodSugar,
        heartRate: values.heartRate,
        userId: user.uid,
    };

    try {
        const docRef = doc(db, 'users', user.uid, 'healthMetrics', healthMetricId);
        await updateDoc(docRef, healthMetricData);
        toast({
            title: "Health Data Updated",
            description: `Your metrics for ${format(new Date(values.date), 'MMMM d')} have been saved.`,
        });
        router.push('/health');
    } catch (error) {
        console.error("Error updating document: ", error);
        toast({ title: "Error", description: "Could not update health data. Please try again.", variant: "destructive"});
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
                <Input type="number" step="0.1" placeholder="e.g., 70.5" {...field} value={field.value ?? ''} />
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
                        <Input type="number" placeholder="Systolic (e.g., 120)" {...field} value={field.value ?? ''} />
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
                        <Input type="number" placeholder="Diastolic (e.g., 80)" {...field} value={field.value ?? ''} />
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
                <Input type="number" placeholder="e.g., 90" {...field} value={field.value ?? ''} />
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
                <Input type="number" placeholder="e.g., 75" {...field} value={field.value ?? ''} />
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
