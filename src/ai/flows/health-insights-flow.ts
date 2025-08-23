
'use server';
/**
 * @fileOverview Analyzes user health data and saved suggestions to provide holistic, alternative medicine insights.
 *
 * - generateHealthInsights - A function that creates health insights based on tracked metrics and saved suggestions.
 * - HealthInsightsInput - The input type for the generateHealthInsights function.
 * - HealthInsightsOutput - The return type for the generateHealthInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { HealthMetric, HealthMetricSchema, UserProfile, UserProfileSchema, SpecialistRecommendationOutput, SpecialistRecommendationOutputSchema } from '@/lib/types';

const HealthInsightsInputSchema = z.object({
  healthMetrics: z.array(HealthMetricSchema).describe("An array of the user's recent health metric readings."),
  savedSuggestions: z.array(z.object({
      symptoms: z.string(),
      recommendation: SpecialistRecommendationOutputSchema,
  })).describe("An array of past AI-generated specialist recommendations the user has saved."),
  userProfile: UserProfileSchema.describe("The user's profile data."),
});
export type HealthInsightsInput = z.infer<typeof HealthInsightsInputSchema>;

const HealthInsightsOutputSchema = z.object({
  insight: z.string().describe("A concise, helpful insight based on the provided health data. Address the user directly."),
  foodSuggestion: z.string().describe("A practical food or diet suggestion from an alternative/holistic medicine perspective."),
  exerciseSuggestion: z.string().describe("A practical exercise suggestion from an alternative/holistic medicine perspective (e.g., yoga, tai chi)."),
  holisticObservation: z.string().describe("A general observation about the user's wellness journey. Do not give medical advice."),
});
export type HealthInsightsOutput = z.infer<typeof HealthInsightsOutputSchema>;

export async function generateHealthInsights(input: HealthInsightsInput): Promise<HealthInsightsOutput> {
  return healthInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'healthInsightsPrompt',
  input: {schema: HealthInsightsInputSchema},
  output: {schema: HealthInsightsOutputSchema},
  prompt: `You are an AI assistant and alternative medicine expert for a health app. Your goal is to analyze a user's health data and their history of saved specialist suggestions. Provide a simple, encouraging insight, and practical suggestions for food/diet and exercise from a holistic perspective. Do not provide medical advice.

User Name: {{{userProfile.name}}}

Health Data (most recent is first):
{{#each healthMetrics}}
- Date: {{this.date}}, Weight: {{this.weight}}kg, BP: {{this.bloodPressure.systolic}}/{{this.bloodPressure.diastolic}}, Sugar: {{this.bloodSugar}}mg/dL, HR: {{this.heartRate}}bpm
{{/each}}

User's Saved Symptom History & Past Suggestions:
{{#each savedSuggestions}}
- Symptoms: "{{this.symptoms}}" led to a suggestion for a {{this.recommendation.specialist}}.
{{/each}}


Based on all this data, provide one overall insight for {{{userProfile.name}}}. Look for patterns or recent changes in both their metrics and reported symptoms.

Then, provide an alternative food/diet suggestion, and an alternative exercise suggestion.
- The food suggestion should be a simple, natural tip (e.g., "Consider incorporating ginger and turmeric into your diet to help with inflammation, which may be related to your joint pain symptoms.")
- The exercise suggestion should be a gentle, holistic activity (e.g., "Gentle yoga or Tai Chi could help improve your balance and reduce stress, which might positively impact your blood pressure.")
- The 'holisticObservation' should be a general, supportive comment on their wellness journey.

Keep the tone positive, gentle, and supportive.
  `,
});

const healthInsightsFlow = ai.defineFlow(
  {
    name: 'healthInsightsFlow',
    inputSchema: HealthInsightsInputSchema,
    outputSchema: HealthInsightsOutputSchema,
  },
  async input => {
    if (input.healthMetrics.length === 0 && input.savedSuggestions.length === 0) {
        return {
            insight: "No health data recorded yet. Log your data to get AI insights.",
            foodSuggestion: "Log your health data to get food recommendations.",
            exerciseSuggestion: "Log your health data to get exercise suggestions.",
            holisticObservation: "Log your health data to see observations."
        }
    }
    const {output} = await prompt(input);
    return output!;
  }
);
