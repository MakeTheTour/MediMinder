
'use client';

import { Users2, Plus, Check, X } from 'lucide-react';
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
import { AddParentDialog } from '@/components/add-parent-dialog';

export default function FamilyPage() {
    const { user, isGuest } = useAuth();
    const { toast } = useToast();
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);
    const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddParentDialogOpen, setIsAddParentDialogOpen] = useState(false);
    const router = useRouter();

    useEffect(() => {
      if (!user || isGuest) {
        setFamilyMembers([]);
        setSentInvitations([]);
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

      // Listen for family members (accepted parents)
      const membersUnsub = onSnapshot(collection(db, 'users', user.uid, 'familyMembers'), (snapshot) => {
          setFamilyMembers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FamilyMember)));
          setLoading(false);
      });

      // Listen for invitations sent BY this user that are still pending
      const sentQuery = query(collection(db, 'invitations'), where('inviterId', '==', user.uid));
      const sentUnsub = onSnapshot(sentQuery, (snapshot) => {
         setSentInvitations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation)));
      });


      // Listen for invitations sent TO this user's email
      if (user.email) {
          const receivedQuery = query(collection(db, 'invitations'), where('inviteeEmail', '==', user.email));
          const receivedUnsub = onSnapshot(receivedQuery, (snapshot) => {
              setReceivedInvitations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation)));
          });
           return () => {
                membersUnsub();
                sentUnsub();
                receivedUnsub();
            };
      }

      return () => {
        membersUnsub();
        sentUnsub();
      };
    }, [user, isGuest]);

    const handleCancelSentInvitation = async (invitationId: string) => {
        await deleteDoc(doc(db, 'invitations', invitationId));
        toast({ title: 'Invitation Cancelled' });
    };
    
    const handleRemoveLinkedMember = async (memberId: string) => {
        if (!user) return;
        // This is complex because it should update both users' records.
        // A more robust solution would use a Cloud Function to handle denormalization.
        await deleteDoc(doc(db, 'users', user.uid, 'familyMembers', memberId));
        toast({ title: 'Parent Removed' });
    }

    const handleAccept = async (invitation: Invitation) => {
      if (!user) return;
      if (!userProfile?.isPremium) {
        toast({
          title: 'Premium Required',
          description: 'Please upgrade to Premium to accept invitations from your child.',
          action: <Button onClick={() => router.push('/settings/premium')}>Upgrade</Button>,
        });
        return;
      }
      try {
        await acceptInvitation({
          invitationId: invitation.id,
          inviterId: invitation.inviterId,
          inviteeId: user.uid,
          inviteeName: user.displayName || 'New Parent',
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
    
    const handleAddParentClick = () => {
        if (isGuest || !user) {
            router.push('/login');
        } else {
            setIsAddParentDialogOpen(true);
        }
    }

    const allLinkedAccounts = [
        ...familyMembers,
        ...sentInvitations.filter(inv => inv.status === 'pending').map(inv => ({
            id: inv.id,
            name: inv.inviteeName,
            email: inv.inviteeEmail,
            relation: inv.relation,
            status: 'pending' as const
        }))
    ];

  return (
    <>
      <AddParentDialog
        open={isAddParentDialogOpen}
        onOpenChange={setIsAddParentDialogOpen}
        onInvitationSent={() => setIsAddParentDialogOpen(false)}
      />
      <div className="container mx-auto max-w-2xl p-4 space-y-6">
        <header className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-bold">My Parents</h1>
            <Button onClick={handleAddParentClick} size="sm">
                <Plus className="mr-2 h-4 w-4" /> Add Parent
            </Button>
        </header>
        
        {receivedInvitations.filter(inv => inv.status === 'pending').length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>Pending Invitations</CardTitle>
                    <CardDescription>You have been invited to be a parent.</CardDescription>
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
            <CardTitle>My Linked Accounts</CardTitle>
            <CardDescription>Accounts you are linked with.</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="space-y-4">
                {(!isGuest && allLinkedAccounts.length > 0) ? allLinkedAccounts.map(member => (
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
                        <Button variant="ghost" size="sm" onClick={() => member.status === 'pending' ? handleCancelSentInvitation(member.id) : handleRemoveLinkedMember(member.id)}>
                            {member.status === 'pending' ? 'Cancel' : 'Remove'}
                        </Button>
                    </div>
                </div>
                )) : (
                    <div className="text-center py-10">
                        <Users2 className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">{isGuest ? "Sign in to manage your parents" : "No parents added"}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{isGuest ? "Create an account or sign in to add parents and share progress." : "Add a parent to share your progress."}</p>
                        <Button onClick={handleAddParentClick} size="sm" className="mt-4">
                            <Plus className="mr-2 h-4 w-4" /> {isGuest ? 'Sign In' : 'Add Parent'}
                        </Button>
                    </div>
                )}
            </div>
            </CardContent>
        </Card>
      </div>
    </>
  );
}
