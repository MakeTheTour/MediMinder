
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '@/lib/firebase-client';
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

const passwordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required.'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters.'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
});

export function ChangePasswordForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const form = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });
  
  async function onSubmit(values: z.infer<typeof passwordSchema>) {
    if (!user || !user.email) {
        toast({ title: 'Error', description: 'No user is signed in.', variant: 'destructive'});
        return;
    }

    try {
        const credential = EmailAuthProvider.credential(user.email, values.oldPassword);
        await reauthenticateWithCredential(user, credential);
        
        await updatePassword(user, values.newPassword);

        toast({
            title: 'Password Updated',
            description: 'Your password has been changed successfully.',
        });
        router.push('/settings');
    } catch (error: any) {
         console.error("Password update error:", error);
         if (error.code === 'auth/wrong-password') {
            toast({
                title: 'Error',
                description: 'The old password you entered is incorrect.',
                variant: 'destructive',
            });
         } else {
            toast({
                title: 'Error',
                description: error.message || 'Could not update password. Please try again.',
                variant: 'destructive',
            });
         }
    }
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>Update Your Password</CardTitle>
            <CardDescription>
                Enter your old password and a new one.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                    control={form.control}
                    name="oldPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Old Password</FormLabel>
                        <FormControl>
                            <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="newPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                            <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                            <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Updating...' : 'Update Password'}
                    </Button>
                </form>
            </Form>
        </CardContent>
    </Card>
  );
}
