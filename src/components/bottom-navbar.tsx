
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Pill, Settings, HeartPulse, Users, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/auth-context';
import { Badge } from './ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/medicine', label: 'Medicine', icon: Pill },
  { href: '/health', label: 'Health', icon: HeartPulse },
  { href: '/family', label: 'Family', icon: Users },
  { href: '/settings', label: 'You', icon: Settings },
];

export function BottomNavbar() {
  const pathname = usePathname();
  const { user, isGuest, pendingInvitationCount, familyAlertCount } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur-sm shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const isFamilyItem = item.label === 'Family';
          const totalAlerts = pendingInvitationCount + familyAlertCount;
          const showBadge = isFamilyItem && totalAlerts > 0;
          const isYouItem = item.label === 'You';
          
          let IconComponent = item.icon;
          if (isYouItem && isGuest) {
            IconComponent = User;
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 rounded-md p-2 text-muted-foreground transition-colors duration-200 hover:text-primary',
                { 'text-primary': isActive }
              )}
            >
              {isYouItem && !isGuest ? (
                 <Avatar className="h-6 w-6">
                    <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || 'User'}/>
                    <AvatarFallback>
                        <User className="h-4 w-4"/>
                    </AvatarFallback>
                 </Avatar>
              ) : (
                 <IconComponent className="h-6 w-6" />
              )}
              <span className="text-xs font-medium">{item.label}</span>
               {showBadge && (
                 <Badge variant="destructive" className="absolute top-1 right-2 h-4 w-4 justify-center p-0 text-[10px]">
                    {totalAlerts > 9 ? '9+' : totalAlerts}
                </Badge>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
