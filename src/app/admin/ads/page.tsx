
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { collection, addDoc, onSnapshot, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import Image from 'next/image';

const adSchema = z.object({
    title: z.string().min(1, 'Ad title is required.'),
    content: z.string().min(1, 'Ad content is required.'),
    imageUrl: z.string().url('A valid image URL is required.'),
});

interface Ad {
    id: string;
    title: string;
    content: string;
    imageUrl: string;
}

export default function AdminAdsPage() {
  const { toast } = useToast();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof adSchema>>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      title: '',
      content: '',
      imageUrl: '',
    },
  });

  useEffect(() => {
    const q = query(collection(db, 'ads'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
        setAds(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ad)));
        setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSaveCampaign = async (values: z.infer<typeof adSchema>) => {
    try {
        await addDoc(collection(db, 'ads'), {
            ...values,
            createdAt: new Date().toISOString(),
        });
        toast({ title: "Ad Campaign Created", description: "Your new ad is now active." });
        form.reset();
    } catch (error) {
        toast({ title: "Error", description: "Could not create ad campaign.", variant: "destructive" });
    }
  };
  
  const handleDeleteAd = async (id: string) => {
    try {
        await deleteDoc(doc(db, 'ads', id));
        toast({ title: "Ad Deleted", description: "The ad campaign has been removed." });
    } catch (error) {
        toast({ title: "Error", description: "Could not delete ad campaign.", variant: "destructive" });
    }
  }

  return (
    <div className="container mx-auto p-4">
      <header className="mb-6 flex items-center justify-between">
        <div>
            <h1 className="text-3xl font-bold">Custom Ads</h1>
            <p className="text-muted-foreground">Manage promotional content within the app.</p>
        </div>
      </header>

      <div className="grid gap-6">
        <Card>
            <CardHeader>
                <CardTitle>New Ad Campaign</CardTitle>
                <CardDescription>Fill out the details for your new ad.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSaveCampaign)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ad Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Summer Health Sale" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ad Content</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Get 20% off all vitamins!" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="imageUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Image URL</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://placehold.co/600x400.png" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Saving...</>
                            ) : (
                                <><Plus className="mr-2 h-4 w-4" /> Create New Ad</>
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Campaigns</CardTitle>
            <CardDescription>
              A list of current ad campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
                <div className="text-center text-muted-foreground py-8">Loading ads...</div>
            ) : ads.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                    {ads.map(ad => (
                        <Card key={ad.id} className="overflow-hidden">
                            <Image src={ad.imageUrl} alt={ad.title} width={600} height={400} className="w-full h-32 object-cover"/>
                            <CardHeader>
                                <CardTitle>{ad.title}</CardTitle>
                                <CardDescription>{ad.content}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button variant="destructive" size="sm" onClick={() => handleDeleteAd(ad.id)}>
                                    <Trash2 className="mr-2 h-4 w-4"/> Delete Ad
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                 <div className="text-center text-muted-foreground py-8">
                    No active ad campaigns.
                </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
