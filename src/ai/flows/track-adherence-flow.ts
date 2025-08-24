
'use server';
/**
 * @fileOverview Tracks user adherence to reminders (medication, appointments, etc.).
 *
 * - trackAdherence - A function that logs when a user takes or skips a dose/event.
 * - AdherenceInput - The input type for the trackAdherence function.
 * - AdherenceOutput - The return type for the trackAdherence function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { AdherenceLog } from '@/lib/types';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';


const AdherenceInputSchema = z.object({
    reminderId: z.string(),
    reminderType: z.enum(['medicine', 'doctor_visit', 'health_checkup']),
    reminderContent: z.string(), // e.g., Medication name or Appointment details
    takenAt: z.string().datetime(),
    status: z.enum(['taken', 'skipped', 'missed', 'stock_out', 'muted', 'snoozed']),
    userId: z.string(),
    scheduledTime: z.string().optional(),
    snoozeDuration: z.number().optional(),
});
export type AdherenceInput = z.infer<typeof AdherenceInputSchema>;

const AdherenceOutputSchema = z.object({
  success: z.boolean(),
  logId: z.string().optional(),
  message: z.string(),
});
export type AdherenceOutput = z.infer<typeof AdherenceOutputSchema>;

export async function trackAdherence(input: AdherenceInput): Promise<AdherenceOutput> {
  return trackAdherenceFlow(input);
}

const trackAdherenceFlow = ai.defineFlow(
  {
    name: 'trackAdherenceFlow',
    inputSchema: AdherenceInputSchema,
    outputSchema: AdherenceOutputSchema,
  },
  async (input) => {
    try {
      const adherenceLog: Omit<AdherenceLog, 'id'> = {
        ...input,
        takenAt: new Date(input.takenAt).toISOString(),
      };
      
      const docRef = await addDoc(collection(db, 'users', input.userId, 'adherenceLogs'), adherenceLog);

      return {
        success: true,
        logId: docRef.id,
        message: 'Adherence logged successfully.'
      }

    } catch (error) {
        console.error("Error logging adherence: ", error);
        return {
            success: false,
            message: 'Failed to log adherence.'
        }
    }
  }
);
