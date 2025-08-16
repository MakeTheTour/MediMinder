
'use server';
/**
 * @fileOverview Generates a reminder message for an upcoming doctor's appointment.
 *
 * - generateAppointmentReminder - A function that creates the reminder message.
 * - AppointmentReminderInput - The input type for the generateAppointmentReminder function.
 * - AppointmentReminderOutput - The return type for the generateAppointmentReminder function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AppointmentReminderInputSchema = z.object({
  patientName: z.string().describe("The name of the person with the appointment."),
  doctorName: z.string().describe("The name of the doctor for the appointment."),
  specialty: z.string().describe("The specialty of the doctor."),
  appointmentDate: z.string().describe("The date of the appointment (e.g., 2024-12-25)."),
  appointmentTime: z.string().describe("The time of the appointment (e.g., 14:30)."),
  reminderTime: z.string().describe("How far in advance the reminder is (e.g., 24 hours, 1 hour).")
});
export type AppointmentReminderInput = z.infer<typeof AppointmentReminderInputSchema>;

const AppointmentReminderOutputSchema = z.object({
  reminderMessage: z.string().describe("The notification message to be sent to the user."),
});
export type AppointmentReminderOutput = z.infer<typeof AppointmentReminderOutputSchema>;

export async function generateAppointmentReminder(input: AppointmentReminderInput): Promise<AppointmentReminderOutput> {
  return appointmentReminderFlow(input);
}

const prompt = ai.definePrompt({
  name: 'appointmentReminderPrompt',
  input: {schema: AppointmentReminderInputSchema},
  output: {schema: AppointmentReminderOutputSchema},
  prompt: `You are an AI assistant for a health app called MediMinder. Your task is to generate a concise and clear reminder for an upcoming doctor's appointment for the user.

Details for user {{{patientName}}}:
- Doctor: Dr. {{{doctorName}}} ({{{specialty}}})
- When: {{{appointmentDate}}} at {{{appointmentTime}}}

This is a {{{reminderTime}}} reminder.

Generate a friendly and helpful message.
`,
});

const appointmentReminderFlow = ai.defineFlow(
  {
    name: 'appointmentReminderFlow',
    inputSchema: AppointmentReminderInputSchema,
    outputSchema: AppointmentReminderOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
