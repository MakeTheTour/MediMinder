
'use server';
/**
 * @fileOverview Generates an alert message for a family member and writes it to the `familyAlerts` collection.
 *
 * - generateFamilyAlert - A function that creates the alert message and Firestore document.
 * - FamilyAlertInput - The input type for the generateFamilyAlert function.
 * - FamilyAlertOutput - The return type for the generateFamilyAlert function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const FamilyAlertInputSchema = z.object({
  patientName: z.string().describe("The name of the person who missed their medication."),
  medicationName: z.string().describe("The name of the medication that was missed."),
  familyName: z.string().describe("The name of the family member to be notified."),
  familyMemberId: z.string().describe("The UID of the family member to be notified."),
});
export type FamilyAlertInput = z.infer<typeof FamilyAlertInputSchema>;

const FamilyAlertOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  alertMessage: z.string().describe("The notification message to be sent to the family member."),
});
export type FamilyAlertOutput = z.infer<typeof FamilyAlertOutputSchema>;

export async function generateFamilyAlert(input: FamilyAlertInput): Promise<FamilyAlertOutput> {
  return generateFamilyAlertFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFamilyAlertPrompt',
  input: {schema: z.object({ patientName: z.string(), familyName: z.string(), medicationName: z.string() })},
  output: {schema: z.object({ alertMessage: z.string() })},
  prompt: `You are an AI assistant for a health app called MediMinder. Your task is to generate a concise, clear, and caring notification message.

This message will be sent to a family member because the user has missed a dose of their medication.

The user's name is {{{patientName}}}.
The family member's name is {{{familyName}}}.
The medication missed is {{{medicationName}}}.

Generate a friendly and supportive message to {{{familyName}}} informing them that {{{patientName}}} has missed their dose of {{{medicationName}}}. Encourage them to check in with {{{patientName}}}.
  `,
});

const generateFamilyAlertFlow = ai.defineFlow(
  {
    name: 'generateFamilyAlertFlow',
    inputSchema: FamilyAlertInputSchema,
    outputSchema: FamilyAlertOutputSchema,
  },
  async ({ patientName, medicationName, familyName, familyMemberId }) => {
    try {
        const {output} = await prompt({ patientName, medicationName, familyName });
        if (!output) {
            throw new Error("Failed to generate alert message.");
        }

        const alertData = {
            familyMemberId: familyMemberId,
            patientName: patientName,
            medicationName: medicationName,
            alertMessage: output.alertMessage,
            createdAt: new Date().toISOString(),
        };

        await addDoc(collection(db, 'familyAlerts'), alertData);
        
        return {
            success: true,
            message: `Alert created for ${familyName}.`,
            alertMessage: output.alertMessage,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        console.error("Error in generateFamilyAlertFlow: ", errorMessage);
        return {
            success: false,
            message: errorMessage,
            alertMessage: "",
        };
    }
  }
);
