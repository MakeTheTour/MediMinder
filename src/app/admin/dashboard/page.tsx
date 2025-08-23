
'use client'

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Users, DollarSign, Megaphone, Loader2, UserPlus, Star, TrendingUp } from "lucide-react";
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { startOfToday, endOfToday, subDays, subMonths, format, startOfDay, isWithinInterval } from 'date-fns';
import type { User as UserType, Subscription } from '@/lib/types';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


interface User extends UserType {
  isPremium?: boolean;
  premiumCycle?: 'monthly' | 'yearly';
}

type Period = 'daily' | 'monthly' | 'yearly';
type SubscriptionPeriod = 'daily' | 'monthly' | 'yearly';


export default function AdminDashboardPage() {
  const [userCount, setUserCount] = useState<number>(0);
  const [revenue, setRevenue] = useState<number>(0);
  const [activeAdsCount, setActiveAdsCount] = useState<number>(0);
  const [todaysUsers, setTodaysUsers] = useState<UserType[]>([]);
  const [allSubscriptions, setAllSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<Period>('monthly');
  const [subscriptionPeriod, setSubscriptionPeriod] = useState<SubscriptionPeriod>('daily');


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
    
    const subscriptionsQuery = query(collection(db, 'subscriptions'));
    const unsubSubscriptions = onSnapshot(subscriptionsQuery, (snapshot) => {
        setAllSubscriptions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subscription)));
    });

    return () => {
        unsubUsers();
        unsubRecentUsers();
        unsubAds();
        unsubSubscriptions();
    }
  }, []);
  
  const analyticsData = useMemo(() => {
      // NOTE: This is mock data since no analytics are being tracked.
      const now = new Date();
      if (analyticsPeriod === 'daily') {
          return Array.from({ length: 24 }, (_, i) => ({
              name: `${i}:00`,
              views: Math.floor(Math.random() * 200) + 50,
              visitors: Math.floor(Math.random() * 80) + 20,
          }));
      }
      if (analyticsPeriod === 'monthly') {
          return Array.from({ length: 30 }, (_, i) => {
              const date = subDays(now, 29 - i);
              return {
                  name: format(date, 'dd/MM'),
                  views: Math.floor(Math.random() * 5000) + 1000,
                  visitors: Math.floor(Math.random() * 2000) + 500,
              };
          });
      }
      if (analyticsPeriod === 'yearly') {
          return Array.from({ length: 12 }, (_, i) => {
              const date = subMonths(now, 11 - i);
              return {
                  name: format(date, 'MMM'),
                  views: Math.floor(Math.random() * 60000) + 20000,
                  visitors: Math.floor(Math.random() * 25000) + 10000,
              };
          });
      }
      return [];
  }, [analyticsPeriod]);
  
  const { filteredSubscriptions, totalAmount } = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    if (subscriptionPeriod === 'daily') {
      startDate = startOfToday();
    } else if (subscriptionPeriod === 'monthly') {
      startDate = subDays(now, 30);
    } else { // yearly
      startDate = subDays(now, 365);
    }

    const filtered = allSubscriptions.filter(sub => 
        isWithinInterval(new Date(sub.startDate), { start: startDate, end: now })
    );

    const total = filtered.reduce((acc, sub) => {
      return acc + (sub.plan === 'Premium Yearly' ? 99.99 : 9.99);
    }, 0);

    return { filteredSubscriptions: filtered, totalAmount: total };
  }, [allSubscriptions, subscriptionPeriod]);


  const Chart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={analyticsData}>
        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
        <Tooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
            }}
        />
        <Bar dataKey="views" name="Page Views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="visitors" name="Unique Visitors" fill="hsl(var(--primary) / 0.5)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );


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

       <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp/> Traffic Analytics</CardTitle>
            <CardDescription>A look at page views and unique visitors.</CardDescription>
        </CardHeader>
        <CardContent>
           <Tabs defaultValue="monthly" onValueChange={(value) => setAnalyticsPeriod(value as Period)} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="daily">Daily</TabsTrigger>
                    <TabsTrigger value="monthly">Monthly</TabsTrigger>
                    <TabsTrigger value="yearly">Yearly</TabsTrigger>
                </TabsList>
                <TabsContent value="daily"><Chart/></TabsContent>
                <TabsContent value="monthly"><Chart/></TabsContent>
                <TabsContent value="yearly"><Chart/></TabsContent>
            </Tabs>
        </CardContent>
      </Card>


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
            <Tabs defaultValue="daily" onValueChange={(value) => setSubscriptionPeriod(value as SubscriptionPeriod)}>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2"><Star/> Subscriptions</div>
                         <TabsList className="grid w-auto grid-cols-3">
                            <TabsTrigger value="daily">Daily</TabsTrigger>
                            <TabsTrigger value="monthly">Monthly</TabsTrigger>
                            <TabsTrigger value="yearly">Yearly</TabsTrigger>
                        </TabsList>
                    </CardTitle>
                     <CardDescription>Users who upgraded to premium.</CardDescription>
                </CardHeader>
                <CardContent>
                     {loading ? (
                        <p className="text-sm text-muted-foreground">Loading subscriptions...</p>
                    ) : filteredSubscriptions.length > 0 ? (
                        <div className="space-y-4">
                            {filteredSubscriptions.map(sub => (
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
                        <p className="text-sm text-muted-foreground text-center py-4">No new subscriptions in this period.</p>
                    )}
                </CardContent>
                <CardFooter className="flex justify-end font-bold">
                    Total: ${totalAmount.toFixed(2)}
                </CardFooter>
            </Tabs>
        </Card>
      </div>
    </div>
  );
}
