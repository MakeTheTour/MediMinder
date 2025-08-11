
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  setGuest: (isGuest: boolean) => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isGuest: false, setGuest: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuestState] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem('isGuest') === 'true';
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        setIsGuestState(false);
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem('isGuest');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const setGuest = (isGuest: boolean) => {
      setIsGuestState(isGuest);
      if(isGuest) {
          setUser(null);
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem('isGuest', 'true');
          }
      }
  }

  const value = {
      user,
      loading,
      isGuest,
      setGuest
  }

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
         <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
