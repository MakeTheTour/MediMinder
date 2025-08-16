
'use server';
/**
 * @fileOverview Finds a user by their email address.
 *
 * - findUserByEmail - A function that searches for a user.
 * - FindUserByEmailInput - The input type for the function.
 * - FindUserByEmailOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase'; 

const FindUserByEmailInputSchema = z.object({
  email: z.string().email(),
});
export type FindUserByEmailInput = z.infer<typeof FindUserByEmailInputSchema>;

const FindUserByEmailOutputSchema = z.object({
  found: z.boolean(),
  uid: z.string().optional(),
  name: z.string().optional(),
  photoURL: z.string().optional(),
});
export type FindUserByEmailOutput = z.infer<typeof FindUserByEmailOutputSchema>;

export async function findUserByEmail(input: FindUserByEmailInput): Promise<FindUserByEmailOutput> {
  return findUserByEmailFlow(input);
}

const findUserByEmailFlow = ai.defineFlow(
  {
    name: 'findUserByEmailFlow',
    inputSchema: FindUserByEmailInputSchema,
    outputSchema: FindUserByEmailOutputSchema,
  },
  async (input) => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', input.email), limit(1));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return {
          found: false,
        };
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      return {
        found: true,
        uid: userDoc.id,
        name: userData.name || '',
        photoURL: userData.photoURL || undefined,
      };

    } catch (error) {
        console.error("Error finding user by email: ", error);
        // For security reasons, don't expose the specific error.
        // But in a real app, you might want more detailed logging.
        return {
            found: false,
        }
    }
  }
);
