
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, writeBatch, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { MoreVertical, UserCheck, UserX, CircleSlash, Star, ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';


export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    const usersCollection = collection(db, 'users');
    const unsub = onSnapshot(usersCollection, (userSnapshot) => {
      const usersList = userSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
      setUsers(usersList);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching users: ", error);
        toast({ title: "Error", description: "Could not fetch users.", variant: "destructive"});
        setLoading(false);
    });

    return () => unsub();
  }, [toast]);

  const updateUserStatus = async (uid: string, status: 'active' | 'suspended' | 'deactivated') => {
    try {
        const userRef = doc(db, 'users', uid);
        await updateDoc(userRef, { status });
        toast({
            title: "User Updated",
            description: `User status set to ${status}.`
        });
    } catch (error) {
        console.error("Error updating user status: ", error);
        toast({ title: "Error", description: "Could not update user status.", variant: "destructive"});
    }
  }

  const togglePremium = async (user: User) => {
    const newPremiumStatus = !user.isPremium;
    const batch = writeBatch(db);

    try {
        const userRef = doc(db, 'users', user.uid);
        
        if (newPremiumStatus) { // Upgrading to Premium
            const endDate = new Date();
            endDate.setFullYear(endDate.getFullYear() + 1); // Give 1 year by default from admin

            batch.update(userRef, {
                isPremium: true,
                premiumCycle: 'yearly',
                premiumEndDate: endDate.toISOString(),
            });

            const subData = {
                userId: user.uid,
                user: { name: user.name, email: user.email, photoURL: user.photoURL || null },
                plan: 'Premium Yearly',
                status: 'active',
                startDate: new Date().toISOString(),
                endDate: endDate.toISOString(),
                paymentMethod: 'Admin Grant',
                transactionId: `admin_${user.uid}_${Date.now()}`
            };
            const subRef = doc(collection(db, "subscriptions"));
            batch.set(subRef, subData);

        } else { // Downgrading to Free
             batch.update(userRef, {
                isPremium: false,
                premiumCycle: null,
                premiumEndDate: null,
            });
            // Find active subscription and set to cancelled
            const q = query(collection(db, "subscriptions"), where("userId", "==", user.uid), where("status", "==", "active"));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach(doc => {
                batch.update(doc.ref, { status: 'cancelled' });
            });
        }
        
        await batch.commit();
        toast({
            title: "User Updated",
            description: `User has been ${newPremiumStatus ? 'upgraded to Premium' : 'downgraded to Free'}.`
        });

    } catch (error) {
        console.error("Error toggling premium status: ", error);
        toast({ title: "Error", description: "Could not update user's premium status.", variant: "destructive"});
    }
  };


  const getStatusVariant = (status?: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'active':
        return 'default';
      case 'suspended':
        return 'secondary';
      case 'deactivated':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
     <div className="container mx-auto p-4 flex flex-col h-full">
      <header className="mb-6 flex-shrink-0">
        <h1 className="text-3xl font-bold">Live Users</h1>
        <p className="text-muted-foreground">A list of all registered users in the system.</p>
      </header>
      <Card className="flex-grow flex flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            {loading ? 'Loading...' : `Found ${users.length} users.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow overflow-y-auto">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Plan Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.photoURL || undefined} alt={user.name} />
                            <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium whitespace-nowrap">{user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.createdAt ? format(new Date(user.createdAt), 'dd/MM/yy') : 'N/A'}
                      </TableCell>
                      <TableCell>
                         <Badge variant={getStatusVariant(user.status)} className="capitalize">
                           {user.status || 'Active'}
                          </Badge>
                      </TableCell>
                       <TableCell>
                         <Badge variant={user.isPremium ? 'default' : 'outline'}>
                           {user.isPremium ? 'Premium' : 'Free'}
                          </Badge>
                      </TableCell>
                      <TableCell>
                        {user.premiumEndDate ? format(new Date(user.premiumEndDate), 'dd/MM/yy') : 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                          {user.email !== 'admin@mediminder.com' && (
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon">
                                          <MoreVertical className="h-4 w-4" />
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Manage User</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => updateUserStatus(user.uid, 'active')}>
                                          <UserCheck className="mr-2 h-4 w-4" />
                                          <span>Set Active</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => updateUserStatus(user.uid, 'suspended')}>
                                          <UserX className="mr-2 h-4 w-4" />
                                          <span>Set Suspended</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => updateUserStatus(user.uid, 'deactivated')} className="text-destructive">
                                          <CircleSlash className="mr-2 h-4 w-4" />
                                          <span>Set Deactivated</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      {user.isPremium ? (
                                          <DropdownMenuItem onClick={() => togglePremium(user)}>
                                              <ShieldOff className="mr-2 h-4 w-4" />
                                              <span>Downgrade to Free</span>
                                          </DropdownMenuItem>
                                      ) : (
                                          <DropdownMenuItem onClick={() => togglePremium(user)}>
                                              <Star className="mr-2 h-4 w-4" />
                                              <span>Upgrade to Premium</span>
                                          </DropdownMenuItem>
                                      )}
                                  </DropdownMenuContent>
                              </DropdownMenu>
                          )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
