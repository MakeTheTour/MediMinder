
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Stethoscope, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getSpecialistRecommendation, SpecialistRecommendationOutput } from '@/ai/flows/symptom-checker-flow';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';

const symptomSchema = z.object({
  symptoms: z.string().min(10, 'Please describe your symptoms in at least 10 characters.'),
});

export function DoctorSuggestion() {
  const { toast } = useToast();
  const { isGuest } = useAuth();
  const [recommendation, setRecommendation] = useState<SpecialistRecommendationOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
      const result = await getSpecialistRecommendation(values);
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
              <div className="p-4 bg-accent/20 rounded-lg border border-accent/30 space-y-2">
                <h4 className="font-semibold text-foreground">Recommendation:</h4>
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-accent-foreground mt-1 shrink-0" />
                  <div>
                    <p>
                      You might consider seeing a{' '}
                      <span className="font-bold text-primary">{recommendation.specialist}</span>.
                    </p>
                    <p className="text-sm text-muted-foreground">{recommendation.reasoning}</p>
                  </div>
                </div>
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
