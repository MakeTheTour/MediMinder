
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
  suggestion: z.string().describe("A practical suggestion for the user to maintain or improve their health."),
});
export type HealthInsightsOutput = z.infer<typeof HealthInsightsOutputSchema>;

export async function generateHealthInsights(input: HealthInsightsInput): Promise<HealthInsightsOutput> {
  return healthInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'healthInsightsPrompt',
  input: {schema: HealthInsightsInputSchema},
  output: {schema: HealthInsightsOutputSchema},
  prompt: `You are an AI health assistant for an app called MediMinder. Your goal is to analyze a user's health data and provide a simple, encouraging, and helpful insight and a practical suggestion. Do not provide medical advice.

User Name: {{{userName}}}
Health Data:
{{#each healthMetrics}}
- Date: {{this.date}}, Weight: {{this.weight}}kg, BP: {{this.bloodPressure.systolic}}/{{this.bloodPressure.diastolic}}, Sugar: {{this.bloodSugar}}mg/dL, HR: {{this.heartRate}}bpm
{{/each}}

Based on this data, provide one insight and one suggestion for {{{userName}}}.
Example Insight: "Your blood pressure readings have been consistent this week. Great job staying on track!"
Example Suggestigation: "Consider a short walk after meals to help with your blood sugar levels."
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
            suggestion: "Start by adding your first health reading to get personalized insights."
        }
    }
    const {output} = await prompt(input);
    return output!;
  }
);
