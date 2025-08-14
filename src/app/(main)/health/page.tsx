
'use client';

import { useState, useEffect } from 'react';
import { Plus, HeartPulse, BrainCircuit, Activity } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { HealthMetric } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { generateHealthInsights, HealthInsightsOutput } from '@/ai/flows/health-insights-flow';
import { useToast } from '@/hooks/use-toast';
import { DoctorSuggestion } from '@/components/doctor-suggestion';

function HealthHistoryItem({ metric }: { metric: HealthMetric }) {
    return (
        <div className="p-4 rounded-lg bg-muted/50 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <p className="w-full font-semibold text-foreground">{format(new Date(metric.date), 'MMMM d, yyyy')}</p>
            {metric.weight && <p><span className="text-muted-foreground">Weight: </span>{metric.weight} kg</p>}
            {metric.bloodPressure && <p><span className="text-muted-foreground">BP: </span>{metric.bloodPressure.systolic}/{metric.bloodPressure.diastolic} mmHg</p>}
            {metric.bloodSugar && <p><span className="text-muted-foreground">Sugar: </span>{metric.bloodSugar} mg/dL</p>}
            {metric.heartRate && <p><span className="text-muted-foreground">Heart Rate: </span>{metric.heartRate} bpm</p>}
        </div>
    )
}

export default function HealthPage() {
    const { user, isGuest } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [localHealthMetrics, setLocalHealthMetrics] = useLocalStorage<HealthMetric[]>('guest-health-metrics', []);
    const [firestoreHealthMetrics, setFirestoreHealthMetrics] = useState<HealthMetric[]>([]);
    const [insights, setInsights] = useState<HealthInsightsOutput | null>(null);
    const [loadingInsights, setLoadingInsights] = useState(false);

    const healthMetrics = (isGuest ? localHealthMetrics : firestoreHealthMetrics).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    useEffect(() => {
        if (!user || isGuest) {
            setFirestoreHealthMetrics([]);
            return;
        };
        const q = query(collection(db, 'users', user.uid, 'healthMetrics'), orderBy('date', 'desc'));
        const unsub = onSnapshot(q, (snapshot) => {
            setFirestoreHealthMetrics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HealthMetric)));
        });
        return () => unsub();
    }, [user, isGuest]);
    
    const handleGetInsights = async () => {
        if (healthMetrics.length === 0) {
            toast({ title: "Not Enough Data", description: "Log some health data first to get insights."});
            return;
        }
        setLoadingInsights(true);
        try {
            const result = await generateHealthInsights({
                healthMetrics: healthMetrics.slice(0, 10), // Send last 10 records
                userName: user?.displayName || "user",
            });
            setInsights(result);
        } catch (e) {
            toast({ title: "Error Generating Insights", variant: "destructive"});
        }
        setLoadingInsights(false);
    }
    
    const handleAddClick = () => {
        if (isGuest) {
            router.push('/login');
        } else {
            router.push('/health/add');
        }
    }

  return (
    <div className="container mx-auto max-w-2xl p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold">Health Tracking</h1>
            <p className="text-muted-foreground">Your personal health log and insights.</p>
        </div>
        <Button onClick={handleAddClick} size="sm">
            <Plus className="mr-2 h-4 w-4" /> {isGuest ? 'Sign In to Log' : 'Add Reading'}
        </Button>
      </header>
      
      <DoctorSuggestion />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity /> History Log</CardTitle>
          <CardDescription>Your most recent health readings.</CardDescription>
        </CardHeader>
        <CardContent>
          {healthMetrics.length > 0 ? (
            <div className="space-y-4">
              {healthMetrics.map(metric => (
                <HealthHistoryItem key={metric.id} metric={metric} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
                <HeartPulse className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">{isGuest ? "Sign in to track your health" : "No Health Data Logged"}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{isGuest ? "Create an account or sign in to save and track your health metrics." : "Add your first health reading to see your history here."}</p>
                 <Button onClick={handleAddClick} size="sm" className="mt-4">
                    <Plus className="mr-2 h-4 w-4" /> {isGuest ? 'Sign In' : 'Add First Reading'}
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BrainCircuit /> AI Insights</CardTitle>
          <CardDescription>Personalized insights based on your recent health data.</CardDescription>
        </CardHeader>
        <CardContent>
            {insights ? (
                <div className="space-y-2 p-4 bg-primary/10 rounded-lg">
                    <p><strong>Insight:</strong> {insights.insight}</p>
                    <p><strong>Suggestion:</strong> {insights.suggestion}</p>
                </div>
            ): (
                 <p className="text-muted-foreground text-sm">Click the button to generate insights from your logged data.</p>
            )}
             <Button onClick={handleGetInsights} disabled={loadingInsights || (isGuest && healthMetrics.length === 0)} className="mt-4">
                {loadingInsights ? 'Generating...' : 'Generate New Insights'}
            </Button>
        </CardContent>
      </Card>

    </div>
  );
}
