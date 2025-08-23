
'use server';
/**
 * @fileOverview Analyzes user health data to provide insights and suggestions from an alternative medicine perspective.
 *
 * - generateHealthInsights - A function that creates health insights based on tracked metrics.
 * - HealthInsightsInput - The input type for the generateHealthInsights function.
 * - HealthInsightsOutput - The return type for the generateHealthInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { HealthMetric, HealthMetricSchema, UserProfile, UserProfileSchema } from '@/lib/types';

const HealthInsightsInputSchema = z.object({
  healthMetrics: z.array(HealthMetricSchema).describe("An array of the user's recent health metric readings."),
  userProfile: UserProfileSchema.describe("The user's profile data."),
});
export type HealthInsightsInput = z.infer<typeof HealthInsightsInputSchema>;

const HealthInsightsOutputSchema = z.object({
  insight: z.string().describe("A concise, helpful insight based on the provided health data from a holistic perspective. Address the user directly."),
  foodSuggestion: z.string().describe("A practical food or natural supplement suggestion for the user to maintain or improve their well-being."),
  exerciseSuggestion: z.string().describe("A practical mind-body exercise suggestion (like yoga or tai chi) for the user."),
  holisticObservation: z.string().describe("A general observation about balance, energy, or patterns in the user's data. Do not give medical advice."),
});
export type HealthInsightsOutput = z.infer<typeof HealthInsightsOutputSchema>;

export async function generateHealthInsights(input: HealthInsightsInput): Promise<HealthInsightsOutput> {
  return healthInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'healthInsightsPrompt',
  input: {schema: HealthInsightsInputSchema},
  output: {schema: HealthInsightsOutputSchema},
  prompt: `You are an AI assistant for an app called NatureMed. Your goal is to analyze a user's health data from a holistic and alternative medicine perspective. Provide a simple, encouraging insight, and practical suggestions for natural foods/herbs, mind-body exercises, and a general holistic observation. Do not provide medical advice.

User Name: {{{userProfile.name}}}

Health Data (most recent is first):
{{#each healthMetrics}}
- Date: {{this.date}}, Weight: {{this.weight}}kg, BP: {{this.bloodPressure.systolic}}/{{this.bloodPressure.diastolic}}, Sugar: {{this.bloodSugar}}mg/dL, HR: {{this.heartRate}}bpm
{{/each}}

Based on this data, provide one overall insight for {{{userProfile.name}}} focused on balance and well-being. Look for patterns or recent changes. For example: "It looks like your energy, reflected in your heart rate, has been very steady lately. This is a great sign of inner balance."

Then, provide a food/herb suggestion, an exercise suggestion, and a holistic observation.

- The food suggestion should be a simple natural tip. (e.g., "Consider incorporating ginger tea into your morning routine to support digestion and energy flow.")
- The exercise suggestion should be a mind-body activity. (e.g., "A gentle 15-minute yoga session in the morning can help align your body and mind for the day.")
- The holistic observation should be a general, supportive comment about their overall wellness journey. (e.g., "Consistently tracking your body's signals is a wonderful practice of self-awareness. Keep honoring your journey.")

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
    if (input.healthMetrics.length === 0) {
        return {
            insight: "No health data recorded yet. Log your data to get NatureMed insights.",
            foodSuggestion: "Log your health data to get food recommendations.",
            exerciseSuggestion: "Log your health data to get exercise suggestions.",
            holisticObservation: "Log your health data to see holistic observations."
        }
    }
    const {output} = await prompt(input);
    return output!;
  }
);
