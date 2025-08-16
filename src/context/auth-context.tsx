
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase-client';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  setGuest: (isGuest: boolean) => void;
  logout: () => void;
  pendingInvitationCount: number;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isGuest: false, setGuest: () => {}, logout: () => {}, pendingInvitationCount: 0 });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuestState] = useState(false);
  const [pendingInvitationCount, setPendingInvitationCount] = useState(0);

   useEffect(() => {
    const storedIsGuest = typeof window !== 'undefined' && window.sessionStorage.getItem('isGuest') === 'true';
    if (storedIsGuest) {
        setIsGuestState(true);
        setLoading(false);
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

  useEffect(() => {
    if (user && user.email) {
      const q = query(
        collection(db, 'invitations'),
        where('inviteeEmail', '==', user.email),
        where('status', '==', 'pending')
      );

      const unsub = onSnapshot(q, (snapshot) => {
        setPendingInvitationCount(snapshot.size);
      });

      return () => unsub();
    } else {
      setPendingInvitationCount(0);
    }
  }, [user]);
  
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
      logout,
      pendingInvitationCount,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
