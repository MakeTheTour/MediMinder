
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  setGuest: (isGuest: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isGuest: false, setGuest: () => {}, logout: () => {} });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuestState] = useState(false);

   useEffect(() => {
    const storedIsGuest = typeof window !== 'undefined' && window.sessionStorage.getItem('isGuest') === 'true';
    if (storedIsGuest) {
        setIsGuestState(true);
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setIsGuestState(false);
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem('isGuest');
        }
      } else {
        // Only set user to null if not in guest mode
        if (! (typeof window !== 'undefined' && window.sessionStorage.getItem('isGuest') === 'true')) {
            setUser(null);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const setGuest = (isGuestMode: boolean) => {
      setIsGuestState(isGuestMode);
      if(isGuestMode) {
          setUser(null);
          if (typeof window !== 'undefined') {
            window.sessionStorage.setItem('isGuest', 'true');
          }
      } else {
         if (typeof window !== 'undefined') {
            window.sessionStorage.removeItem('isGuest');
          }
      }
  }

  const logout = async () => {
    setIsGuestState(false);
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem('isGuest');
      // Optionally clear local storage data for guest
      window.localStorage.removeItem('guest-medications');
      window.localStorage.removeItem('guest-appointments');
    }
    await signOut(auth);
    setUser(null);
  }


  const value = {
      user,
      loading,
      isGuest,
      setGuest,
      logout
  }

  return (
    <AuthContext.Provider value={value}>
      {loading && !isGuest ? (
         <div className="flex h-screen items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

    