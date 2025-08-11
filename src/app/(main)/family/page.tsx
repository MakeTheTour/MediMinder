
'use client';

import { Users2, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FamilyMember } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';


export default function FamilyPage() {
    const { user } = useAuth();
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const { toast } = useToast();
    const router = useRouter();

    useEffect(() => {
      if (!user) {
        setFamilyMembers([]);
        return;
      };
      const unsub = onSnapshot(collection(db, 'users', user.uid, 'familyMembers'), (snapshot) => {
          setFamilyMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FamilyMember)));
      });
      return () => unsub();
    }, [user]);

    const handleAcceptInvitation = async (id: string) => {
        if (!user) return;
        const member = familyMembers.find(m => m.id === id);
        if (member) {
            const memberRef = doc(db, 'users', user.uid, 'familyMembers', id);
            await updateDoc(memberRef, { status: 'accepted' });
            toast({
                title: 'Invitation Accepted',
                description: `${member.name} is now linked to your family circle.`,
            });
        }
    };

    const handleDeleteMember = async (id: string) => {
        if (!user) return;
        const memberRef = doc(db, 'users', user.uid, 'familyMembers', id);
        await deleteDoc(memberRef);
    };
    
    const handleAddMemberClick = () => {
        if (!user) {
            router.push('/login');
        } else {
            router.push('/family/add');
        }
    }

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Family Circle</h1>
        <Button onClick={handleAddMemberClick} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Member
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>My Family Members</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {user && familyMembers.map(member => (
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
                <div className="flex items-center gap-2">
                    {member.status === 'pending' ? (
                        <>
                            <Badge variant="secondary">Pending</Badge>
                            <Button variant="outline" size="sm" onClick={() => handleAcceptInvitation(member.id)}>Accept</Button>
                        </>
                    ) : (
                         <Badge variant="default">Linked</Badge>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteMember(member.id)}>
                        {member.status === 'pending' ? 'Cancel' : 'Remove'}
                    </Button>
                </div>
              </div>
            ))}
             {(!user || familyMembers.length === 0) && (
                <div className="text-center py-10">
                    <Users2 className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">{user ? "Your family circle is empty" : "Sign in to manage your family circle"}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{user ? "Add family members to share your progress." : "Create an account to add family and share progress."}</p>
                     <Button onClick={handleAddMemberClick} size="sm" className="mt-4">
                        <Plus className="mr-2 h-4 w-4" /> {user ? 'Add Member' : 'Sign In'}
                    </Button>
                </div>
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
