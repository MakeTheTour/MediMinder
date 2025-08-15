
'use client';

import { useState, useEffect } from 'react';
import { Plus, HeartPulse, BrainCircuit, Activity, Utensils, Dumbbell, Pill, AlertCircle, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { HealthMetric, UserProfile } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { collection, onSnapshot, query, orderBy, getDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { generateHealthInsights, HealthInsightsOutput } from '@/ai/flows/health-insights-flow';
import { useToast } from '@/hooks/use-toast';
import { DoctorSuggestion } from '@/components/doctor-suggestion';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function HealthHistoryItem({ metric, onDelete }: { metric: HealthMetric, onDelete: (id: string) => void }) {
    return (
        <div className="p-4 rounded-lg bg-muted/50 flex flex-wrap gap-x-6 gap-y-2 text-sm items-center justify-between">
            <div>
                <p className="w-full font-semibold text-foreground">{format(new Date(metric.date), 'MMMM d, yyyy')}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    {metric.weight && <p><span className="text-muted-foreground">Weight: </span>{metric.weight} kg</p>}
                    {metric.bloodPressure && <p><span className="text-muted-foreground">BP: </span>{metric.bloodPressure.systolic}/{metric.bloodPressure.diastolic} mmHg</p>}
                    {metric.bloodSugar && <p><span className="text-muted-foreground">Sugar: </span>{metric.bloodSugar} mg/dL</p>}
                    {metric.heartRate && <p><span className="text-muted-foreground">Heart Rate: </span>{metric.heartRate} bpm</p>}
                </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => metric.id && onDelete(metric.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
        </div>
    )
}

export default function HealthPage() {
    const { user, isGuest } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [insights, setInsights] = useState<HealthInsightsOutput | null>(null);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);

    useEffect(() => {
        if (!user || isGuest) {
            setHealthMetrics([]);
            setUserProfile(null);
            setLoadingProfile(false);
            return;
        };

        const q = query(collection(db, 'users', user.uid, 'healthMetrics'), orderBy('date', 'desc'));
        const unsubHealth = onSnapshot(q, (snapshot) => {
            setHealthMetrics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HealthMetric)));
        });
        
        const fetchUserProfile = async () => {
            setLoadingProfile(true);
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                setUserProfile(userSnap.data() as UserProfile);
            }
            setLoadingProfile(false);
        };
        fetchUserProfile();
        
        return () => {
          unsubHealth();
        }
    }, [user, isGuest]);
    
    const handleGetInsights = async () => {
        if (healthMetrics.length === 0) {
            toast({ title: "Not Enough Data", description: "Log some health data first to get insights."});
            return;
        }
        if (!userProfile) {
            toast({ title: "Profile Needed", description: "Please complete your profile to generate insights."});
            return;
        }

        setLoadingInsights(true);
        try {
            const result = await generateHealthInsights({
                healthMetrics: healthMetrics.slice(0, 10), // Send last 10 records
                userProfile: userProfile,
            });
            setInsights(result);
        } catch (e) {
            toast({ title: "Error Generating Insights", variant: "destructive"});
        }
        setLoadingInsights(false);
    }
    
    const handleDeleteHealthMetric = async (id: string) => {
        if (isGuest || !user) {
            toast({ title: "Cannot Delete", description: "You must be signed in to delete history." });
            return;
        }
        try {
            await deleteDoc(doc(db, 'users', user.uid, 'healthMetrics', id));
            toast({ title: "History Deleted", description: "The health reading has been removed." });
        } catch (error) {
            toast({ title: "Error", description: "Could not delete the reading. Please try again.", variant: 'destructive' });
        }
    };
    
    const handleAddClick = () => {
        if (isGuest || !user) {
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
          <CardTitle className="flex items-center gap-2"><BrainCircuit /> AI Insights</CardTitle>
          <CardDescription>Personalized insights based on your recent health data.</CardDescription>
        </CardHeader>
        <CardContent>
            {loadingProfile ? (
                 <p className="text-sm text-muted-foreground">Loading profile to generate insights...</p>
            ) : (!userProfile?.height || healthMetrics.length === 0 || !healthMetrics[0].weight) && !isGuest && (
                 <Alert variant="default" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Get BMI Insights!</AlertTitle>
                    <AlertDescription>
                        To get BMI-based insights, please make sure you have added your height in your{' '}
                        <Link href="/settings/profile" className="font-bold underline">profile</Link>
                        {' '}and logged your weight.
                    </AlertDescription>
                </Alert>
            )}
            {insights ? (
                <div className="space-y-4 p-4 bg-primary/10 rounded-lg">
                    <p className="font-semibold text-foreground">Insight:</p>
                    <p className="italic">"{insights.insight}"</p>
                    <div className="border-t border-primary/20 pt-4 space-y-4">
                        <div className="flex items-start gap-3">
                           <Utensils className="h-5 w-5 text-primary mt-1 shrink-0" />
                           <div>
                                <h4 className="font-semibold text-foreground">Food Suggestion</h4>
                                <p className="text-sm">{insights.foodSuggestion}</p>
                           </div>
                        </div>
                         <div className="flex items-start gap-3">
                           <Dumbbell className="h-5 w-5 text-primary mt-1 shrink-0" />
                           <div>
                                <h4 className="font-semibold text-foreground">Exercise Suggestion</h4>
                                <p className="text-sm">{insights.exerciseSuggestion}</p>
                           </div>
                        </div>
                         <div className="flex items-start gap-3">
                           <Pill className="h-5 w-5 text-primary mt-1 shrink-0" />
                           <div>
                                <h4 className="font-semibold text-foreground">Medication Observation</h4>
                                <p className="text-sm">{insights.medicationObservation}</p>
                           </div>
                        </div>
                    </div>
                </div>
            ): (
                 <p className="text-muted-foreground text-sm">Click the button to generate insights from your logged data.</p>
            )}
             <Button onClick={handleGetInsights} disabled={loadingInsights || isGuest || loadingProfile} className="mt-4">
                {loadingInsights ? 'Generating...' : 'Generate New Insights'}
            </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity /> History Log</CardTitle>
          <CardDescription>Your most recent health readings.</CardDescription>
        </CardHeader>
        <CardContent>
          {healthMetrics.length > 0 ? (
            <div className="space-y-4">
              {healthMetrics.map((metric) => (
                <HealthHistoryItem key={metric.id} metric={metric} onDelete={handleDeleteHealthMetric} />
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

    </div>
  );
}
