
'use server';
/**
 * @fileOverview Removes a family member link for both users.
 *
 * - removeFamilyMember - A function that handles the removal process.
 * - RemoveFamilyMemberInput - The input type for the function.
 * - RemoveFamilyMemberOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { collection, doc, writeBatch, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const RemoveFamilyMemberInputSchema = z.object({
  removerId: z.string(),
  removedId: z.string(),
});
export type RemoveFamilyMemberInput = z.infer<typeof RemoveFamilyMemberInputSchema>;

const RemoveFamilyMemberOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type RemoveFamilyMemberOutput = z.infer<typeof RemoveFamilyMemberOutputSchema>;

export async function removeFamilyMember(input: RemoveFamilyMemberInput): Promise<RemoveFamilyMemberOutput> {
  return removeFamilyMemberFlow(input);
}

const removeFamilyMemberFlow = ai.defineFlow(
  {
    name: 'removeFamilyMemberFlow',
    inputSchema: RemoveFamilyMemberInputSchema,
    outputSchema: RemoveFamilyMemberOutputSchema,
  },
  async ({ removerId, removedId }) => {
    try {
      const batch = writeBatch(db);

      // 1. Find and delete the record of the removed person from the remover's subcollection
      const removerFamilyQuery = query(
        collection(db, 'users', removerId, 'familyMembers'),
        where('uid', '==', removedId)
      );
      const removerFamilySnap = await getDocs(removerFamilyQuery);
      if (removerFamilySnap.empty) {
        throw new Error(`Could not find member with UID ${removedId} in ${removerId}'s family.`);
      }
      removerFamilySnap.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // 2. Find and delete the record of the remover from the removed person's subcollection
      const removedFamilyQuery = query(
        collection(db, 'users', removedId, 'familyMembers'),
        where('uid', '==', removerId)
      );
      const removedFamilySnap = await getDocs(removedFamilyQuery);
      if (removedFamilySnap.empty) {
        // This might happen if data is inconsistent, but we can still proceed with the first part.
         console.warn(`Could not find member with UID ${removerId} in ${removedId}'s family. Data might be inconsistent.`);
      }
      removedFamilySnap.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();

      return {
        success: true,
        message: 'Family member removed successfully from both accounts.',
      };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        console.error("Error removing family member: ", errorMessage);
        return {
            success: false,
            message: `Failed to remove family member: ${errorMessage}`,
        }
    }
  }
);
