'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
});

export function ProfileForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.displayName || '',
      email: user?.email || '',
    },
  });
  
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.displayName || '',
        email: user.email || '',
      });
    }
  }, [user, form]);


  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user) {
        toast({ title: 'Error', description: 'No user is signed in.', variant: 'destructive'});
        return;
    }

    try {
        if (values.name !== user.displayName) {
            await updateProfile(user, { displayName: values.name });
        }
        
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, { name: values.name, email: values.email }, { merge: true });

        toast({
            title: 'Profile Updated',
            description: 'Your information has been saved successfully.',
        });
        router.push('/settings');
    } catch (error) {
         toast({
            title: 'Error',
            description: 'Could not update profile. Please try again.',
            variant: 'destructive',
        });
    }
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Your Details</CardTitle>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                        <Input type="email" placeholder="e.g., john.doe@example.com" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                </Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
