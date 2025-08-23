
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
import { SpecialistRecommendationOutput, SpecialistRecommendationOutputSchema } from '@/lib/types';

const SpecialistRecommendationInputSchema = z.object({
  symptoms: z.string().describe("A description of the user's symptoms."),
  city: z.string().optional().describe("The user's city for location-specific recommendations."),
});
export type SpecialistRecommendationInput = z.infer<typeof SpecialistRecommendationInputSchema>;

export type { SpecialistRecommendationOutput };

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
{{#if city}}
User's City: "{{{city}}}"

Based on the symptoms, first recommend a medical specialist (e.g., Cardiologist, Neurologist) and provide a brief reasoning.
Then, acting as if you have access to a list of top-rated doctors, generate a plausible name and full address for a fictional, top-rated doctor of that specialty in the user's city.
For example, for "San Francisco", you could suggest "Dr. Evelyn Reed, Cardiologist" at "456 Heartwell Tower, San Francisco, CA 94102".
{{else}}
Based on these symptoms, recommend a medical specialist (e.g., Cardiologist, Neurologist) and provide a very brief, one-sentence reasoning. For example, if the user reports chest pain and shortness of breath, you might recommend a "Cardiologist" with the reasoning "A cardiologist specializes in heart-related issues, which could be related to your symptoms."
{{/if}}
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
