
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Stethoscope, Loader2, Sparkles, Activity, Utensils, BrainCircuit, HeartPulse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { analyzeSymptoms, SymptomAnalysisOutput } from '@/ai/flows/symptom-analysis-flow';

const symptomSchema = z.object({
  symptoms: z.string().min(10, 'অনুগ্রহ করে কমপক্ষে ১০ অক্ষরের মধ্যে আপনার উপসর্গ বর্ণনা করুন।'),
});

const ResultCard = ({ icon: Icon, title, content }: { icon: React.ElementType; title: string; content: string }) => (
    <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">{content}</p>
        </CardContent>
    </Card>
);

export function SymptomAnalysis() {
  const { toast } = useToast();
  const { user, isGuest } = useAuth();
  const [analysis, setAnalysis] = useState<SymptomAnalysisOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof symptomSchema>>({
    resolver: zodResolver(symptomSchema),
    defaultValues: {
      symptoms: '',
    },
  });

  async function onSubmit(values: z.infer<typeof symptomSchema>) {
    setIsLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzeSymptoms(values);
      setAnalysis(result);
    } catch (error) {
      console.error('Failed to get analysis:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to get analysis. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
    <Card>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope />
              AI Health Analysis
            </CardTitle>
            <CardDescription>
              আপনার রোগের উপসর্গগুলো নিচে লিখুন, এবং আমাদের AI আপনাকে বিশেষজ্ঞের পরামর্শ, রোগের ধারণা এবং জীবনযাত্রার টিপস দেবে।
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>আপনার উপসর্গ (Your Symptoms)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="যেমন: আমার গত তিন দিন ধরে মাথা ব্যথা এবং হালকা জ্বর অনুভব হচ্ছে..."
                      {...field}
                      rows={4}
                      disabled={isGuest}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading || isGuest}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  এনালাইসিস করা হচ্ছে...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                   {isGuest ? 'ব্যবহার করতে সাইন ইন করুন' : 'এনালাইসিস করুন'}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
    
    {analysis && (
        <div className="space-y-4">
            <ResultCard icon={HeartPulse} title="বিশেষজ্ঞের পরামর্শ" content={analysis.specialistSuggestion} />
            <ResultCard icon={BrainCircuit} title="রোগের ধারণা" content={analysis.diseaseConcept} />
            <ResultCard icon={Utensils} title="খাবার পরামর্শ" content={analysis.foodSuggestion} />
            <ResultCard icon={Activity} title="করণীয়" content={analysis.activitySuggestion} />
        </div>
    )}
    </>
  );
}
