
'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function AdminAuthLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && user.email?.endsWith('@admin.com')) {
      router.push('/admin/dashboard');
    }
  }, [user, loading, router]);

  if (loading || (user && user.email?.endsWith('@admin.com'))) {
    return null; // Or a loading spinner
  }

  return <>{children}</>;
}
