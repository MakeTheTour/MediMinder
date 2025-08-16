
'use server';
/**
 * @fileOverview Accepts a family invitation.
 *
 * - acceptInvitation - A function that handles accepting the invitation.
 * - AcceptInvitationInput - The input type for the function.
 * - AcceptInvitationOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { collection, doc, updateDoc, writeBatch, query, where, getDocs, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const AcceptInvitationInputSchema = z.object({
  invitationId: z.string(),
  inviterId: z.string(),
  inviteeId: z.string(),
  inviteeName: z.string(),
  inviteeEmail: z.string().email(),
});
export type AcceptInvitationInput = z.infer<typeof AcceptInvitationInputSchema>;

const AcceptInvitationOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type AcceptInvitationOutput = z.infer<typeof AcceptInvitationOutputSchema>;

export async function acceptInvitation(input: AcceptInvitationInput): Promise<AcceptInvitationOutput> {
  return acceptInvitationFlow(input);
}

const acceptInvitationFlow = ai.defineFlow(
  {
    name: 'acceptInvitationFlow',
    inputSchema: AcceptInvitationInputSchema,
    outputSchema: AcceptInvitationOutputSchema,
  },
  async (input) => {
    try {
      const batch = writeBatch(db);

      // 1. Update the invitation status to 'accepted'
      const invitationRef = doc(db, 'invitations', input.invitationId);
      batch.update(invitationRef, { status: 'accepted', inviteeId: input.inviteeId });
      
      // 2. Update the inviter's familyMembers record
      const inviterFamilyQuery = query(
        collection(db, 'users', input.inviterId, 'familyMembers'),
        where('email', '==', input.inviteeEmail)
      );
      const inviterFamilySnap = await getDocs(inviterFamilyQuery);
      if (!inviterFamilySnap.empty) {
        const docToUpdate = inviterFamilySnap.docs[0];
        batch.update(docToUpdate.ref, { status: 'accepted' });
      } else {
        throw new Error("Could not find family member record for inviter.");
      }

      // 3. Add a family member record to the invitee's list
      // First get the inviter's data to get their email and name
      const inviterRef = doc(db, 'users', input.inviterId);
      const inviterSnap = await getDoc(inviterRef);
      const inviterData = inviterSnap.data();

      // Then get the invitation data to get the relation
      const invitationSnap = await getDoc(invitationRef);
      const invitationData = invitationSnap.data();

      if (invitationData && inviterData) {
        const inviteeFamilyRef = doc(collection(db, 'users', input.inviteeId, 'familyMembers'));
        batch.set(inviteeFamilyRef, {
            name: invitationData.inviterName,
            email: inviterData.email, // Use the fetched email of the inviter
            relation: invitationData.relation, // Store the relation as the inviter defined it
            status: 'accepted',
            photoURL: invitationData.inviterPhotoUrl || null,
        });
      } else {
         throw new Error("Could not find inviter or invitation data.");
      }
      
      await batch.commit();

      return {
        success: true,
        message: 'Invitation accepted successfully.',
      };

    } catch (error) {
        console.error("Error accepting invitation: ", error);
        return {
            success: false,
            message: 'Failed to accept invitation.',
        }
    }
  }
);
