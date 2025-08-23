
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase-client';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  setGuest: (isGuest: boolean) => void;
  logout: () => void;
  pendingInvitationCount: number;
  setInvitationsAsViewed: () => void;
}

const AuthContext = createContext<AuthContextType>({ 
    user: null, 
    loading: true, 
    isGuest: false, 
    setGuest: () => {}, 
    logout: () => {}, 
    pendingInvitationCount: 0,
    setInvitationsAsViewed: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuestState] = useState(false);
  const [pendingInvitationCount, setPendingInvitationCount] = useState(0);
  const [haveInvitationsBeenViewed, setHaveInvitationsBeenViewed] = useState(false);

   useEffect(() => {
    const storedIsGuest = typeof window !== 'undefined' && window.sessionStorage.getItem('isGuest') === 'true';
    if (storedIsGuest) {
        setIsGuestState(true);
        setLoading(false);
    }
    const viewedInvites = typeof window !== 'undefined' && window.sessionStorage.getItem('viewedPendingInvitations') === 'true';
    setHaveInvitationsBeenViewed(viewedInvites);

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
    if (user?.email) {
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
  
  const setInvitationsAsViewed = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('viewedPendingInvitations', 'true');
      setHaveInvitationsBeenViewed(true);
    }
  };

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
      window.sessionStorage.removeItem('viewedPendingInvitations');
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
      pendingInvitationCount: haveInvitationsBeenViewed ? 0 : pendingInvitationCount,
      setInvitationsAsViewed,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
