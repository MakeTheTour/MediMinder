
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
import { SymptomAnalysisOutput, SymptomAnalysisOutputSchema } from '@/lib/types';

const SymptomAnalysisInputSchema = z.object({
  symptoms: z.string().describe("A description of the user's symptoms in English."),
});
export type SymptomAnalysisInput = z.infer<typeof SymptomAnalysisInputSchema>;

export type { SymptomAnalysisOutput };


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

1.  Specialist Suggestion: Advise on what type of specialist doctor is needed based on the symptoms.
2.  Disease Concept: Provide an idea of what common illness the symptoms might indicate. This is not a final decision, just a possibility.
3.  Food for Disease: Suggest specific foods that can help alleviate the described symptoms or are beneficial for the potential illness.
4.  Activity Suggestion: Advise on what activities should be done or what kind of rest is needed for the patient's quick recovery.

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
