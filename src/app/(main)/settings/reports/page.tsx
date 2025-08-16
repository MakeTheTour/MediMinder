
'use client';

import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from '@/context/auth-context';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { AdherenceLog } from '@/lib/types';
import { subDays, format, isSameDay, getHours } from 'date-fns';
import { Loader2, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


type Period = 'daily' | 'weekly' | 'monthly';

export default function ReportsPage() {
  const { user, isGuest } = useAuth();
  const [localAdherence] = useLocalStorage<AdherenceLog[]>('guest-adherence', []);
  const [firestoreAdherence, setFirestoreAdherence] = useState<AdherenceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('weekly');

  useEffect(() => {
    setLoading(true);
    if (isGuest) {
      setLoading(false);
      return;
    }

    if (user) {
      // Listen to all adherence logs for real-time updates
      const q = query(collection(db, 'users', user.uid, 'adherenceLogs'));
      
      const unsub = onSnapshot(q, (snapshot) => {
        setFirestoreAdherence(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AdherenceLog)));
        setLoading(false);
      }, (error) => {
        console.error("Failed to fetch adherence data:", error);
        setLoading(false);
      });
      return () => unsub();
    } else {
        setLoading(false);
    }
  }, [user, isGuest]);

  const adherenceData = useMemo(() => {
    const logs = isGuest ? localAdherence : firestoreAdherence;

    if (period === 'daily') {
        // Filter for today's logs
        const todayLogs = logs.filter(log => isSameDay(new Date(log.takenAt), new Date()));
        const hours = Array.from({ length: 24 }, (_, i) => ({
            name: `${i}:00`,
            taken: 0,
            missed: 0
        }));

        todayLogs.forEach(log => {
            const hour = getHours(new Date(log.takenAt));
            if (log.status === 'taken') {
                hours[hour].taken += 1;
            } else if (['missed', 'skipped', 'muted', 'stock_out'].includes(log.status)) {
                hours[hour].missed += 1;
            }
        });
        // We only show hours with data for a cleaner chart
        return hours.filter(h => h.taken > 0 || h.missed > 0).map(h => ({ ...h, date: h.name}));
    }

    const daysToCover = period === 'weekly' ? 7 : 30;
    const sinceDate = subDays(new Date(), daysToCover);
    const lastXDays = Array.from({ length: daysToCover }, (_, i) => subDays(new Date(), i)).reverse();

    return lastXDays.map(day => {
      const dailyLogs = logs.filter(log => isSameDay(new Date(log.takenAt), day));
      const taken = dailyLogs.filter(log => log.status === 'taken').length;
      const missed = dailyLogs.filter(log => ['missed', 'skipped', 'muted', 'stock_out'].includes(log.status)).length;
      
      return {
        date: format(day, period === 'weekly' ? 'eee' : 'dd/MM'),
        taken,
        missed,
      };
    });
  }, [isGuest, localAdherence, firestoreAdherence, period]);
  
  const totalDoses = useMemo(() => adherenceData.reduce((acc, curr) => acc + curr.taken + curr.missed, 0), [adherenceData]);

  const Chart = () => (
     <>
        {loading ? (
            <div className="flex justify-center items-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        ) : totalDoses > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={adherenceData}>
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                }}
            />
            <Legend wrapperStyle={{ fontSize: '0.8rem', paddingTop: '10px' }}/>
            <Bar dataKey="taken" name="Taken" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey="missed" name="Missed" fill="hsl(var(--destructive) / 0.6)" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
        ) : (
        <div className="text-center py-10 h-[300px] flex flex-col justify-center items-center">
            <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Adherence Data</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                {isGuest ? "Log your medication doses on the Home page to see your report." : "Once you start logging your doses, your report will appear here."}
            </p>
        </div>
        )}
     </>
  );

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Your medication adherence at a glance.</p>
      </header>

      <Tabs defaultValue="weekly" onValueChange={(value) => setPeriod(value as Period)}>
          <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="daily">Daily</TabsTrigger>
              <TabsTrigger value="weekly">Weekly</TabsTrigger>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
          <TabsContent value="daily">
              <Card>
                <CardHeader>
                    <CardTitle>Daily Adherence</CardTitle>
                    <CardDescription>Hourly breakdown of doses taken vs. missed today.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Chart/>
                </CardContent>
              </Card>
          </TabsContent>
          <TabsContent value="weekly">
              <Card>
                <CardHeader>
                    <CardTitle>Weekly Adherence</CardTitle>
                    <CardDescription>Doses taken vs. missed over the last 7 days.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Chart/>
                </CardContent>
              </Card>
          </TabsContent>
          <TabsContent value="monthly">
              <Card>
                <CardHeader>
                    <CardTitle>Monthly Adherence</CardTitle>
                    <CardDescription>Doses taken vs. missed over the last 30 days.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Chart/>
                </CardContent>
              </Card>
          </TabsContent>
      </Tabs>
    </div>
  );
}
