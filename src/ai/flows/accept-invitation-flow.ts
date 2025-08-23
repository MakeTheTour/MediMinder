
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
import { findUserByEmail } from './find-user-by-email-flow';

const AcceptInvitationInputSchema = z.object({
  invitationId: z.string(),
  inviterId: z.string(),
  inviteeId: z.string(),
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
  async ({ invitationId, inviterId, inviteeId }) => {
    try {
      const batch = writeBatch(db);

      // 1. Update the invitation status to 'accepted'
      const invitationRef = doc(db, 'invitations', invitationId);
      const invitationSnap = await getDoc(invitationRef);
      const invitationData = invitationSnap.data();

      if (!invitationData) {
        throw new Error("Invitation not found.");
      }
      
      batch.update(invitationRef, { status: 'accepted', inviteeId: inviteeId });
      
      const inviterProfile = (await getDoc(doc(db, 'users', inviterId))).data();
      const inviteeProfile = (await getDoc(doc(db, 'users', inviteeId))).data();
      
      if (!inviterProfile || !inviteeProfile) {
        throw new Error("Could not find user profiles.");
      }

      // 2. Add the parent (invitee) to the child's (inviter's) familyMembers subcollection
      const childFamilyMemberRef = doc(collection(db, 'users', inviterId, 'familyMembers'));
      batch.set(childFamilyMemberRef, {
          uid: inviteeId,
          name: inviteeProfile.name,
          email: inviteeProfile.email,
          relation: invitationData.relation,
          status: 'accepted',
          photoURL: inviteeProfile.photoURL || null, 
      });

      // 3. Add the child (inviter) to the parent's (invitee's) familyMembers subcollection
      const parentFamilyMemberRef = doc(collection(db, 'users', inviteeId, 'familyMembers'));
      batch.set(parentFamilyMemberRef, {
          uid: inviterId,
          name: inviterProfile.name,
          email: inviterProfile.email,
          relation: 'Child', // The inviter is the child of the parent accepting
          status: 'accepted',
          photoURL: inviterProfile.photoURL || null,
      });
      
      await batch.commit();

      return {
        success: true,
        message: 'Invitation accepted successfully.',
      };

    } catch (error) {
        console.error("Error accepting invitation: ", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return {
            success: false,
            message: `Failed to accept invitation: ${errorMessage}`,
        }
    }
  }
);
