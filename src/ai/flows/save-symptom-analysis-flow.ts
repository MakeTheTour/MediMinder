
'use server';
/**
 * @fileOverview Saves a symptom analysis to Firestore.
 *
 * - saveSymptomAnalysis - A function that saves the analysis.
 * - SaveSymptomAnalysisInput - The input type for the function.
 * - SaveSymptomAnalysisOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SymptomAnalysisOutputSchema } from '@/lib/types';


const SaveSymptomAnalysisInputSchema = z.object({
  userId: z.string(),
  symptoms: z.string(),
  analysis: SymptomAnalysisOutputSchema,
});
export type SaveSymptomAnalysisInput = z.infer<typeof SaveSymptomAnalysisInputSchema>;

const SaveSymptomAnalysisOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  analysisId: z.string().optional(),
});
export type SaveSymptomAnalysisOutput = z.infer<typeof SaveSymptomAnalysisOutputSchema>;

export async function saveSymptomAnalysis(input: SaveSymptomAnalysisInput): Promise<SaveSymptomAnalysisOutput> {
  return saveSymptomAnalysisFlow(input);
}

const saveSymptomAnalysisFlow = ai.defineFlow(
  {
    name: 'saveSymptomAnalysisFlow',
    inputSchema: SaveSymptomAnalysisInputSchema,
    outputSchema: SaveSymptomAnalysisOutputSchema,
  },
  async (input) => {
    try {
      const analysisData = {
        userId: input.userId,
        symptoms: input.symptoms,
        analysis: input.analysis,
        createdAt: new Date().toISOString(),
      };
      
      const analysisRef = await addDoc(collection(db, 'users', input.userId, 'symptomAnalyses'), analysisData);

      return {
        success: true,
        message: 'Symptom analysis saved successfully.',
        analysisId: analysisRef.id,
      };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error("Error saving symptom analysis: ", errorMessage);
        return {
            success: false,
            message: `Failed to save analysis: ${errorMessage}`,
        }
    }
  }
);
