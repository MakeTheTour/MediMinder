
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Stethoscope, Loader2, Sparkles, MapPin, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getSpecialistRecommendation, SpecialistRecommendationOutput } from '@/ai/flows/symptom-checker-flow';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import Link from 'next/link';

const symptomSchema = z.object({
  symptoms: z.string().min(10, 'Please describe your symptoms in at least 10 characters.'),
});

export function DoctorSuggestion() {
  const { toast } = useToast();
  const { user, isGuest } = useAuth();
  const [recommendation, setRecommendation] = useState<SpecialistRecommendationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    async function fetchUserCity() {
        if(user && !isGuest) {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                setUserCity(userSnap.data().city || null);
            }
        }
        setLoadingProfile(false);
    }
    fetchUserCity();
  }, [user, isGuest]);

  const form = useForm<z.infer<typeof symptomSchema>>({
    resolver: zodResolver(symptomSchema),
    defaultValues: {
      symptoms: '',
    },
  });

  async function onSubmit(values: z.infer<typeof symptomSchema>) {
    setIsLoading(true);
    setRecommendation(null);
    try {
      const result = await getSpecialistRecommendation({
          symptoms: values.symptoms,
          city: userCity || undefined,
      });
      setRecommendation(result);
    } catch (error) {
      console.error('Failed to get recommendation:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get recommendation. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope />
              Doctor Suggestion
            </CardTitle>
            <CardDescription>
              Describe your symptoms, and our AI will suggest a type of specialist to consult. This is not medical advice.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             {loadingProfile ? (
                 <p className="text-sm text-muted-foreground">Loading profile...</p>
             ) : (!userCity && !isGuest) && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Add your city for better results!</AlertTitle>
                    <AlertDescription>
                        Suggestions are more accurate with your location. 
                        <Link href="/settings/profile" className="font-bold underline ml-1">Update Profile</Link>
                    </AlertDescription>
                </Alert>
             )}
            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Symptoms</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., I've had a persistent cough and mild fever for three days..."
                      {...field}
                      rows={4}
                      disabled={isGuest}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {recommendation && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 space-y-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-1 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-foreground">Recommendation</h4>
                    <p>
                      Based on your symptoms, you might consider seeing a{' '}
                      <span className="font-bold text-primary">{recommendation.specialist}</span>.
                    </p>
                    <p className="text-sm text-muted-foreground">{recommendation.reasoning}</p>
                  </div>
                </div>
                 {recommendation.doctorName && recommendation.doctorAddress && (
                    <div className="border-t border-primary/20 pt-4">
                         <div className="flex items-start gap-3">
                             <User className="h-5 w-5 text-primary mt-1 shrink-0" />
                            <div>
                                <h4 className="font-semibold text-foreground">Suggested Doctor</h4>
                                <p className="font-bold text-primary">{recommendation.doctorName}</p>
                            </div>
                        </div>
                         <div className="flex items-start gap-3 mt-2">
                            <MapPin className="h-5 w-5 text-primary mt-1 shrink-0" />
                            <div>
                                <h4 className="font-semibold text-foreground">Location</h4>
                                <p className="text-muted-foreground">{recommendation.doctorAddress}</p>
                            </div>
                        </div>
                    </div>
                 )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading || isGuest}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                   {isGuest ? 'Sign in to use' : 'Get Suggestion'}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
