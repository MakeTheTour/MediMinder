
'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, DollarSign, Megaphone, Loader2, UserPlus, Star } from "lucide-react";
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { startOfToday, endOfToday } from 'date-fns';
import type { User as UserType, Subscription } from '@/lib/types';

interface User extends UserType {
  isPremium?: boolean;
  premiumCycle?: 'monthly' | 'yearly';
}

export default function AdminDashboardPage() {
  const [userCount, setUserCount] = useState<number>(0);
  const [revenue, setRevenue] = useState<number>(0);
  const [activeAdsCount, setActiveAdsCount] = useState<number>(0);
  const [todaysUsers, setTodaysUsers] = useState<UserType[]>([]);
  const [todaysSubscriptions, setTodaysSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const todayStart = startOfToday().toISOString();
    const todayEnd = endOfToday().toISOString();

    const usersQuery = query(collection(db, 'users'));
    const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
      const users = snapshot.docs.map(doc => doc.data() as User);
      setUserCount(users.length);

      let totalRevenue = 0;
      users.forEach(user => {
        if (user.isPremium) {
          if (user.premiumCycle === 'yearly') {
            totalRevenue += 99.99;
          } else {
            totalRevenue += 9.99;
          }
        }
      });
      setRevenue(totalRevenue);
      setLoading(false);
    });

    const todaysUsersQuery = query(
        collection(db, 'users'), 
        where('createdAt', '>=', todayStart),
        where('createdAt', '<=', todayEnd)
    );
    const unsubRecentUsers = onSnapshot(todaysUsersQuery, (snapshot) => {
      setTodaysUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserType)));
    });
    
    const activeAdsQuery = query(collection(db, 'ads'), where('status', '==', 'active'));
    const unsubAds = onSnapshot(activeAdsQuery, (snapshot) => {
        setActiveAdsCount(snapshot.size);
    });
    
    const todaysSubscriptionsQuery = query(
        collection(db, 'subscriptions'),
        where('startDate', '>=', todayStart),
        where('startDate', '<=', todayEnd)
    );
    const unsubSubscriptions = onSnapshot(todaysSubscriptionsQuery, (snapshot) => {
        setTodaysSubscriptions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription)));
    });

    return () => {
        unsubUsers();
        unsubRecentUsers();
        unsubAds();
        unsubSubscriptions();
    }
  }, []);

  return (
    <div className="container mx-auto p-4 space-y-6">
       <header>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, Admin!</p>
      </header>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Users
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
                <div className="text-2xl font-bold">{userCount}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Total registered users
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estimated Monthly Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {loading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
                <div className="text-2xl font-bold">${revenue.toFixed(2)}</div>
            )}
            <p className="text-xs text-muted-foreground">
              Based on premium subscriptions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Ads</CardTitle>
            <Megaphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
                 <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
                <div className="text-2xl font-bold">{activeAdsCount}</div>
            )}
            <p className="text-xs text-muted-foreground">
                {activeAdsCount > 0 ? `${activeAdsCount} active campaign${activeAdsCount > 1 ? 's' : ''}` : 'No active campaigns'}
            </p>
          </CardContent>
        </Card>
      </div>

       <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserPlus/> Today's New Users</CardTitle>
            <CardDescription>Users who signed up today.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
                <p className="text-sm text-muted-foreground">Loading today's users...</p>
            ) : todaysUsers.length > 0 ? (
                <div className="space-y-4">
                    {todaysUsers.map(user => (
                        <div key={user.uid} className="flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src={user.photoURL || undefined} alt={user.name} />
                                <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <p className="text-sm text-muted-foreground text-center py-4">No new users today.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Star/> Today's New Subscriptions</CardTitle>
            <CardDescription>Users who upgraded to premium today.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
                <p className="text-sm text-muted-foreground">Loading today's subscriptions...</p>
            ) : todaysSubscriptions.length > 0 ? (
                <div className="space-y-4">
                    {todaysSubscriptions.map(sub => (
                        <div key={sub.id} className="flex items-center justify-between gap-4">
                           <div className="flex items-center gap-4">
                                <Avatar>
                                    <AvatarImage src={sub.user.photoURL || undefined} alt={sub.user.name || 'User'} />
                                    <AvatarFallback>{sub.user.name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{sub.user.name}</p>
                                    <p className="text-sm text-muted-foreground">{sub.plan}</p>
                                </div>
                           </div>
                           <div className="text-right">
                                <p className="font-semibold">
                                    {sub.plan === 'Premium Yearly' ? '$99.99' : '$9.99'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {sub.paymentMethod}
                                </p>
                           </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <p className="text-sm text-muted-foreground text-center py-4">No new subscriptions today.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
