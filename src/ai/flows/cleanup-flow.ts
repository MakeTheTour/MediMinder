'use server';
/**
 * @fileOverview A flow to clean up old data from the database.
 *
 * - cleanupOldData - A function that deletes expired medications and old adherence logs.
 * - CleanupOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { collection, query, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const CleanupOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  cleanedMedications: z.number(),
  cleanedLogs: z.number(),
});
export type CleanupOutput = z.infer<typeof CleanupOutputSchema>;

export async function cleanupOldData(): Promise<CleanupOutput> {
  return cleanupOldDataFlow();
}

const cleanupOldDataFlow = ai.defineFlow(
  {
    name: 'cleanupOldDataFlow',
    outputSchema: CleanupOutputSchema,
  },
  async () => {
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);
    let totalCleanedMedications = 0;
    let totalCleanedLogs = 0;

    try {
      for (const userDoc of usersSnap.docs) {
        const userId = userDoc.id;
        const batch = writeBatch(db);

        // 1. Clean up expired medications
        const medsRef = collection(db, 'users', userId, 'medications');
        const medsSnap = await getDocs(medsRef);
        let cleanedMedsCount = 0;
        medsSnap.forEach(medDoc => {
          const med = medDoc.data();
          const endDate = new Date(med.end_date);
          if (endDate < new Date()) {
            batch.delete(medDoc.ref);
            cleanedMedsCount++;
          }
        });
        totalCleanedMedications += cleanedMedsCount;

        // 2. Clean up old adherence logs (e.g., older than 90 days)
        const logsRef = collection(db, 'users', userId, 'adherenceLogs');
        const logsSnap = await getDocs(logsRef);
        let cleanedLogsCount = 0;
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        logsSnap.forEach(logDoc => {
          const log = logDoc.data();
          const logDate = new Date(log.takenAt);
          if (logDate < ninetyDaysAgo) {
            batch.delete(logDoc.ref);
            cleanedLogsCount++;
          }
        });
        totalCleanedLogs += cleanedLogsCount;
        
        await batch.commit();
      }

      return {
        success: true,
        message: `Cleanup successful for ${usersSnap.size} users.`,
        cleanedMedications: totalCleanedMedications,
        cleanedLogs: totalCleanedLogs,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      console.error("Error cleaning up old data: ", errorMessage);
      return {
        success: false,
        message: `Failed to clean up data: ${errorMessage}`,
        cleanedMedications: 0,
        cleanedLogs: 0,
      }
    }
  }
);
