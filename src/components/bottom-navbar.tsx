
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Pill, Settings, HeartPulse, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Badge } from './ui/badge';

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/medicine', label: 'Medicine', icon: Pill },
  { href: '/health', label: 'Health', icon: HeartPulse },
  { href: '/family', label: 'Family', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNavbar() {
  const pathname = usePathname();
  const { pendingInvitationCount } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const isFamilyItem = item.label === 'Family';
          const showBadge = isFamilyItem && pendingInvitationCount > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 rounded-md p-2 text-muted-foreground transition-colors duration-200 hover:text-primary',
                { 'text-primary': isActive }
              )}
            >
              <item.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{item.label}</span>
               {showBadge && (
                <Badge variant="destructive" className="absolute top-1 right-0 h-5 w-5 justify-center p-0">{pendingInvitationCount}</Badge>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
