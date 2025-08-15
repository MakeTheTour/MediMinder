
'use client';

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { updateProfile, updateEmail } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase-client';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  email: z.string().email('Invalid email address.'),
  photoURL: z.string().url("Please enter a valid URL.").or(z.literal('')).optional(),
  dateOfBirth: z.date().optional(),
  height: z.coerce.number().optional(),
  gender: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
});

export function ProfileForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      photoURL: '',
      dateOfBirth: undefined,
      height: undefined,
      gender: '',
      country: '',
      city: '',
      state: '',
      postcode: '',
    },
  });
  
  useEffect(() => {
    if (user) {
        const fetchUserData = async () => {
            const userRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                form.reset({
                    name: user.displayName || userData.name || '',
                    email: user.email || userData.email || '',
                    photoURL: user.photoURL || userData.photoURL || '',
                    dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : undefined,
                    height: userData.height || undefined,
                    gender: userData.gender || '',
                    country: userData.country || '',
                    city: userData.city || '',
                    state: userData.state || '',
                    postcode: userData.postcode || '',
                });
            } else {
                 form.reset({
                    name: user.displayName || '',
                    email: user.email || '',
                    photoURL: user.photoURL || '',
                 });
            }
        }
        fetchUserData();
    }
  }, [user, form]);
  
  const photoURL = form.watch('photoURL');


  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user) {
        toast({ title: 'Error', description: 'No user is signed in.', variant: 'destructive'});
        return;
    }

    try {
        if (values.name !== user.displayName || values.photoURL !== user.photoURL) {
            await updateProfile(user, { 
                displayName: values.name,
                photoURL: values.photoURL,
            });
        }
        
        if (values.email && values.email !== user.email) {
            await updateEmail(user, values.email);
        }
        
        await setDoc(doc(db, 'users', user.uid), {
            ...values,
            dateOfBirth: values.dateOfBirth ? values.dateOfBirth.toISOString() : null,
        }, { merge: true });

        toast({
            title: 'Profile Updated',
            description: 'Your information has been saved successfully.',
        });
        router.refresh(); 
        router.push('/settings');
    } catch (error: any) {
         console.error("Profile update error:", error);
         toast({
            title: 'Error',
            description: error.message || 'Could not update profile. Please try again.',
            variant: 'destructive',
        });
    }
  }


  return (
    <Card>
        <CardHeader>
            <CardTitle>Your Details</CardTitle>
            <CardDescription>
                Provide some basic information to personalize your experience.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={photoURL || undefined} alt="Profile picture" />
                    <AvatarFallback>{form.getValues('name')?.charAt(0) || user?.email?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <FormField
                    control={form.control}
                    name="photoURL"
                    render={({ field }) => (
                        <FormItem className="w-full">
                        <FormLabel>Photo URL</FormLabel>
                        <FormControl>
                            <Input placeholder="https://example.com/image.png" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                         <FormDescription>
                           Changing your email may require you to re-login.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                     <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Date of Birth</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                            "pl-3 text-left font-normal",
                                            !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                            format(field.value, "dd/MM/yy")
                                            ) : (
                                            <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                                        initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="height"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Height (cm)</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="e.g., 175" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Gender</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value || ''}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select your gender" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="male">Male</SelectItem>
                                        <SelectItem value="female">Female</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., United States" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>State / Province</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., California" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., San Francisco" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="postcode"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Post Code</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., 94103" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                 <div className="flex flex-col sm:flex-row gap-4">
                    <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
                 <div className="text-center text-sm">
                    <Link href="/home" className="text-muted-foreground hover:text-primary">
                        Skip for now
                    </Link>
                </div>
            </form>
            </Form>
        </CardContent>
    </Card>
  );
}
