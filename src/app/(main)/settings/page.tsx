import Link from 'next/link';
import { User, Bell, Mic, ChevronRight } from 'lucide-react';

const settingsItems = [
  {
    href: '/settings/profile',
    icon: User,
    title: 'Profile Management',
    description: 'Update your personal details.',
  },
  {
    href: '/settings/voice',
    icon: Mic,
    title: 'Voice Prompts',
    description: 'Customize reminder voice.',
  },
  {
    href: '/settings/notifications',
    icon: Bell,
    title: 'Notifications',
    description: 'Manage alert preferences.',
  },
];

export default function SettingsPage() {
  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your app and account settings.</p>
      </header>
      <div className="space-y-2">
        {settingsItems.map((item) => (
          <Link
            key={item.title}
            href={item.href}
            className="flex items-center justify-between rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-4">
              <item.icon className="h-6 w-6 text-primary" />
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
