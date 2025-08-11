
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Medication, Frequency } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { useLocalStorage } from '@/hooks/use-local-storage';

const medicationSchema = z.object({
  name: z.string().min(1, 'Medication name is required.'),
  dosage: z.enum(['Tablet', 'Capsule', 'Spoon/cap']),
  intake_qty: z.coerce.number().min(1, 'Intake quantity must be at least 1.'),
  
  food_relation: z.enum(['before', 'after', 'with']),
  food_time_minutes: z.coerce.number().optional(),

  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),

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
}).refine(data => {
    if (data.food_relation === 'before' || data.food_relation === 'after') {
        return data.food_time_minutes !== undefined && data.food_time_minutes > 0;
    }
    return true;
}, {
    message: 'Please specify a time greater than 0 minutes.',
    path: ['food_time_minutes'],
});

const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function AddMedicationForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isGuest } = useAuth();
  const [localMedications, setLocalMedications] = useLocalStorage<Medication[]>('guest-medications', []);

  const form = useForm<z.infer<typeof medicationSchema>>({
    resolver: zodResolver(medicationSchema),
    defaultValues: {
      name: '',
      dosage: 'Tablet',
      intake_qty: 1,
      food_relation: 'with',
      food_time_minutes: 30,
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
  const foodRelation = form.watch('food_relation');

  async function onSubmit(values: z.infer<typeof medicationSchema>) {
    const medicationData: Omit<Medication, 'id'> = {
      ...values,
      frequency: values.frequency as Frequency,
    };
      
    if (isGuest) {
        const newMedication: Medication = {
            ...medicationData,
            id: new Date().toISOString(), // simple unique id
        };
        setLocalMedications([...localMedications, newMedication]);
        toast({
            title: "Medication Saved Locally",
            description: `${values.name} has been added to your local schedule. Sign in to save permanently.`,
        });
        router.push('/medicine');
        return;
    }

    if (!user) {
        toast({
            title: "Not Signed In",
            description: "Please sign in to save your medications.",
            variant: "destructive",
        });
        return;
    }
    
    try {
        await addDoc(collection(db, 'users', user.uid, 'medications'), medicationData);
        toast({
            title: "Medication Added",
            description: `${values.name} has been added to your schedule.`,
        });
        router.push('/medicine');
    } catch (error) {
        console.error("Error adding document: ", error);
        toast({ title: "Error", description: "Could not save medication. Please try again.", variant: "destructive"});
    }
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

        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="intake_qty"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Intake Quantity</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 1" {...field} />
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
                <FormLabel>Dosage Unit</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a dosage unit" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Tablet">Tablet</SelectItem>
                      <SelectItem value="Capsule">Capsule</SelectItem>
                      <SelectItem value="Spoon/cap">Spoon/cap</SelectItem>
                    </SelectContent>
                  </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <FormField
            control={form.control}
            name="food_relation"
            render={({ field }) => (
                <FormItem className="space-y-3">
                    <FormLabel>Relation to Food</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                        >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="before" />
                            </FormControl>
                            <FormLabel className="font-normal">Before Food</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="after" />
                            </FormControl>
                            <FormLabel className="font-normal">After Food</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="with" />
                            </FormControl>
                            <FormLabel className="font-normal">With Food</FormLabel>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        
        {(foodRelation === 'before' || foodRelation === 'after') && (
            <FormField
            control={form.control}
            name="food_time_minutes"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Time {foodRelation} food (in minutes)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 30" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
            />
        )}

        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                            <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="end_date"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                            <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>


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
                  <SelectItem value="Hourly">Hourly</SelectItem>
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


        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Saving...' : 'Save Medication'}
        </Button>
      </form>
    </Form>
  );
}
