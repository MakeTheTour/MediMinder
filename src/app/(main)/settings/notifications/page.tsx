
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const reminderSettingsSchema = z.object({
  initialDuration: z.coerce.number().min(1, 'Duration must be at least 1 minute.'),
  secondAlertDelay: z.coerce.number().min(1, 'Delay must be at least 1 minute.'),
  familyAlert: z.coerce.number().min(1, 'Time must be at least 1 minute.'),
});

export interface ReminderSettings {
  initialDuration: number;
  secondAlertDelay: number;
  familyAlert: number;
}

interface NotificationSettings {
  enabled: boolean;
}

export default function NotificationsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useLocalStorage<ReminderSettings>('reminder-settings', { 
      initialDuration: 1, 
      secondAlertDelay: 3,
      familyAlert: 10 
  });
  const [notificationSettings, setNotificationSettings] = useLocalStorage<NotificationSettings>('notification-settings', { enabled: true });

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
  
  const handleEnabledChange = (enabled: boolean) => {
    setNotificationSettings({ ...notificationSettings, enabled });
  };


  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">Manage how you receive alerts and their timings.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Control your app's notification preferences and timings here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <Label htmlFor="notifications-enabled" className="flex flex-col space-y-1">
              <span>Enable Notifications</span>
              <span className="font-normal leading-snug text-muted-foreground">
                Receive alerts for medications and appointments.
              </span>
            </Label>
            <Switch
              id="notifications-enabled"
              checked={notificationSettings.enabled}
              onCheckedChange={handleEnabledChange}
              aria-label="Toggle notifications"
            />
          </div>

          <Separator />
          
          <div>
            <h3 className="text-lg font-semibold">Alert Timings</h3>
            <p className="text-sm text-muted-foreground">
                All durations are in minutes.
            </p>
          </div>
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
                                    How long the first reminder popup and ringtone stay active.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="secondAlertDelay"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Second Alert Delay</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Time between the first alert and the second alert.
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
                                    Total time until a dose is marked 'missed' and family is alerted.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit">Save Timings</Button>
                </form>
            </Form>
        </CardContent>
      </Card>
    </div>
  );
}
