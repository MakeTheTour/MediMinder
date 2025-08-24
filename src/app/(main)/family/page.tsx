
'use client';

import { Users2, Plus, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { FamilyMember, Invitation, UserProfile, AdherenceLog } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, doc, deleteDoc, query, where, getDoc, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { acceptInvitation } from '@/ai/flows/accept-invitation-flow';
import { declineInvitation } from '@/ai/flows/decline-invitation-flow';
import { AddParentDialog } from '@/components/add-parent-dialog';
import { removeFamilyMember } from '@/ai/flows/remove-family-member-flow';
import { subDays, startOfDay } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function FamilyPage() {
    const { user, isGuest, setInvitationsAsViewed, setFamilyMissedDoseCount } = useAuth();
    const { toast } = useToast();
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
    const [sentInvitations, setSentInvitations] = useState<Invitation[]>([]);
    const [receivedInvitations, setReceivedInvitations] = useState<Invitation[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAddParentDialogOpen, setIsAddParentDialogOpen] = useState(false);
    const [missedReports, setMissedReports] = useState<Record<string, number>>({});
    const [removingMember, setRemovingMember] = useState<FamilyMember | null>(null);
    const router = useRouter();

    useEffect(() => {
        setInvitationsAsViewed();
    }, [setInvitationsAsViewed]);
    
    useEffect(() => {
        const missedCount = Object.values(missedReports).filter(count => count > 0).length;
        setFamilyMissedDoseCount(missedCount);
    }, [missedReports, setFamilyMissedDoseCount]);

    const fetchMissedReports = useCallback(async (members: FamilyMember[]) => {
        const reports: Record<string, number> = {};
        const sevenDaysAgo = startOfDay(subDays(new Date(), 7));

        for (const member of members) {
            if (member.status !== 'accepted' || !member.uid) continue;
            try {
                // Simplified query to fetch all logs in the last 7 days.
                // Filtering by status is now done on the client side.
                const q = query(
                    collection(db, 'users', member.uid, 'adherenceLogs'),
                    where('takenAt', '>=', sevenDaysAgo.toISOString())
                );
                const querySnapshot = await getDocs(q);
                
                // Perform filtering on the client
                const recentMisses = querySnapshot.docs.filter(doc => {
                    const data = doc.data();
                    return data.status === 'missed' || data.status === 'stock_out';
                }).length;

                reports[member.uid] = recentMisses;
            } catch (error) {
                console.error(`Failed to fetch missed report for ${member.name}:`, error);
                reports[member.uid] = 0;
                 toast({
                    title: "Reporting Error",
                    description: "Could not fetch missed dose reports for some members.",
                    variant: "destructive"
                });
            }
        }
        setMissedReports(reports);
    }, [toast]);

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

      const membersUnsub = onSnapshot(collection(db, 'users', user.uid, 'familyMembers'), (snapshot) => {
          const members = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() } as FamilyMember))
            .filter(member => member.uid && member.name && member.status); // Ensure essential data exists
          setFamilyMembers(members);
          if (members.length > 0) {
              fetchMissedReports(members);
          }
          setLoading(false);
      }, (error) => {
          console.error("Error fetching family members:", error);
          setLoading(false);
      });

      const sentQuery = query(collection(db, 'invitations'), where('inviterId', '==', user.uid));
      const sentUnsub = onSnapshot(sentQuery, (snapshot) => {
         setSentInvitations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation)));
      }, (error) => console.error("Error fetching sent invitations:", error));

      const receivedQuery = query(collection(db, 'invitations'), where('inviteeEmail', '==', user.email));
      const receivedUnsub = onSnapshot(receivedQuery, (snapshot) => {
          setReceivedInvitations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invitation)));
      }, (error) => console.error("Error fetching received invitations:", error));

      return () => {
        membersUnsub();
        sentUnsub();
        receivedUnsub();
      };
    }, [user, isGuest, fetchMissedReports]);

    const handleCancelSentInvitation = async (invitationId: string) => {
        if (!user) return;
        try {
            await deleteDoc(doc(db, 'invitations', invitationId));
            toast({ title: 'Invitation Cancelled' });
        } catch (error) {
            console.error("Error cancelling invitation:", error);
            toast({ title: 'Error', description: 'Could not cancel invitation.', variant: 'destructive'});
        }
    };
    
    const handleRemoveLinkedMember = async (member: FamilyMember | null) => {
        if (!user || !member) return;
        try {
            const result = await removeFamilyMember({
                removerId: user.uid,
                removedId: member.uid,
            });
            if (result.success) {
                toast({ title: 'Parent Removed', description: `Your link with ${member.name} has been removed.` });
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error("Error removing linked member:", error);
            const errorMessage = error instanceof Error ? error.message : 'Could not remove parent.';
            toast({ title: 'Error', description: errorMessage, variant: 'destructive'});
        } finally {
            setRemovingMember(null);
        }
    }

    const handleAccept = async (invitation: Invitation) => {
      if (!user || !user.email) return;
      if (!userProfile?.isPremium) {
        toast({
          title: 'Premium Required',
          description: 'Please upgrade to Premium to accept invitations from your child.',
          action: <Button onClick={() => router.push('/settings/premium')}>Upgrade</Button>,
        });
        return;
      }
      try {
        const result = await acceptInvitation({
          invitationId: invitation.id,
          inviterId: invitation.inviterId,
          inviteeId: user.uid,
        });
        if (result.success) {
            toast({ title: 'Invitation Accepted!', description: `You are now linked with ${invitation.inviterName}.`});
        } else {
            throw new Error(result.message);
        }
      } catch (e: any) {
        toast({ title: 'Error', description: e.message || 'Could not accept invitation.', variant: 'destructive'});
      }
    };

    const handleDecline = async (invitationId: string) => {
      try {
        const result = await declineInvitation({ invitationId });
        if (result.success) {
            toast({ title: 'Invitation Declined'});
        } else {
            throw new Error(result.message);
        }
      } catch (e: any) {
        toast({ title: 'Error', description: e.message || 'Could not decline invitation.', variant: 'destructive'});
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
            uid: '', // Pending invitations don't have a confirmed user ID yet
            name: inv.inviteeName,
            email: inv.inviteeEmail,
            relation: inv.relation,
            status: 'pending' as const,
            photoURL: '',
        }))
    ];

  return (
    <>
      <AlertDialog open={!!removingMember} onOpenChange={() => setRemovingMember(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This will remove <span className="font-bold">{removingMember?.name}</span> from your linked accounts. This action cannot be undone.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleRemoveLinkedMember(removingMember)}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
            <CardDescription>Accounts you are linked with. Missed doses are from the last 7 days.</CardDescription>
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
                    <div className="flex-grow">
                        <p className="font-semibold">{member.name}</p>
                        <p className="text-sm text-muted-foreground">{member.relation}</p>
                         {member.status === 'accepted' && missedReports[member.uid] > 0 && (
                            <div className="flex items-center text-destructive text-xs mt-1 font-semibold">
                                <AlertCircle className="h-4 w-4 mr-1" />
                                {missedReports[member.uid]} Missed Doses
                            </div>
                        )}
                    </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {member.status === 'pending' ? (
                            <Badge variant="secondary">Pending</Badge>
                        ) : (
                             <Badge variant={missedReports[member.uid] > 0 ? "destructive" : "default"}>
                                {missedReports[member.uid] > 0 ? 'Needs Attention' : 'Linked'}
                             </Badge>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => member.status === 'pending' ? handleCancelSentInvitation(member.id) : setRemovingMember(member as FamilyMember)}>
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
