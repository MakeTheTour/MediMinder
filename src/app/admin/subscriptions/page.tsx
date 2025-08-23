
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import type { Subscription, User } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const dummySubscriptions: Subscription[] = [
    {
        id: 'sub_1',
        user: { uid: 'user_1', name: 'Alice Johnson', email: 'alice@example.com', country: 'USA', createdAt: new Date().toISOString() },
        plan: 'Premium Monthly',
        status: 'active',
        startDate: new Date(2023, 10, 15).toISOString(),
        endDate: new Date(2024, 10, 15).toISOString(),
        paymentMethod: 'Stripe',
        transactionId: 'pi_123abc'
    },
    {
        id: 'sub_2',
        user: { uid: 'user_2', name: 'Bob Williams', email: 'bob@example.com', country: 'Canada', createdAt: new Date().toISOString() },
        plan: 'Premium Yearly',
        status: 'active',
        startDate: new Date(2023, 8, 1).toISOString(),
        endDate: new Date(2024, 8, 1).toISOString(),
        paymentMethod: 'PayPal',
        transactionId: 'pp_456def'
    },
    {
        id: 'sub_3',
        user: { uid: 'user_3', name: 'Charlie Brown', email: 'charlie@example.com', country: 'UK', createdAt: new Date().toISOString() },
        plan: 'Premium Monthly',
        status: 'cancelled',
        startDate: new Date(2023, 9, 20).toISOString(),
        endDate: new Date(2023, 10, 20).toISOString(),
        paymentMethod: 'Stripe',
        transactionId: 'pi_789ghi'
    }
];

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you would fetch this data from your database.
    setSubscriptions(dummySubscriptions);
    setLoading(false);
  }, []);
  
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
                           <AvatarImage src={sub.user.photoURL || `https://placehold.co/40x40.png`} alt={sub.user.name} />
                           <AvatarFallback>{sub.user.name?.charAt(0) || 'U'}</AvatarFallback>
                         </Avatar>
                         <div>
                            <p className="font-medium">{sub.user.name}</p>
                            <p className="text-xs text-muted-foreground">{sub.user.email}</p>
                            <p className="text-xs text-muted-foreground">{sub.user.country}</p>
                         </div>
                       </div>
                    </TableCell>
                    <TableCell>{sub.plan}</TableCell>
                    <TableCell>{sub.paymentMethod}</TableCell>
                    <TableCell>
                        <Badge variant={getStatusVariant(sub.status)} className="capitalize">{sub.status}</Badge>
                    </TableCell>
                     <TableCell>
                      {format(new Date(sub.startDate), 'dd/MM/yy')} - {format(new Date(sub.endDate), 'dd/MM/yy')}
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
