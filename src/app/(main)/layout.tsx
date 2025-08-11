'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNavbar } from '@/components/bottom-navbar';
import { useAuth } from '@/context/auth-context';

export default function MainLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNavbar />
    </div>
  );
}
