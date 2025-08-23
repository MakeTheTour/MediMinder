
'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BottomNavbar } from '@/components/bottom-navbar';
import { useAuth } from '@/context/auth-context';
import { Loader2 } from 'lucide-react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

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
    // Request notification permission on component mount
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (user && !isGuest) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData.isPremium && userData.premiumEndDate) {
            const endDate = new Date(userData.premiumEndDate);
            if (endDate < new Date()) {
              // Premium has expired
              await updateDoc(userRef, {
                isPremium: false,
                premiumCycle: null,
                premiumEndDate: null,
              });
            }
          }
        }
      }
    };
    checkPremiumStatus();
  }, [user, isGuest]);

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
      <main className="flex-1 pb-24">{children}</main>
      {showNav && <BottomNavbar />}
    </div>
  );
}
