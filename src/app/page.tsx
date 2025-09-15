
'use client';

import { useState, useEffect } from 'react';
import LoginPage from './(auth)/login/page';
import { SplashScreen } from '@/components/splash-screen';

export default function LandingPage() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000); // Show splash for 2 seconds

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen />;
  }

  return <LoginPage />;
}
