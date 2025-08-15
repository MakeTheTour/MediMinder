
'use client'

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, DollarSign, Megaphone, Loader2 } from "lucide-react";
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

interface User {
  isPremium?: boolean;
  premiumCycle?: 'monthly' | 'yearly';
}

export default function AdminDashboardPage() {
  const [userCount, setUserCount] = useState<number>(0);
  const [revenue, setRevenue] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
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

    return () => unsub();
  }, []);

  return (
    <div className="container mx-auto p-4">
       <header className="mb-6">
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
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              No active campaigns
            </p>
          </CardContent>
        </Card>
      </div>

       <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground">Activity feed coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
