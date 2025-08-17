
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BellOff } from 'lucide-react';

export default function SnoozeSettingsPage() {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Intelligent Snooze</h1>
        <p className="text-muted-foreground">Configure your smart snooze settings.</p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle>Snooze Preferences</CardTitle>
          <CardDescription>
            The settings for intelligent snoozing will be available here soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="text-center text-muted-foreground py-12">
                <BellOff className="mx-auto h-12 w-12" />
                <p className="mt-4">Snooze customization options are coming soon!</p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
