
'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, BrainCircuit, Facebook, Mail, Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const GoogleIcon = () => (
    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.83 0-5.22-1.9-6.08-4.44H2.31v2.84C4.13 20.98 7.76 23 12 23z" />
        <path fill="#FBBC05" d="M5.92 14.58c-.21-.66-.33-1.34-.33-2.04s.12-1.38.33-2.04V7.67H2.31c-.66 1.32-.98 2.79-.98 4.34s.32 3.02.98 4.34l3.61-2.77z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.76 1 4.13 3.02 2.31 5.83l3.61 2.84c.86-2.54 3.25-4.29 6.08-4.29z" />
    </svg>
);

const settingsSchema = z.object({
    geminiApiKey: z.string().optional(),
    googleClientId: z.string().optional(),
    googleClientSecret: z.string().optional(),
    facebookAppId: z.string().optional(),
    facebookAppSecret: z.string().optional(),
});

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof settingsSchema>>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
        geminiApiKey: '',
        googleClientId: '',
        googleClientSecret: '',
        facebookAppId: '',
        facebookAppSecret: '',
    },
  });

  useEffect(() => {
    async function fetchSettings() {
        setLoading(true);
        const settingsRef = doc(db, 'settings', 'api');
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
            form.reset(docSnap.data());
        }
        setLoading(false);
    }
    fetchSettings();
  }, [form]);

  const handleSaveChanges = async (values: z.infer<typeof settingsSchema>) => {
    try {
        const settingsRef = doc(db, 'settings', 'api');
        await setDoc(settingsRef, values, { merge: true });
        toast({
            title: "Settings Saved",
            description: "API and integration settings have been updated.",
        });
    } catch (error) {
        toast({
            title: "Error Saving Settings",
            description: "Could not save settings to the database.",
            variant: "destructive",
        });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">API Settings</h1>
        <p className="text-muted-foreground">Manage third-party integrations and API keys.</p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSaveChanges)} className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BrainCircuit /> AI Provider</CardTitle>
                    <CardDescription>Manage Gemini API Key.</CardDescription>
                </CardHeader>
                <CardContent>
                    <FormField
                        control={form.control}
                        name="geminiApiKey"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Gemini API Key</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="Enter your Gemini API key" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><KeyRound/> Social Logins</CardTitle>
                        <CardDescription>Manage Google and Facebook login credentials.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><GoogleIcon/> Google</h3>
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="googleClientId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Client ID</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Your Google Client ID" {...field}/>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="googleClientSecret"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Client Secret</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Your Google Client Secret" {...field}/>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                        <div className="border-t pt-6">
                            <h3 className="font-semibold mb-2 flex items-center gap-2"><Facebook className="h-5 w-5 text-blue-600"/> Facebook</h3>
                            <div className="space-y-4">
                               <FormField
                                    control={form.control}
                                    name="facebookAppId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>App ID</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Your Facebook App ID" {...field}/>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                               <FormField
                                    control={form.control}
                                    name="facebookAppSecret"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>App Secret</FormLabel>
                                            <FormControl>
                                                <Input type="password" placeholder="Your Facebook App Secret" {...field}/>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            <div className="mt-8">
                <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                        <> <Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</>
                    ) : 'Save All Settings'}
                </Button>
            </div>
        </form>
      </Form>
    </div>
  );
}
