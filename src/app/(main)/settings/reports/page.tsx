
'use client';

import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from '@/context/auth-context';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { collection, onSnapshot, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { AdherenceLog } from '@/lib/types';
import { subDays, format, isSameDay } from 'date-fns';
import { Loader2, TrendingUp } from 'lucide-react';

export default function ReportsPage() {
  const { user, isGuest } = useAuth();
  const [localAdherence] = useLocalStorage<AdherenceLog[]>('guest-adherence', []);
  const [firestoreAdherence, setFirestoreAdherence] = useState<AdherenceLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isGuest) {
      setLoading(false);
      return;
    }

    if (user) {
      const sevenDaysAgo = Timestamp.fromDate(subDays(new Date(), 7));
      const q = query(
        collection(db, 'users', user.uid, 'adherenceLogs'),
        where('takenAt', '>=', sevenDaysAgo.toDate().toISOString())
      );
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
    const last7Days = Array.from({ length: 7 }, (_, i) => subDays(new Date(), i)).reverse();

    return last7Days.map(day => {
      const dailyLogs = logs.filter(log => isSameDay(new Date(log.takenAt), day));
      const taken = dailyLogs.filter(log => log.status === 'taken').length;
      const missed = dailyLogs.filter(log => ['missed', 'skipped', 'muted', 'stock_out'].includes(log.status)).length;
      
      return {
        date: format(day, 'eee'), // e.g., 'Mon'
        taken,
        missed,
      };
    });
  }, [isGuest, localAdherence, firestoreAdherence]);
  
  const totalDoses = useMemo(() => adherenceData.reduce((acc, curr) => acc + curr.taken + curr.missed, 0), [adherenceData]);

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Your medication adherence at a glance.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Adherence</CardTitle>
          <CardDescription>Doses taken vs. missed over the last 7 days.</CardDescription>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
