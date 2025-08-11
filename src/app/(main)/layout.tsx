
'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BottomNavbar } from '@/components/bottom-navbar';
import { useAuth } from '@/context/auth-context';

export default function MainLayout({ children }: { children: ReactNode }) {
  const { user, loading, isGuest } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith('/admin')) {
      return;
    }
    if (!loading && !user && !isGuest) {
      router.push('/login');
    }
  }, [user, loading, router, isGuest, pathname]);

  if (loading) {
    return null; // Or a loading spinner
  }

  if (pathname?.startsWith('/admin')) {
    return <>{children}</>;
  }


  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNavbar />
    </div>
  );
}
