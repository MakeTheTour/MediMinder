
'use server';
/**
 * @fileOverview Generates an alert message for a family member when a medication dose is missed.
 *
 * - generateFamilyAlert - A function that creates the alert message.
 * - FamilyAlertInput - The input type for the generateFamilyAlert function.
 * - FamilyAlertOutput - The return type for the generateFamilyAlert function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FamilyAlertInputSchema = z.object({
  patientName: z.string().describe("The name of the person who missed their medication."),
  medicationName: z.string().describe("The name of the medication that was missed."),
  familyName: z.string().describe("The name of the family member to be notified."),
});
export type FamilyAlertInput = z.infer<typeof FamilyAlertInputSchema>;

const FamilyAlertOutputSchema = z.object({
  alertMessage: z.string().describe("The notification message to be sent to the family member."),
});
export type FamilyAlertOutput = z.infer<typeof FamilyAlertOutputSchema>;

export async function generateFamilyAlert(input: FamilyAlertInput): Promise<FamilyAlertOutput> {
  return familyAlertFlow(input);
}

const prompt = ai.definePrompt({
  name: 'familyAlertPrompt',
  input: {schema: FamilyAlertInputSchema},
  output: {schema: FamilyAlertOutputSchema},
  prompt: `You are an AI assistant for a health app called MediMinder. Your task is to generate a concise, clear, and caring notification message.

This message will be sent to a family member because the user has missed a dose of their medication.

The user's name is {{{patientName}}}.
The family member's name is {{{familyName}}}.
The medication missed is {{{medicationName}}}.

Generate a friendly and supportive message to {{{familyName}}} informing them that {{{patientName}}} has missed their dose of {{{medicationName}}}. Encourage them to check in with {{{patientName}}}.
  `,
});

const familyAlertFlow = ai.defineFlow(
  {
    name: 'familyAlertFlow',
    inputSchema: FamilyAlertInputSchema,
    outputSchema: FamilyAlertOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
