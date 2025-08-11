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
import { useLocalStorage } from '@/hooks/use-local-storage';
import { FamilyMember } from '@/lib/types';
import { useToast } from "@/hooks/use-toast"

const familyMemberSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  relation: z.string().min(1, 'Relation is required.'),
  email: z.string().email('A valid email is required to send an invitation.'),
});


export function AddFamilyMemberForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [familyMembers, setFamilyMembers] = useLocalStorage<FamilyMember[]>('family-members', []);

  const form = useForm<z.infer<typeof familyMemberSchema>>({
    resolver: zodResolver(familyMemberSchema),
    defaultValues: {
      name: '',
      relation: '',
      email: '',
    },
  });

  function onSubmit(values: z.infer<typeof familyMemberSchema>) {
    const newFamilyMember: FamilyMember = {
      id: new Date().toISOString(),
      ...values,
      status: 'pending',
    };
    setFamilyMembers([...familyMembers, newFamilyMember]);
    toast({
        title: "Invitation Sent",
        description: `An invitation has been sent to ${values.name}.`,
      })
    router.push('/family');
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
        <Button type="submit" className="w-full">Send Invitation</Button>
      </form>
    </Form>
  );
}
