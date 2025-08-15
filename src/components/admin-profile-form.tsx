
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { updateProfile, sendPasswordResetEmail, updateEmail } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase-client';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
});

export function AdminProfileForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
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
        
        if (values.email !== user.email) {
            await updateEmail(user, values.email);
        }

        await setDoc(doc(db, 'users', user.uid), { 
            name: values.name,
            email: values.email 
        }, { merge: true });

        toast({
            title: 'Profile Updated',
            description: 'Your information has been saved successfully.',
        });
        router.refresh(); 
    } catch (error: any) {
         console.error("Profile update error:", error);
         toast({
            title: 'Error',
            description: error.message || 'Could not update profile. Please try again.',
            variant: 'destructive',
        });
    }
  }

  async function handleChangePassword() {
    if (!user || !user.email) {
      toast({ title: 'Error', description: 'Could not find user email.', variant: 'destructive'});
      return;
    }

    try {
      await sendPasswordResetEmail(auth, user.email);
      toast({
        title: 'Password Reset Email Sent',
        description: `An email has been sent to ${user.email} with instructions to reset your password.`,
      });
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: 'Error',
        description: error.message || 'Could not send password reset email. Please try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <Card className="max-w-2xl">
        <CardHeader>
            <CardTitle>Your Details</CardTitle>
            <CardDescription>
                Update your administrator display name and email.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Admin User" {...field} />
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
                            <Input type="email" placeholder="e.g., admin@mediminder.com" {...field} />
                        </FormControl>
                         <FormDescription>
                           Changing your email will require you to re-login.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button type="submit" className="flex-1" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button type="button" variant="outline" className="flex-1" onClick={handleChangePassword}>
                            Change Password
                        </Button>
                    </div>
                </form>
            </Form>
        </CardContent>
    </Card>
  );
}
