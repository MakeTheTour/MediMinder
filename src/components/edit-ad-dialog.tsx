
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { Loader2 } from 'lucide-react';

const adSchema = z.object({
    title: z.string().min(1, 'Ad title is required.'),
    content: z.string().min(1, 'Ad content is required.'),
    imageUrl: z.string().url('A valid image URL is required.'),
    redirectUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
});

interface Ad {
    id: string;
    title: string;
    content: string;
    imageUrl: string;
    redirectUrl?: string;
}

interface EditAdDialogProps {
  ad: Ad | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdUpdated: () => void;
}

export function EditAdDialog({ ad, open, onOpenChange, onAdUpdated }: EditAdDialogProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  
  const form = useForm<z.infer<typeof adSchema>>({
    resolver: zodResolver(adSchema),
    defaultValues: {
        title: '',
        content: '',
        imageUrl: '',
        redirectUrl: '',
    },
  });

  useEffect(() => {
    if (ad) {
      form.reset(ad);
    }
  }, [ad, form]);

  async function handleUpdateAd(values: z.infer<typeof adSchema>) {
    if(!ad) return;

    setIsUpdating(true);
    try {
        const adRef = doc(db, 'ads', ad.id);
        await updateDoc(adRef, values);
        toast({
            title: "Ad Updated",
            description: `The campaign "${values.title}" has been updated.`,
        });
        onAdUpdated();
    } catch (error: any) {
        console.error("Error updating ad:", error);
        toast({ title: 'Error', description: 'Could not update the ad. Please try again.', variant: 'destructive'});
    } finally {
        setIsUpdating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Ad Campaign</DialogTitle>
                <DialogDescription>
                    Make changes to your ad below. The changes will be live immediately.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleUpdateAd)} className="space-y-4">
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
                         <FormField
                            control={form.control}
                            name="redirectUrl"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Redirect URL (Optional)</FormLabel>
                                <FormControl>
                                    <Input placeholder="https://example.com/product-page" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={isUpdating}>
                            {isUpdating ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                    Saving Changes...
                                </>
                            ) : 'Save Changes'}
                        </Button>
                    </form>
                </Form>
            </div>
        </DialogContent>
    </Dialog>
  );
}
