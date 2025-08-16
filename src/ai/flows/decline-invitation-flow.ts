
'use server';
/**
 * @fileOverview Declines a family invitation.
 *
 * - declineInvitation - A function that handles declining the invitation.
 * - DeclineInvitationInput - The input type for the function.
 * - DeclineInvitationOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { collection, doc, deleteDoc, writeBatch, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const DeclineInvitationInputSchema = z.object({
  invitationId: z.string(),
});
export type DeclineInvitationInput = z.infer<typeof DeclineInvitationInputSchema>;

const DeclineInvitationOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type DeclineInvitationOutput = z.infer<typeof DeclineInvitationOutputSchema>;

export async function declineInvitation(input: DeclineInvitationInput): Promise<DeclineInvitationOutput> {
  return declineInvitationFlow(input);
}

const declineInvitationFlow = ai.defineFlow(
  {
    name: 'declineInvitationFlow',
    inputSchema: DeclineInvitationInputSchema,
    outputSchema: DeclineInvitationOutputSchema,
  },
  async (input) => {
    try {
      const batch = writeBatch(db);

      const invitationRef = doc(db, 'invitations', input.invitationId);
      const invitationSnap = await getDoc(invitationRef);
      const invitationData = invitationSnap.data();

      if (!invitationData) {
        return { success: false, message: 'Invitation not found.' };
      }

      // 1. Delete the main invitation document
      batch.delete(invitationRef);
      
      // 2. Delete the record from the inviter's familyMembers subcollection
      const inviterFamilyQuery = query(
        collection(db, 'users', invitationData.inviterId, 'familyMembers'),
        where('email', '==', invitationData.inviteeEmail)
      );
      const inviterFamilySnap = await getDocs(inviterFamilyQuery);
      inviterFamilySnap.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();

      return {
        success: true,
        message: 'Invitation declined successfully.',
      };

    } catch (error) {
        console.error("Error declining invitation: ", error);
        return {
            success: false,
            message: 'Failed to decline invitation.',
        }
    }
  }
);
