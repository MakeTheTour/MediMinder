
'use server';
/**
 * @fileOverview Deletes a saved doctor suggestion from Firestore.
 *
 * - deleteDoctorSuggestion - A function that deletes the suggestion.
 * - DeleteDoctorSuggestionInput - The input type for the function.
 * - DeleteDoctorSuggestionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const DeleteDoctorSuggestionInputSchema = z.object({
  userId: z.string(),
  suggestionId: z.string(),
});
export type DeleteDoctorSuggestionInput = z.infer<typeof DeleteDoctorSuggestionInputSchema>;

const DeleteDoctorSuggestionOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type DeleteDoctorSuggestionOutput = z.infer<typeof DeleteDoctorSuggestionOutputSchema>;

export async function deleteDoctorSuggestion(input: DeleteDoctorSuggestionInput): Promise<DeleteDoctorSuggestionOutput> {
  return deleteDoctorSuggestionFlow(input);
}

const deleteDoctorSuggestionFlow = ai.defineFlow(
  {
    name: 'deleteDoctorSuggestionFlow',
    inputSchema: DeleteDoctorSuggestionInputSchema,
    outputSchema: DeleteDoctorSuggestionOutputSchema,
  },
  async ({ userId, suggestionId }) => {
    try {
      const suggestionRef = doc(db, 'users', userId, 'doctorSuggestions', suggestionId);
      await deleteDoc(suggestionRef);

      return {
        success: true,
        message: 'Suggestion deleted successfully.',
      };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error("Error deleting doctor suggestion: ", errorMessage);
        return {
            success: false,
            message: `Failed to delete suggestion: ${errorMessage}`,
        }
    }
  }
);
