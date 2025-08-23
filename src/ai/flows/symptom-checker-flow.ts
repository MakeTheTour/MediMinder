
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
  prompt: `You are a helpful AI assistant in a holistic health app called NatureMed. Your task is to analyze a user's reported symptoms and recommend the most appropriate type of alternative medicine practitioner to consult.

Do not provide a diagnosis or medical advice. Your sole purpose is to suggest the right kind of holistic practitioner.

User's Symptoms: "{{{symptoms}}}"
{{#if city}}
User's City: "{{{city}}}"

Based on the symptoms, first recommend an alternative medicine specialist (e.g., Naturopath, Acupuncturist, Herbalist) and provide a brief reasoning from a holistic perspective.
Then, acting as if you have access to a list of top-rated practitioners, generate a plausible name and full address for a fictional, top-rated practitioner of that specialty in the user's city.
For example, for "San Francisco", you could suggest "Elara Finch, Licensed Acupuncturist" at "123 Serenity Lane, San Francisco, CA 94108".
{{else}}
Based on these symptoms, recommend an alternative medicine specialist (e.g., Naturopath, Acupuncturist, Herbalist) and provide a very brief, one-sentence reasoning from a holistic perspective. For example, if the user reports stress and sleep issues, you might recommend an "Acupuncturist" with the reasoning "Acupuncture can help rebalance the body's energy flow (Qi) to promote relaxation and improve sleep quality."
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

