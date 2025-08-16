
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
import { collection, addDoc } from 'firebase/firestore';
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
      const invitationData = {
        inviterId: input.inviterId,
        inviterName: input.inviterName,
        inviterPhotoUrl: input.inviterPhotoUrl || null,
        inviteeEmail: input.inviteeEmail,
        inviteeName: input.inviteeName,
        relation: input.relation, // e.g., 'Mother' (Child's relation to Parent)
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      
      const invitationRef = await addDoc(collection(db, 'invitations'), invitationData);

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
