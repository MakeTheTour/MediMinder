
'use server';
/**
 * @fileOverview Analyzes user health data to provide insights and suggestions.
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
  insight: z.string().describe("A concise, helpful insight based on the provided health data. Address the user directly."),
  foodSuggestion: z.string().describe("A practical food or diet suggestion for the user to maintain or improve their well-being."),
  exerciseSuggestion: z.string().describe("A practical exercise suggestion for the user."),
  medicationObservation: z.string().describe("A general observation about the user's medication adherence or patterns. Do not give medical advice."),
});
export type HealthInsightsOutput = z.infer<typeof HealthInsightsOutputSchema>;

export async function generateHealthInsights(input: HealthInsightsInput): Promise<HealthInsightsOutput> {
  return healthInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'healthInsightsPrompt',
  input: {schema: HealthInsightsInputSchema},
  output: {schema: HealthInsightsOutputSchema},
  prompt: `You are an AI assistant for a health app. Your goal is to analyze a user's health data. Provide a simple, encouraging insight, and practical suggestions for food/diet, exercise, and a general observation. Do not provide medical advice.

User Name: {{{userProfile.name}}}

Health Data (most recent is first):
{{#each healthMetrics}}
- Date: {{this.date}}, Weight: {{this.weight}}kg, BP: {{this.bloodPressure.systolic}}/{{this.bloodPressure.diastolic}}, Sugar: {{this.bloodSugar}}mg/dL, HR: {{this.heartRate}}bpm
{{/each}}

Based on this data, provide one overall insight for {{{userProfile.name}}}. Look for patterns or recent changes. For example: "Your heart rate has been very consistent lately, which is a great sign of stable cardiovascular health."

Then, provide a food/diet suggestion, an exercise suggestion, and a general observation.

- The food suggestion should be a simple tip. (e.g., "Consider incorporating more leafy greens into your diet to boost your iron levels.")
- The exercise suggestion should be a simple activity. (e.g., "A brisk 30-minute walk each day can significantly improve your cardiovascular health.")
- The medication observation should be a general, supportive comment if medication data were present. (e.g., "Remembering to take your medication consistently is key to managing your health effectively. Keep up the great work!")

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
            insight: "No health data recorded yet. Log your data to get AI insights.",
            foodSuggestion: "Log your health data to get food recommendations.",
            exerciseSuggestion: "Log your health data to get exercise suggestions.",
            medicationObservation: "Log your health data to see medication observations."
        }
    }
    const {output} = await prompt(input);
    return output!;
  }
);
