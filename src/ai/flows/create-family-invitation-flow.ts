
'use server';
/**
 * @fileOverview Creates a family invitation.
 *
 * - createFamilyInvitation - A function that creates the invitation.
 * - CreateFamilyInvitationInput - The input type for the function.
 * - CreateFamilyInvitationOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const CreateFamilyInvitationInputSchema = z.object({
  inviterId: z.string(),
  inviterName: z.string(),
  inviterPhotoUrl: z.string().nullable().optional(),
  inviteeEmail: z.string().email(),
  inviteeName: z.string(),
  relation: z.string(),
});
export type CreateFamilyInvitationInput = z.infer<typeof CreateFamilyInvitationInputSchema>;

const CreateFamilyInvitationOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  invitationId: z.string().optional(),
});
export type CreateFamilyInvitationOutput = z.infer<typeof CreateFamilyInvitationOutputSchema>;

export async function createFamilyInvitation(input: CreateFamilyInvitationInput): Promise<CreateFamilyInvitationOutput> {
  return createFamilyInvitationFlow(input);
}

const createFamilyInvitationFlow = ai.defineFlow(
  {
    name: 'createFamilyInvitationFlow',
    inputSchema: CreateFamilyInvitationInputSchema,
    outputSchema: CreateFamilyInvitationOutputSchema,
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
          message: 'An invitation already exists for this email address.',
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
