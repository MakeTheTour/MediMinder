
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
import { HealthMetric, HealthMetricSchema } from '@/lib/types';

const HealthInsightsInputSchema = z.object({
  healthMetrics: z.array(HealthMetricSchema).describe("An array of the user's recent health metric readings."),
  userName: z.string().describe("The name of the user."),
});
export type HealthInsightsInput = z.infer<typeof HealthInsightsInputSchema>;

const HealthInsightsOutputSchema = z.object({
  insight: z.string().describe("A concise, helpful insight based on the provided health data. Address the user directly."),
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

User Name: {{{userName}}}
Health Data:
{{#each healthMetrics}}
- Date: {{this.date}}, Weight: {{this.weight}}kg, BP: {{this.bloodPressure.systolic}}/{{this.bloodPressure.diastolic}}, Sugar: {{this.bloodSugar}}mg/dL, HR: {{this.heartRate}}bpm
{{/each}}

Based on this data, provide one overall insight for {{{userName}}}.
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
    // In a real app, you might want more complex logic here to select relevant data
    if (input.healthMetrics.length === 0) {
        return {
            insight: "No health data recorded yet.",
            foodSuggestion: "Log your health data to get food recommendations.",
            exerciseSuggestion: "Log your health data to get exercise suggestions.",
            medicationObservation: "Log your health data to see medication-related observations."
        }
    }
    const {output} = await prompt(input);
    return output!;
  }
);
