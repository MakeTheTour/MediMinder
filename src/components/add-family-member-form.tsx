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
    },
  });

  function onSubmit(values: z.infer<typeof familyMemberSchema>) {
    const newFamilyMember: FamilyMember = {
      id: new Date().toISOString(),
      ...values,
    };
    setFamilyMembers([...familyMembers, newFamilyMember]);
    toast({
        title: "Family Member Added",
        description: `${values.name} has been added to your family circle.`,
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
        <Button type="submit" className="w-full">Save Member</Button>
      </form>
    </Form>
  );
}
