
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { Subscription } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { useToast } from '@/hooks/use-toast';

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const subCollection = collection(db, 'subscriptions');
    const unsub = onSnapshot(subCollection, (snapshot) => {
      const subsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription));
      setSubscriptions(subsList);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching subscriptions: ", error);
        toast({ title: "Error", description: "Could not fetch subscriptions.", variant: "destructive"});
        setLoading(false);
    });

    return () => unsub();
  }, [toast]);
  
  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'active':
        return 'default';
      case 'cancelled':
        return 'destructive';
      case 'expired':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
     <div className="container mx-auto p-4 flex flex-col h-full">
      <header className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold">User Subscriptions</h1>
        <p className="text-muted-foreground">A list of all user subscription details.</p>
      </header>
      <Card className="flex-grow flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `Found ${subscriptions.length} subscriptions.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscription Date</TableHead>
                <TableHead>Transaction ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Loading subscriptions...
                  </TableCell>
                </TableRow>
              ) : subscriptions.length > 0 ? (
                subscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                       <div className="flex items-center gap-3">
                         <Avatar>
                           <AvatarImage src={sub.user.photoURL || undefined} alt={sub.user.name} />
                           <AvatarFallback>{sub.user.name?.charAt(0) || 'U'}</AvatarFallback>
                         </Avatar>
                         <div>
                            <p className="font-medium">{sub.user.name}</p>
                            <p className="text-xs text-muted-foreground">{sub.user.email}</p>
                         </div>
                       </div>
                    </TableCell>
                    <TableCell>{sub.plan}</TableCell>
                    <TableCell>{sub.paymentMethod}</TableCell>
                    <TableCell>
                        <Badge variant={getStatusVariant(sub.status)} className="capitalize">{sub.status}</Badge>
                    </TableCell>
                     <TableCell>
                      {sub.startDate ? format(new Date(sub.startDate), 'dd/MM/yy') : 'N/A'} - {sub.endDate ? format(new Date(sub.endDate), 'dd/MM/yy') : 'N/A'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{sub.transactionId}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    No subscriptions found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
