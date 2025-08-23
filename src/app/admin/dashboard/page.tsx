
'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, DollarSign, Megaphone, Loader2 } from "lucide-react";
import { collection, onSnapshot, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import type { User as UserType } from '@/lib/types';

interface User {
  isPremium?: boolean;
  premiumCycle?: 'monthly' | 'yearly';
}

export default function AdminDashboardPage() {
  const [userCount, setUserCount] = useState<number>(0);
  const [revenue, setRevenue] = useState<number>(0);
  const [activeAdsCount, setActiveAdsCount] = useState<number>(0);
  const [recentUsers, setRecentUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    const recentUsersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(5));
    const unsubRecentUsers = onSnapshot(recentUsersQuery, (snapshot) => {
      setRecentUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserType)));
    });
    
    const activeAdsQuery = query(collection(db, 'ads'), where('status', '==', 'active'));
    const unsubAds = onSnapshot(activeAdsQuery, (snapshot) => {
        setActiveAdsCount(snapshot.size);
    });


    return () => {
        unsubUsers();
        unsubRecentUsers();
        unsubAds();
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
            <CardTitle>Recent Signups</CardTitle>
            <CardDescription>The latest users to join MediMinder.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
                <p className="text-sm text-muted-foreground">Loading recent users...</p>
            ) : recentUsers.length > 0 ? (
                <div className="space-y-4">
                    {recentUsers.map(user => (
                        <div key={user.uid} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Avatar>
                                    <AvatarImage src={user.photoURL || undefined} alt={user.name} />
                                    <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{user.name}</p>
                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                            </div>
                             <p className="text-sm text-muted-foreground">
                                {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                            </p>
                        </div>
                    ))}
                </div>
            ) : (
                 <p className="text-sm text-muted-foreground">No users have signed up yet.</p>
            )}
          </CardContent>
        </Card>
         <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>An overview of recent events in the app.</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground text-center py-8">Activity feed coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
