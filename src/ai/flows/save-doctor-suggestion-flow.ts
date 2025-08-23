
'use server';
/**
 * @fileOverview Saves a doctor suggestion analysis to Firestore.
 *
 * - saveDoctorSuggestion - A function that saves the analysis.
 * - SaveDoctorSuggestionInput - The input type for the function.
 * - SaveDoctorSuggestionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { SpecialistRecommendationOutputSchema } from './symptom-checker-flow';


const SaveDoctorSuggestionInputSchema = z.object({
  userId: z.string(),
  symptoms: z.string(),
  recommendation: SpecialistRecommendationOutputSchema,
});
export type SaveDoctorSuggestionInput = z.infer<typeof SaveDoctorSuggestionInputSchema>;

const SaveDoctorSuggestionOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  suggestionId: z.string().optional(),
});
export type SaveDoctorSuggestionOutput = z.infer<typeof SaveDoctorSuggestionOutputSchema>;

export async function saveDoctorSuggestion(input: SaveDoctorSuggestionInput): Promise<SaveDoctorSuggestionOutput> {
  return saveDoctorSuggestionFlow(input);
}

const saveDoctorSuggestionFlow = ai.defineFlow(
  {
    name: 'saveDoctorSuggestionFlow',
    inputSchema: SaveDoctorSuggestionInputSchema,
    outputSchema: SaveDoctorSuggestionOutputSchema,
  },
  async (input) => {
    try {
      const suggestionData = {
        userId: input.userId,
        symptoms: input.symptoms,
        recommendation: input.recommendation,
        createdAt: new Date().toISOString(),
      };
      
      const suggestionRef = await addDoc(collection(db, 'users', input.userId, 'doctorSuggestions'), suggestionData);

      return {
        success: true,
        message: 'Doctor suggestion saved successfully.',
        suggestionId: suggestionRef.id,
      };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        console.error("Error saving doctor suggestion: ", errorMessage);
        return {
            success: false,
            message: `Failed to save suggestion: ${errorMessage}`,
        }
    }
  }
);
