
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLocalStorage } from '@/hooks/use-local-storage';

interface NotificationSettings {
  enabled: boolean;
}

export default function NotificationsPage() {
  const [settings, setSettings] = useLocalStorage<NotificationSettings>('notification-settings', { enabled: true });

  const handleEnabledChange = (enabled: boolean) => {
    setSettings({ ...settings, enabled });
  };

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">Manage how you receive alerts.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
          <CardDescription>
            Control your app's notification preferences here.
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
              checked={settings.enabled}
              onCheckedChange={handleEnabledChange}
              aria-label="Toggle notifications"
            />
          </div>
           <div className="text-center text-muted-foreground py-8">
              More notification settings coming soon!
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
