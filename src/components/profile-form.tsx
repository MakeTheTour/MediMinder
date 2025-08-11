'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';

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
import { useLocalStorage } from '@/hooks/use-local-storage';
import { UserProfile } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
});

export function ProfileForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [profile, setProfile] = useLocalStorage<UserProfile>('user-profile', {
    name: 'User',
    email: 'user@mediminder.app',
  });

  const defaultValues = useMemo(() => profile, [profile]);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });
  
  useEffect(() => {
    form.reset(defaultValues);
  }, [defaultValues, form]);


  function onSubmit(values: z.infer<typeof profileSchema>) {
    setProfile(values);
    toast({
      title: 'Profile Updated',
      description: 'Your information has been saved successfully.',
    });
    router.push('/settings');
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
                        <Input type="email" placeholder="e.g., john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full">Save Changes</Button>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
