
'use server';
/**
 * @fileOverview Analyzes user symptoms to provide multi-faceted health advice.
 *
 * - analyzeSymptoms - A function that provides a comprehensive analysis.
 * - SymptomAnalysisInput - The input type for the function.
 * - SymptomAnalysisOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SymptomAnalysisInputSchema = z.object({
  symptoms: z.string().describe("A description of the user's symptoms in English."),
});
export type SymptomAnalysisInput = z.infer<typeof SymptomAnalysisInputSchema>;


const SymptomAnalysisOutputSchema = z.object({
  specialistSuggestion: z.string().describe("Advice on which specialist doctor to see. (e.g., 'Consult a General Physician.')"),
  diseaseConcept: z.string().describe("Provide a concept of the potential illness based on the symptoms. (e.g., 'Your symptoms may indicate a common viral fever.')"),
  foodSuggestion: z.string().describe("List or suggest what kind of food should be eaten for a quick recovery. (e.g., 'Drink plenty of water and eat easily digestible foods.')"),
  activitySuggestion: z.string().describe("Advice on what kind of activities or exercises can be done to stay healthy. (e.g., 'Get adequate rest and you can do light exercises.')"),
});
export type SymptomAnalysisOutput = z.infer<typeof SymptomAnalysisOutputSchema>;


export async function analyzeSymptoms(input: SymptomAnalysisInput): Promise<SymptomAnalysisOutput> {
  return symptomAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'symptomAnalysisPrompt',
  input: {schema: SymptomAnalysisInputSchema},
  output: {schema: SymptomAnalysisOutputSchema},
  prompt: `You are an experienced doctor and health consultant. Your job is to analyze the user's reported symptoms and provide advice in four different categories in English. Do not give a final diagnosis under any circumstances; only provide suggestions.

User's Symptoms: "{{{symptoms}}}"

Your response must be divided into four parts:

1. Specialist Suggestion: Advise on what type of specialist doctor is needed based on the symptoms.
2. Disease Concept: Provide an idea of what common illness the symptoms might indicate. This is not a final decision, just a possibility.
3. Food Suggestion: Give a list or description of what foods should be eaten or avoided for a speedy recovery.
4. Activity Suggestion: Advise on what activities should be done or what kind of rest is needed for the patient's quick recovery.

Each answer must be concise, easy to understand, and positive.
`,
});

const symptomAnalysisFlow = ai.defineFlow(
  {
    name: 'symptomAnalysisFlow',
    inputSchema: SymptomAnalysisInputSchema,
    outputSchema: SymptomAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
