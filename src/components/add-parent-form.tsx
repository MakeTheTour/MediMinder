
'use client';

import { useState } from 'react';
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
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/auth-context';
import { createParentInvitation } from '@/ai/flows/create-family-invitation-flow';
import { findUserByEmail, FindUserByEmailOutput } from '@/ai/flows/find-user-by-email-flow';
import { Loader2, Search } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';

const searchSchema = z.object({
  email: z.string().email('A valid email is required to search.'),
});

const inviteSchema = z.object({
  relation: z.string().min(1, 'Relation is required.'),
});


export function AddParentForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [searchResult, setSearchResult] = useState<FindUserByEmailOutput | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const searchForm = useForm<z.infer<typeof searchSchema>>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      email: '',
    },
  });

  const inviteForm = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      relation: '',
    },
  });

  async function handleSearch({ email }: z.infer<typeof searchSchema>) {
    if(!user || !user.email) {
        toast({ title: 'Error', description: 'You must be logged in to add a parent', variant: 'destructive'});
        return;
    }
    
    if(email === user.email) {
        setSearchError('You cannot invite yourself.');
        setSearchResult(null);
        return;
    }
    
    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);
    try {
        const result = await findUserByEmail({ email });
        if (result.found) {
            setSearchResult(result);
        } else {
            setSearchError('No user found with this email address.');
        }
    } catch (error) {
        setSearchError('An error occurred while searching. Please try again.');
    } finally {
        setIsSearching(false);
    }
  }

  async function handleInvite({ relation }: z.infer<typeof inviteSchema>) {
    if(!user || !searchResult || !searchResult.name) {
        toast({ title: 'Error', description: 'Cannot send invitation. User or relation data is missing.', variant: 'destructive'});
        return;
    }

    setIsInviting(true);
    try {
        await createParentInvitation({
          inviterId: user.uid,
          inviterName: user.displayName || 'A user',
          inviterPhotoUrl: user.photoURL,
          inviteeEmail: searchForm.getValues('email'),
          inviteeName: searchResult.name,
          relation: relation,
        });
        toast({
            title: "Invitation Sent",
            description: `An invitation has been sent to ${searchResult.name}.`,
        });
        router.push('/family');
    } catch (error: any) {
        console.error("Error adding parent:", error);
        toast({ title: 'Error', description: error.message || 'Could not add parent. Please try again.', variant: 'destructive'});
    } finally {
        setIsInviting(false);
    }
  }

  return (
    <div className="space-y-6">
        <Form {...searchForm}>
            <form onSubmit={searchForm.handleSubmit(handleSearch)} className="space-y-4">
                <FormField
                control={searchForm.control}
                name="email"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Search by Email</FormLabel>
                    <div className="flex gap-2">
                        <FormControl>
                            <Input type="email" placeholder="e.g., jane.doe@example.com" {...field} />
                        </FormControl>
                        <Button type="submit" disabled={isSearching} className="shrink-0">
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin"/> : <Search className="h-4 w-4"/>}
                            <span className="sr-only">Search</span>
                        </Button>
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </form>
        </Form>
        
        {searchError && <p className="text-sm font-medium text-destructive">{searchError}</p>}

        {searchResult && (
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16">
                            <AvatarImage src={searchResult.photoURL} alt={searchResult.name} />
                            <AvatarFallback>{searchResult.name?.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-bold text-lg">{searchResult.name}</p>
                            <p className="text-sm text-muted-foreground">{searchForm.getValues('email')}</p>
                        </div>
                    </div>
                    <Separator className="my-4"/>
                    <Form {...inviteForm}>
                        <form onSubmit={inviteForm.handleSubmit(handleInvite)} className="space-y-4">
                            <FormField
                            control={inviteForm.control}
                            name="relation"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Your Relation to {searchResult.name}</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Mother, Father" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                            />
                            <Button type="submit" className="w-full" disabled={isInviting}>
                                {isInviting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                                        Sending Invitation...
                                    </>
                                ) : 'Send Invitation'}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
