'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Medication, Frequency } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"

const medicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required.'),
  dosage: z.string().min(1, 'Dosage is required (e.g., "1 pill", "10ml").'),
  frequency: z.enum(['Daily', 'Hourly', 'Weekly', 'Monthly']),
  times: z.array(z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)')).min(1, 'At least one time is required.'),
  daysOfWeek: z.array(z.number()).optional(),
  dayOfMonth: z.coerce.number().min(1).max(31).optional(),
}).refine(data => {
    if(data.frequency === 'Weekly') {
        return data.daysOfWeek && data.daysOfWeek.length > 0;
    }
    return true;
}, {
    message: 'At least one day must be selected for weekly frequency.',
    path: ['daysOfWeek'],
}).refine(data => {
    if(data.frequency === 'Monthly') {
        return data.dayOfMonth !== undefined;
    }
    return true;
}, {
    message: 'A day of the month must be selected for monthly frequency.',
    path: ['dayOfMonth'],
});

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AddMedicationForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [medications, setMedications] = useLocalStorage<Medication[]>('medications', []);

  const form = useForm<z.infer<typeof medicationSchema>>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      name: '',
      dosage: '',
      frequency: 'Daily',
      times: ['09:00'],
      daysOfWeek: [],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "times"
  });

  const frequency = form.watch('frequency');

  function onSubmit(values: z.infer<typeof medicationSchema>) {
    const newMedication: Medication = {
      id: new Date().toISOString(),
      ...values,
      frequency: values.frequency as Frequency,
    };
    setMedications([...medications, newMedication]);
    toast({
        title: "Medication Added",
        description: `${values.name} has been added to your schedule.`,
      })
    router.push('/medicine');
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Medication Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Paracetamol" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="dosage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dosage</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 1 pill, 500mg" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="frequency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Frequency</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a frequency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Daily">Daily</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {frequency === 'Weekly' && (
            <FormField
            control={form.control}
            name="daysOfWeek"
            render={() => (
                <FormItem>
                <FormLabel>Days of the Week</FormLabel>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {weekDays.map((day, index) => (
                    <FormField
                        key={day}
                        control={form.control}
                        name="daysOfWeek"
                        render={({ field }) => {
                        return (
                            <FormItem key={day} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes(index)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? field.onChange([...(field.value || []), index])
                                            : field.onChange(field.value?.filter((value) => value !== index))
                                        }}
                                    />
                                </FormControl>
                                <FormLabel className="font-normal">{day}</FormLabel>
                            </FormItem>
                            )
                        }}
                    />
                    ))}
                </div>
                <FormMessage />
                </FormItem>
            )}
            />
        )}

        {frequency === 'Monthly' && (
          <FormField
            control={form.control}
            name="dayOfMonth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Day of the Month</FormLabel>
                <FormControl>
                  <Input type="number" min="1" max="31" placeholder="e.g., 15" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}


        <div>
            <FormLabel>Times</FormLabel>
            <div className="space-y-2 mt-2">
            {fields.map((field, index) => (
                <FormField
                key={field.id}
                control={form.control}
                name={`times.${index}`}
                render={({ field }) => (
                    <FormItem>
                    <div className="flex items-center gap-2">
                        <FormControl>
                            <Input type="time" {...field} />
                        </FormControl>
                        {index > 0 && (
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        )}
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />
            ))}
            </div>
            <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2"
            onClick={() => append('09:00')}
            >
                <Plus className="mr-2 h-4 w-4" /> Add Time
            </Button>
        </div>


        <Button type="submit" className="w-full">Save Medication</Button>
      </form>
    </Form>
  );
}
