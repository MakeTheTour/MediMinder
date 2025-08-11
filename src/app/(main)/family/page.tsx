'use client';

import { Users2, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { FamilyMember } from '@/lib/types';


export default function FamilyPage() {
    const [familyMembers, setFamilyMembers] = useLocalStorage<FamilyMember[]>('family-members', []);

    const handleDeleteMember = (id: string) => {
        setFamilyMembers(members => members.filter(m => m.id !== id));
    };

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Family Circle</h1>
        <Button asChild size="sm">
          <Link href="/family/add">
            <Plus className="mr-2 h-4 w-4" /> Add Member
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>My Family Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {familyMembers.map(member => (
              <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-4">
                   <Avatar>
                    <AvatarImage data-ai-hint="person portrait" src={`https://placehold.co/40x40.png`} alt={member.name} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.relation}</p>
                  </div>
                </div>
                 <Button variant="ghost" size="sm" onClick={() => handleDeleteMember(member.id)}>Remove</Button>
              </div>
            ))}
             {familyMembers.length === 0 && (
                <div className="text-center py-10">
                    <Users2 className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Your family circle is empty</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Add family members to share your progress.</p>
                     <Button asChild size="sm" className="mt-4">
                        <Link href="/family/add">
                            <Plus className="mr-2 h-4 w-4" /> Add Member
                        </Link>
                    </Button>
                </div>
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
