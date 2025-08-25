
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, HeartPulse, BrainCircuit, Activity, Utensils, Pill, AlertCircle, Trash2, Pencil, MoreVertical, Sparkles, User, MapPin, History, Save, Leaf, Loader2, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { HealthMetric, UserProfile, SpecialistRecommendationOutput, SymptomAnalysis as SavedSymptomAnalysisType } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { collection, onSnapshot, query, orderBy, getDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deleteDoctorSuggestion } from '@/ai/flows/delete-doctor-suggestion-flow';
import { SymptomAnalysis } from '@/components/symptom-analysis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface SavedSuggestion extends SpecialistRecommendationOutput {
    id: string;
    symptoms: string;
    createdAt: string;
}

function HealthHistoryItem({ metric, onDelete, onEdit }: { metric: HealthMetric, onDelete: (id: string) => void, onEdit: (id: string) => void }) {
    return (
        <div className="p-4 rounded-lg bg-muted/50 flex flex-wrap gap-x-6 gap-y-2 text-sm items-center justify-between">
            <div>
                <p className="w-full font-semibold text-foreground">{format(new Date(metric.date), 'dd/MM/yy')}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    {metric.weight && <p><span className="text-muted-foreground">Weight: </span>{metric.weight} kg</p>}
                    {metric.bloodPressure && <p><span className="text-muted-foreground">BP: </span>{metric.bloodPressure.systolic}/{metric.bloodPressure.diastolic} mmHg</p>}
                    {metric.bloodSugar && <p><span className="text-muted-foreground">Sugar: </span>{metric.bloodSugar} mg/dL</p>}
                    {metric.heartRate && <p><span className="text-muted-foreground">Heart Rate: </span>{metric.heartRate} bpm</p>}
                </div>
            </div>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">More options</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => metric.id && onEdit(metric.id)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => metric.id && onDelete(metric.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

function SavedAnalysisCard({ item }: { item: SavedSymptomAnalysisType }) {
    const { analysis, symptoms, createdAt } = item;
    return (
        <Card className="bg-muted/50 overflow-hidden">
            <Accordion type="single" collapsible>
                <AccordionItem value="item-1" className="border-b-0">
                    <AccordionTrigger className="p-4 hover:no-underline">
                        <div className="text-left">
                            <p className="text-sm text-muted-foreground">{format(new Date(createdAt), 'MMMM d, yyyy')}</p>
                            <p className="font-semibold text-foreground">Analysis for: "{symptoms}"</p>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                        <div className="space-y-3 pt-2">
                             <div className="flex items-start gap-3">
                                <HeartPulse className="h-5 w-5 text-primary mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-foreground">Specialist Suggestion</h4>
                                    <p className="text-sm">{analysis.specialistSuggestion}</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-3">
                                <BrainCircuit className="h-5 w-5 text-primary mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-foreground">Disease Concept</h4>
                                    <p className="text-sm">{analysis.diseaseConcept}</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-3">
                                <Utensils className="h-5 w-5 text-primary mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-foreground">Food for Disease</h4>
                                    <p className="text-sm">{analysis.foodForDisease}</p>
                                </div>
                            </div>
                             <div className="flex items-start gap-3">
                                <Activity className="h-5 w-5 text-primary mt-1 shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-foreground">Activity Suggestion</h4>
                                    <p className="text-sm">{analysis.activitySuggestion}</p>
                                </div>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
}

export default function HealthPage() {
    const { user, isGuest } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    
    const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
    const [savedAnalyses, setSavedAnalyses] = useState<SavedSymptomAnalysisType[]>([]);


    useEffect(() => {
        if (!user || isGuest) {
            setHealthMetrics([]);
            setSavedAnalyses([]);
            return;
        };

        const healthQuery = query(collection(db, 'users', user.uid, 'healthMetrics'), orderBy('date', 'desc'));
        const unsubHealth = onSnapshot(healthQuery, (snapshot) => {
            setHealthMetrics(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as HealthMetric)));
        });
        
        const analysesQuery = query(collection(db, 'users', user.uid, 'symptomAnalyses'), orderBy('createdAt', 'desc'));
        const unsubAnalyses = onSnapshot(analysesQuery, (snapshot) => {
            setSavedAnalyses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavedSymptomAnalysisType)));
        });
        
        return () => {
          unsubHealth();
          unsubAnalyses();
        }
    }, [user, isGuest]);
    
    const handleEditHealthMetric = (id: string) => {
        router.push(`/health/edit/${id}`);
    };
    
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

      <SymptomAnalysis />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles /> Saved Analysis & Logs</CardTitle>
          <CardDescription>Your saved specialist suggestions and health metric history.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="history">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="history"><History className="mr-2 h-4 w-4" /> History Log</TabsTrigger>
                    <TabsTrigger value="analyses"><ClipboardList className="mr-2 h-4 w-4" /> Saved Analyses</TabsTrigger>
                </TabsList>
                <TabsContent value="history" className="pt-4">
                    {healthMetrics.length > 0 ? (
                        <div className="space-y-4">
                        {healthMetrics.map((metric) => (
                            <HealthHistoryItem key={metric.id} metric={metric} onEdit={handleEditHealthMetric} onDelete={handleDeleteHealthMetric} />
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
                </TabsContent>
                 <TabsContent value="analyses" className="pt-4">
                    {savedAnalyses.length > 0 ? (
                        <div className="space-y-4">
                        {savedAnalyses.map((item) => (
                            <SavedAnalysisCard key={item.id} item={item} />
                        ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <BrainCircuit className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">{isGuest ? "Sign in to save analyses" : "No Saved Analyses"}</h3>
                            <p className="mt-1 text-sm text-muted-foreground">{isGuest ? "Create an account or sign in to get and save AI analyses." : "Use the symptom analysis tool to get an analysis and save it."}</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
