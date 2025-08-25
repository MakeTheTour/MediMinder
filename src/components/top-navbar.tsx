
'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Bell, ShieldAlert, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/context/auth-context';
import { Badge } from './ui/badge';
import { collection, onSnapshot, query, where, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import type { FamilyAlert } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
}

interface TopNavbarProps {
  installPrompt: BeforeInstallPromptEvent | null;
  onInstallClick: () => void;
}

export function TopNavbar({ installPrompt, onInstallClick }: TopNavbarProps) {
  const { user, isGuest, familyAlertCount, setFamilyAlertCount } = useAuth();
  const [alerts, setAlerts] = useState<FamilyAlert[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    if (user && !isGuest) {
      const familyAlertQuery = query(collection(db, 'familyAlerts'), where('familyMemberId', '==', user.uid));
      const unsub = onSnapshot(familyAlertQuery, (snapshot) => {
        const sortedAlerts = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as FamilyAlert))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAlerts(sortedAlerts);
        setFamilyAlertCount(sortedAlerts.length);
      });
      return () => unsub();
    } else {
        setAlerts([]);
        setFamilyAlertCount(0);
    }
  }, [user, isGuest, setFamilyAlertCount]);

  const handleDismissAlert = async (alertId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
        await deleteDoc(doc(db, 'familyAlerts', alertId));
        toast({ title: 'Alert Dismissed' });
    } catch(e) {
        toast({ title: 'Error', description: 'Could not dismiss alert.', variant: 'destructive' });
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 border-b bg-white/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
        <Link href="/home" className="text-xl font-bold text-primary">
          MediMinder
        </Link>
        
        <div className="flex items-center gap-2">
            {installPrompt && (
                <Button variant="outline" size="sm" onClick={onInstallClick}>
                    <Download className="mr-2 h-4 w-4" />
                    Install
                </Button>
            )}
            {!isGuest && (
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-6 w-6" />
                            {familyAlertCount > 0 && (
                                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0 text-[10px]">
                                    {familyAlertCount > 9 ? '9+' : familyAlertCount}
                                </Badge>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                        <DropdownMenuLabel>Family Alerts</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {alerts.length > 0 ? (
                            alerts.map(alert => (
                                <DropdownMenuItem key={alert.id} className="flex items-start gap-3" onSelect={(e) => e.preventDefault()}>
                                    <ShieldAlert className="h-5 w-5 text-destructive mt-1" />
                                    <div className="flex-1">
                                        <p className="text-sm font-medium">{alert.alertMessage}</p>
                                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => handleDismissAlert(alert.id, e)}>
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </DropdownMenuItem>
                            ))
                        ) : (
                            <p className="px-2 py-4 text-center text-sm text-muted-foreground">No new alerts.</p>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
      </div>
    </header>
  );
}
