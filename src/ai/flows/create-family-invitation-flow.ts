
'use server';
/**
 * @fileOverview Creates a parent invitation.
 *
 * - createParentInvitation - A function that creates the invitation.
 * - CreateParentInvitationInput - The input type for the function.
 * - CreateParentInvitationOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const CreateParentInvitationInputSchema = z.object({
  inviterId: z.string(),
  inviterName: z.string(),
  inviterPhotoUrl: z.string().nullable().optional(),
  inviteeEmail: z.string().email(),
  inviteeName: z.string(),
  relation: z.string(),
});
export type CreateParentInvitationInput = z.infer<typeof CreateParentInvitationInputSchema>;

const CreateParentInvitationOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  invitationId: z.string().optional(),
});
export type CreateParentInvitationOutput = z.infer<typeof CreateParentInvitationOutputSchema>;

export async function createParentInvitation(input: CreateParentInvitationInput): Promise<CreateParentInvitationOutput> {
  return createParentInvitationFlow(input);
}

const createParentInvitationFlow = ai.defineFlow(
  {
    name: 'createParentInvitationFlow',
    inputSchema: CreateParentInvitationInputSchema,
    outputSchema: CreateParentInvitationOutputSchema,
  },
  async (input) => {
    try {
      // Check if an invitation already exists
      const q = query(
        collection(db, 'invitations'),
        where('inviterId', '==', input.inviterId),
        where('inviteeEmail', '==', input.inviteeEmail)
      );
      const existingInvitation = await getDocs(q);
      if (!existingInvitation.empty) {
        return {
          success: false,
          message: 'An invitation has already been sent to this email address.',
        };
      }
      
      // 1. Create the main invitation document
      const invitationData = {
        inviterId: input.inviterId,
        inviterName: input.inviterName,
        inviterPhotoUrl: input.inviterPhotoUrl,
        inviteeEmail: input.inviteeEmail,
        relation: input.relation,
        status: 'pending',
      };
      const invitationRef = await addDoc(collection(db, 'invitations'), invitationData);

      // 2. Add a record to the inviter's familyMembers subcollection
      const familyMemberData = {
        name: input.inviteeName,
        relation: input.relation,
        email: input.inviteeEmail,
        status: 'pending',
      };
      await addDoc(collection(db, 'users', input.inviterId, 'familyMembers'), familyMemberData);

      // In a real app, you would also send an email to the invitee.

      return {
        success: true,
        message: 'Invitation sent successfully.',
        invitationId: invitationRef.id,
      };

    } catch (error) {
        console.error("Error creating invitation: ", error);
        return {
            success: false,
            message: 'Failed to send invitation.',
        }
    }
  }
);
