'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Play, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { customizeVoicePrompt } from '@/ai/flows/customize-voice-prompts';
import { useToast } from '@/hooks/use-toast';

const voicePromptSchema = z.object({
  text: z.string().min(10, 'Prompt text must be at least 10 characters.'),
  voiceName: z.string().min(1, 'Please select a voice.'),
});

const availableVoices = ['Algenib', 'Atlas', 'Deneb', 'Enif', 'Hadar', 'Kajam', 'Polaris', 'Rigel', 'Sirius', 'Vega'];

export function VoicePromptCustomizer() {
  const { toast } = useToast();
  const [audioDataUri, setAudioDataUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof voicePromptSchema>>({
    resolver: zodResolver(voicePromptSchema),
    defaultValues: {
      text: 'Hello! This is a friendly reminder to take your medication.',
      voiceName: 'Algenib',
    },
  });

  async function onSubmit(values: z.infer<typeof voicePromptSchema>) {
    setIsLoading(true);
    setAudioDataUri(null);
    try {
      const result = await customizeVoicePrompt(values);
      setAudioDataUri(result.audioDataUri);
    } catch (error) {
      console.error('Failed to generate voice prompt:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate voice prompt. Please try again.',
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
            <CardTitle>Customize Voice Prompt</CardTitle>
            <CardDescription>
              Create a personalized voice for your medication reminders. Type your message, choose a voice, and generate a preview.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reminder Text</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter the text for the voice reminder..." {...field} rows={4}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="voiceName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voice</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a voice" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableVoices.map(voice => (
                         <SelectItem key={voice} value={voice}>{voice}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             {audioDataUri && (
              <div>
                <FormLabel>Preview</FormLabel>
                <div className="mt-2 flex items-center gap-2">
                    <audio src={audioDataUri} controls className="w-full"></audio>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Generate & Preview
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
