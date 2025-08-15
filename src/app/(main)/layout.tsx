
'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BottomNavbar } from '@/components/bottom-navbar';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';

export default function MainLayout({ children }: { children: ReactNode }) {
  const { user, loading, isGuest } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const noNavPaths = ['/login', '/signup', '/'];
  const showNav = !noNavPaths.includes(pathname) && !pathname.startsWith('/admin');


  useEffect(() => {
    if (pathname?.startsWith('/admin')) {
      return;
    }
    if (!loading && !user && !isGuest) {
      router.push('/login');
    }
  }, [user, loading, router, isGuest, pathname]);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission();
    }
  }, [])

  if (loading && !isGuest) {
    return (
       <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (pathname?.startsWith('/admin')) {
    return <>{children}</>;
  }


  if (!user && !isGuest) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 pb-20">{children}</main>
      {showNav && <BottomNavbar />}
    </div>
  );
}
