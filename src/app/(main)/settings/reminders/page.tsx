
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const reminderSettingsSchema = z.object({
  initialDuration: z.coerce.number().min(1, 'Duration must be at least 1 minute.'),
  familyAlert: z.coerce.number().min(1, 'Time must be at least 1 minute.'),
});

export interface ReminderSettings {
  initialDuration: number;
  familyAlert: number;
}

export default function ReminderSettingsPage() {
    const { toast } = useToast();
    const [settings, setSettings] = useLocalStorage<ReminderSettings>('reminder-settings', { 
        initialDuration: 1, 
        familyAlert: 10 
    });

    const form = useForm<z.infer<typeof reminderSettingsSchema>>({
        resolver: zodResolver(reminderSettingsSchema),
        defaultValues: settings,
    });
    
    function onSubmit(values: z.infer<typeof reminderSettingsSchema>) {
        setSettings(values);
        toast({
            title: 'Settings Saved',
            description: 'Your reminder timings have been updated.',
        });
    }

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Reminder Settings</h1>
        <p className="text-muted-foreground">Customize the timing of your medication alerts.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Alert Timings</CardTitle>
          <CardDescription>
            All durations are in minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="initialDuration"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Initial Reminder Duration</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormDescription>
                                    How long the first reminder popup stays visible.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="familyAlert"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Family Alert Time</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Time until a dose is marked 'missed' and family is alerted.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit">Save Changes</Button>
                </form>
            </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    