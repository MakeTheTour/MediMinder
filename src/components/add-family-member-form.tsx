
'use client';

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
import { createFamilyInvitation } from '@/ai/flows/create-family-invitation-flow';

const familyMemberSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  relation: z.string().min(1, 'Relation is required.'),
  email: z.string().email('A valid email is required to send an invitation.'),
});


export function AddFamilyMemberForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const form = useForm<z.infer<typeof familyMemberSchema>>({
    resolver: zodResolver(familyMemberSchema),
    defaultValues: {
      name: '',
      relation: '',
      email: '',
    },
  });

  async function onSubmit(values: z.infer<typeof familyMemberSchema>) {
    if(!user || !user.email) {
        toast({ title: 'Error', description: 'You must be logged in to add a family member', variant: 'destructive'});
        return;
    }
    
    if(values.email === user.email) {
        toast({ title: 'Error', description: 'You cannot invite yourself.', variant: 'destructive'});
        return;
    }

    try {
        await createFamilyInvitation({
          inviterId: user.uid,
          inviterName: user.displayName || 'A user',
          inviterPhotoUrl: user.photoURL,
          inviteeEmail: values.email,
          inviteeName: values.name,
          relation: values.relation,
        });
        toast({
            title: "Invitation Sent",
            description: `An invitation has been sent to ${values.name}.`,
        });
        router.push('/family');
    } catch (error: any) {
        console.error("Error adding family member:", error);
        toast({ title: 'Error', description: error.message || 'Could not add family member. Please try again.', variant: 'destructive'});
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Jane Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="relation"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Relation</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Mother, Son" {...field} />
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
                <Input type="email" placeholder="e.g., jane.doe@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Sending...' : 'Send Invitation'}
        </Button>
      </form>
    </Form>
  );
}
