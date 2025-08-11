
'use server';
/**
 * @fileOverview Provides a recommendation for a medical specialist based on user-reported symptoms.
 *
 * - getSpecialistRecommendation - A function that suggests a specialist.
 * - SpecialistRecommendationInput - The input type for the function.
 * - SpecialistRecommendationOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SpecialistRecommendationInputSchema = z.object({
  symptoms: z.string().describe("A description of the user's symptoms."),
});
export type SpecialistRecommendationInput = z.infer<typeof SpecialistRecommendationInputSchema>;

const SpecialistRecommendationOutputSchema = z.object({
  specialist: z.string().describe("The type of medical specialist recommended (e.g., Cardiologist, Neurologist)."),
  reasoning: z.string().describe("A brief explanation for why this specialist is recommended based on the symptoms."),
});
export type SpecialistRecommendationOutput = z.infer<typeof SpecialistRecommendationOutputSchema>;

export async function getSpecialistRecommendation(input: SpecialistRecommendationInput): Promise<SpecialistRecommendationOutput> {
  return specialistRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'specialistRecommendationPrompt',
  input: {schema: SpecialistRecommendationInputSchema},
  output: {schema: SpecialistRecommendationOutputSchema},
  prompt: `You are a helpful AI assistant in a health app. Your task is to analyze a user's reported symptoms and recommend the most appropriate type of medical specialist to consult.

Do not provide a diagnosis or medical advice. Your sole purpose is to suggest the right kind of doctor.

User's Symptoms: "{{{symptoms}}}"

Based on these symptoms, recommend a specialist and provide a very brief, one-sentence reasoning. For example, if the user reports chest pain, you might recommend a "Cardiologist" with the reasoning "Cardiologists specialize in heart-related issues, which can be a cause of chest pain."
  `,
});

const specialistRecommendationFlow = ai.defineFlow(
  {
    name: 'specialistRecommendationFlow',
    inputSchema: SpecialistRecommendationInputSchema,
    outputSchema: SpecialistRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
