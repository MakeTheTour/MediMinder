
'use client';

import { useState } from 'react';
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
import { useAuth } from '@/context/auth-context';
import { createParentInvitation } from '@/ai/flows/create-family-invitation-flow';
import { Loader2 } from 'lucide-react';

const inviteSchema = z.object({
  email: z.string().email('A valid email is required.'),
  name: z.string().min(1, 'Parent\'s name is required.'),
  relation: z.string().min(1, 'Relation is required.'),
});

interface AddParentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvitationSent: () => void;
}

export function AddParentDialog({ open, onOpenChange, onInvitationSent }: AddParentDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [isInviting, setIsInviting] = useState(false);
  
  const form = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', name: '', relation: '' },
  });

  async function handleInvite(values: z.infer<typeof inviteSchema>) {
    if(!user) {
        toast({ title: 'Error', description: 'You must be logged in to add a parent', variant: 'destructive'});
        return;
    }

    setIsInviting(true);
    try {
        const result = await createParentInvitation({
          inviterId: user.uid,
          inviterName: user.displayName || 'A user',
          inviterPhotoUrl: user.photoURL,
          inviteeEmail: values.email,
          inviteeName: values.name,
          relation: values.relation,
        });

        if (result.success) {
            toast({
                title: "Invitation Sent",
                description: `An invitation has been sent to ${values.name}.`,
            });
            onInvitationSent();
            form.reset();
        } else {
             toast({ title: 'Error', description: result.message || 'Could not add parent.', variant: 'destructive'});
        }
        
    } catch (error: any) {
        console.error("Error adding parent:", error);
        toast({ title: 'Error', description: error.message || 'Could not add parent. Please try again.', variant: 'destructive'});
    } finally {
        setIsInviting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
            form.reset();
        }
        onOpenChange(isOpen);
    }}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add Parent</DialogTitle>
                <DialogDescription>
                    Send an invitation by filling out the details below.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleInvite)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Parent's Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., Jane Doe" {...field} />
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
                                <FormLabel>Parent's Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="e.g., jane.doe@example.com" {...field} />
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
                                <FormLabel>Your Relation to Them</FormLabel>
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
            </div>
        </DialogContent>
    </Dialog>
  );
}
