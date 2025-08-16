
'use client';

import { Users2, Plus, Check, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FamilyMember, Invitation, UserProfile } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, deleteDoc, query, where, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { acceptInvitation } from '@/ai/flows/accept-invitation-flow';
import { declineInvitation } from '@/ai/flows/decline-invitation-flow';

export default function FamilyPage() {
    const { user, isGuest } = useAuth();
    const { toast } = useToast();
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
      if (!user || isGuest) {
        setFamilyMembers([]);
        setReceivedInvitations([]);
        setUserProfile(null);
        setLoading(false);
        return;
      }
      
      setLoading(true);

      const fetchUserProfile = async () => {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
              setUserProfile(userSnap.data() as UserProfile);
          }
      };
      
      fetchUserProfile();

      // Listen for family members added by this user
      const membersUnsub = onSnapshot(collection(db, 'users', user.uid, 'familyMembers'), (snapshot) => {
          setFamilyMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FamilyMember)));
          setLoading(false);
      });

      // Listen for invitations sent TO this user's email
      if (user.email) {
          const receivedQuery = query(collection(db, 'invitations'), where('inviteeEmail', '==', user.email));
          const receivedUnsub = onSnapshot(receivedQuery, (snapshot) => {
              setReceivedInvitations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation)));
          });
           return () => {
                membersUnsub();
                receivedUnsub();
            };
      }

      return () => {
        membersUnsub();
      };
    }, [user, isGuest]);

    const handleCancelSentInvitation = async (memberId: string, memberEmail: string) => {
        if (!user) return;
        const batch = writeBatch(db);

        // 1. Delete from the user's familyMembers subcollection
        const memberRef = doc(db, 'users', user.uid, 'familyMembers', memberId);
        batch.delete(memberRef);

        // 2. Find and delete the root invitation doc
        const q = query(collection(db, 'invitations'), where('inviterId', '==', user.uid), where('inviteeEmail', '==', memberEmail));
        const invitationSnap = await getDocs(q);
        invitationSnap.forEach((invitationDoc) => {
           batch.delete(doc(db, 'invitations', invitationDoc.id));
        });

        await batch.commit();
        toast({ title: 'Invitation Cancelled' });
    };
    
    const handleRemoveLinkedMember = async (memberId: string) => {
        if (!user) return;
        // This is complex because it should update both users' records.
        // A more robust solution would use a Cloud Function to handle denormalization.
        await deleteDoc(doc(db, 'users', user.uid, 'familyMembers', memberId));
        toast({ title: 'Member Removed' });
    }

    const handleAccept = async (invitation: Invitation) => {
      if (!user) return;
      if (!userProfile?.isPremium) {
        toast({
          title: 'Premium Required',
          description: 'Please upgrade to Premium to accept family invitations.',
          action: <Button onClick={() => router.push('/settings/premium')}>Upgrade</Button>,
        });
        return;
      }
      try {
        await acceptInvitation({
          invitationId: invitation.id,
          inviterId: invitation.inviterId,
          inviteeId: user.uid,
          inviteeName: user.displayName || 'New Member',
          inviteeEmail: user.email!,
        });
        toast({ title: 'Invitation Accepted!', description: `You are now linked with ${invitation.inviterName}.`});
      } catch (e) {
        toast({ title: 'Error', description: 'Could not accept invitation.', variant: 'destructive'});
      }
    };

    const handleDecline = async (invitationId: string) => {
      try {
        await declineInvitation({ invitationId });
        toast({ title: 'Invitation Declined'});
      } catch (e) {
        toast({ title: 'Error', description: 'Could not decline invitation.', variant: 'destructive'});
      }
    };
    
    const handleAddMemberClick = () => {
        if (isGuest || !user) {
            router.push('/login');
        } else {
            router.push('/family/add');
        }
    }

  return (
    <div className="container mx-auto max-w-2xl p-4 space-y-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Family Circle</h1>
        <Button onClick={handleAddMemberClick} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Member
        </Button>
      </header>
      
      {receivedInvitations.filter(inv => inv.status === 'pending').length > 0 && (
         <Card>
            <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>You have been invited to join a family circle.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {receivedInvitations.filter(inv => inv.status === 'pending').map(inv => (
                        <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                            <div className="flex items-center gap-4">
                                <Avatar>
                                    <AvatarImage src={inv.inviterPhotoUrl || `https://placehold.co/40x40.png`} alt={inv.inviterName} />
                                    <AvatarFallback>{inv.inviterName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{inv.inviterName}</p>
                                    <p className="text-sm text-muted-foreground">Wants to add you as their {inv.relation}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                               <Button variant="outline" size="sm" onClick={() => handleDecline(inv.id)}>
                                    <X className="h-4 w-4 mr-1" />
                                    Decline
                                </Button>
                               <Button size="sm" onClick={() => handleAccept(inv)}>
                                    <Check className="h-4 w-4 mr-1"/>
                                    Accept
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>My Family Members</CardTitle>
           <CardDescription>Members you have added to your circle.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(!isGuest && familyMembers.length > 0) ? familyMembers.map(member => (
              <div key={member.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                <div className="flex items-center gap-4">
                   <Avatar>
                    <AvatarImage src={member.photoURL || `https://placehold.co/40x40.png`} alt={member.name} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.relation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    {member.status === 'pending' ? (
                        <Badge variant="secondary">Pending</Badge>
                    ) : (
                         <Badge variant="default">Linked</Badge>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => member.status === 'pending' ? handleCancelSentInvitation(member.id, member.email) : handleRemoveLinkedMember(member.id)}>
                        {member.status === 'pending' ? 'Cancel' : 'Remove'}
                    </Button>
                </div>
              </div>
            )) : (
                <div className="text-center py-10">
                    <Users2 className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">{isGuest ? "Sign in to manage your family" : "Your family circle is empty"}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{isGuest ? "Create an account or sign in to add family and share progress." : "Add family members to share your progress."}</p>
                     <Button onClick={handleAddMemberClick} size="sm" className="mt-4">
                        <Plus className="mr-2 h-4 w-4" /> {isGuest ? 'Sign In' : 'Add Member'}
                    </Button>
                </div>
             )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
