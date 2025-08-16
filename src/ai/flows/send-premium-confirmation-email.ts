
'use server';
/**
 * @fileOverview Sends a confirmation email to a user after they upgrade to premium.
 *
 * - sendPremiumConfirmationEmail - A function that generates and "sends" the email.
 * - PremiumConfirmationInput - The input type for the function.
 * - PremiumConfirmationOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PremiumConfirmationInputSchema = z.object({
  name: z.string().describe("The name of the user."),
  email: z.string().email().describe("The email address of the user."),
});
export type PremiumConfirmationInput = z.infer<typeof PremiumConfirmationInputSchema>;

const PremiumConfirmationOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type PremiumConfirmationOutput = z.infer<typeof PremiumConfirmationOutputSchema>;

export async function sendPremiumConfirmationEmail(input: PremiumConfirmationInput): Promise<PremiumConfirmationOutput> {
  return sendPremiumConfirmationEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sendPremiumConfirmationEmailPrompt',
  input: {schema: PremiumConfirmationInputSchema},
  prompt: `
    You are an AI assistant for MediMinder.
    Generate a friendly and welcoming email to a user who has just upgraded to MediMinder Premium.

    The user's name is: {{{name}}}
    The user's email is: {{{email}}}

    The email should:
    1. Have a clear subject line like "Welcome to MediMinder Premium!"
    2. Thank the user for upgrading.
    3. Briefly mention the key benefits of premium (Family Alerts, Advanced Reports).
    4. Be signed off from "The MediMinder Team".

    Format the output as a simple string containing the full email (Subject and Body).
  `,
});

const sendPremiumConfirmationEmailFlow = ai.defineFlow(
  {
    name: 'sendPremiumConfirmationEmailFlow',
    inputSchema: PremiumConfirmationInputSchema,
    outputSchema: PremiumConfirmationOutputSchema,
  },
  async input => {
    const {text} = await prompt(input);

    // In a real application, you would integrate with an email sending service like SendGrid or Resend,
    // using credentials configured in the admin dashboard.
    // For this simulation, we will just log the email content to the console.
    
    // This address would be retrieved from the admin SMTP settings.
    const fromAddress = 'support@mediminder.com';

    console.log("--- Sending Premium Confirmation Email ---");
    console.log(`From: The MediMinder Team <${fromAddress}>`);
    console.log(`To: ${input.email}`);
    console.log(text);
    console.log("------------------------------------------");

    return {
      success: true,
      message: `Successfully generated confirmation email for ${input.email}.`,
    };
  }
);
