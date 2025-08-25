
'use server';
/**
 * @fileOverview Deletes a saved symptom analysis from Firestore.
 *
 * - deleteSymptomAnalysis - A function that deletes the analysis.
 * - DeleteSymptomAnalysisInput - The input type for the function.
 * - DeleteSymptomAnalysisOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const DeleteSymptomAnalysisInputSchema = z.object({
  userId: z.string(),
  analysisId: z.string(),
});
export type DeleteSymptomAnalysisInput = z.infer<typeof DeleteSymptomAnalysisInputSchema>;

const DeleteSymptomAnalysisOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type DeleteSymptomAnalysisOutput = z.infer<typeof DeleteSymptomAnalysisOutputSchema>;

export async function deleteSymptomAnalysis(input: DeleteSymptomAnalysisInput): Promise<DeleteSymptomAnalysisOutput> {
  return deleteSymptomAnalysisFlow(input);
}

const deleteSymptomAnalysisFlow = ai.defineFlow(
  {
    name: 'deleteSymptomAnalysisFlow',
    inputSchema: DeleteSymptomAnalysisInputSchema,
    outputSchema: DeleteSymptomAnalysisOutputSchema,
  },
  async ({ userId, analysisId }) => {
    try {
      const analysisRef = doc(db, 'users', userId, 'symptomAnalyses', analysisId);
      await deleteDoc(analysisRef);

      return {
        success: true,
        message: 'Analysis deleted successfully.',
      };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error("Error deleting symptom analysis: ", errorMessage);
        return {
            success: false,
            message: `Failed to delete analysis: ${errorMessage}`,
        }
    }
  }
);
