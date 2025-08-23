
'use client'

import Link from 'next/link';
import { User, Bell, Mic, ChevronRight, LogOut, Star, LineChart, KeyRound, BellRing } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const settingsItems = [
  {
    href: '/settings/profile',
    icon: User,
    title: 'Profile Management',
    description: 'Update your personal details.',
  },
  {
    href: '/settings/change-password',
    icon: KeyRound,
    title: 'Change Password',
    description: 'Update your account password.',
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
    {
    href: '/settings/reminders',
    icon: BellRing,
    title: 'Reminder Settings',
    description: 'Customize reminder timings.',
  },
  {
    href: '/settings/reports',
    icon: LineChart,
    title: 'View Reports',
    description: 'Check medication adherence.',
  },
  {
    href: '/settings/premium',
    icon: Star,
    title: 'Premium Plan',
    description: 'Unlock exclusive features.',
  },
];

export default function SettingsPage() {
  const { user, isGuest, logout } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await logout();
    router.push('/login');
  };


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
            href={((item.href === '/settings/profile' || item.href === '/settings/change-password') && isGuest) ? '/login' : item.href}
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
       <div className="mt-8">
        {isGuest ? (
           <Button className="w-full" onClick={() => router.push('/login')}>
            Sign In / Create Account
          </Button>
        ) : (
          <Button variant="destructive" className="w-full" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
          </Button>
        )}
      </div>
    </div>
  );
}
