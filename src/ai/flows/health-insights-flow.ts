
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
  userProfile: UserProfileSchema.describe("The user's profile data, which may include height."),
});
export type HealthInsightsInput = z.infer<typeof HealthInsightsInputSchema>;

const HealthInsightsOutputSchema = z.object({
  insight: z.string().describe("A concise, helpful insight based on the provided health data, including BMI analysis if possible. Address the user directly."),
  foodSuggestion: z.string().describe("A practical food or diet suggestion for the user to maintain or improve their health."),
  exerciseSuggestion: z.string().describe("A practical exercise suggestion for the user to maintain or improve their health."),
  medicationObservation: z.string().describe("A general observation about medication adherence or its potential relation to the current data. Do not suggest changing dosage or stopping medication."),
});
export type HealthInsightsOutput = z.infer<typeof HealthInsightsOutputSchema>;

export async function generateHealthInsights(input: HealthInsightsInput): Promise<HealthInsightsOutput> {
  return healthInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'healthInsightsPrompt',
  input: {schema: HealthInsightsInputSchema},
  output: {schema: HealthInsightsOutputSchema},
  prompt: `You are an AI health assistant for an app called MediMinder. Your goal is to analyze a user's health data and provide a simple, encouraging insight, and practical suggestions for food, exercise, and an observation about their medication. Do not provide medical advice.

User Name: {{{userProfile.name}}}
{{#if userProfile.height}}User Height: {{{userProfile.height}}} cm{{/if}}

Health Data (most recent is first):
{{#each healthMetrics}}
- Date: {{this.date}}, Weight: {{this.weight}}kg, BP: {{this.bloodPressure.systolic}}/{{this.bloodPressure.diastolic}}, Sugar: {{this.bloodSugar}}mg/dL, HR: {{this.heartRate}}bpm
{{/each}}

Based on this data, provide one overall insight for {{{userProfile.name}}}.
{{#if userProfile.height}}
If the user has provided height and there's a recent weight entry, calculate their BMI (Body Mass Index). The formula is BMI = weight (kg) / (height (m))^2.
Based on the BMI, determine if they are underweight (<18.5), normal weight (18.5–24.9), or overweight (>25).
Incorporate this BMI analysis into your main "insight". For example: "Your recent weight of X kg gives you a BMI of Y, which is in the healthy range. Keep up the great work!". If they are over/underweight, provide a brief, encouraging sentence on how to improve.
{{/if}}

Then, provide a food suggestion, an exercise suggestion, and a medication observation.

- The food suggestion should be a simple dietary tip. (e.g., "Consider incorporating more leafy greens into your meals to help with overall wellness.")
- The exercise suggestion should be a practical activity. (e.g., "A brisk 15-minute walk after your largest meal can be beneficial for blood sugar levels.")
- The medication observation should be a general, supportive comment. (e.g., "Consistent medication intake is key to managing blood pressure; keep up the great work logging your doses.")

Keep the tone positive and supportive.
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
            insight: "No health data recorded yet. Log your data to get insights.",
            foodSuggestion: "Log your health data to get food recommendations.",
            exerciseSuggestion: "Log your health data to get exercise suggestions.",
            medicationObservation: "Log your health data to see medication-related observations."
        }
    }
    const {output} = await prompt(input);
    return output!;
  }
);
