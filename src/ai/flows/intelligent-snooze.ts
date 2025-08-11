'use server';

/**
 * @fileOverview Manages snooze intervals for medication reminders based on user behavior and medication type.
 *
 * - intelligentSnooze - A function that determines the optimal snooze interval.
 * - IntelligentSnoozeInput - The input type for the intelligentSnooze function.
 * - IntelligentSnoozeOutput - The return type for the intelligentSnooze function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IntelligentSnoozeInputSchema = z.object({
  medicationType: z
    .string()
    .describe('The type of medication (e.g., pill, liquid, injection).'),
  pastSnoozeBehavior: z
    .array(z.number())
    .describe(
      'An array of snooze intervals (in minutes) the user has previously used for this medication.'
    ),
  userSchedule: z
    .string()
    .describe(
      'The user schedule and any important meetings or times they are busy.'
    ),
});

export type IntelligentSnoozeInput = z.infer<typeof IntelligentSnoozeInputSchema>;

const IntelligentSnoozeOutputSchema = z.object({
  snoozeInterval: z
    .number()
    .describe(
      'The recommended snooze interval in minutes, based on user behavior and medication type.'
    ),
  reasoning: z
    .string()
    .describe(
      'The reasoning behind the suggested snooze interval, considering potential interruptions and adherence to medication schedule.'
    ),
});

export type IntelligentSnoozeOutput = z.infer<typeof IntelligentSnoozeOutputSchema>;

export async function intelligentSnooze(input: IntelligentSnoozeInput): Promise<IntelligentSnoozeOutput> {
  return intelligentSnoozeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'intelligentSnoozePrompt',
  input: {schema: IntelligentSnoozeInputSchema},
  output: {schema: IntelligentSnoozeOutputSchema},
  prompt: `You are an AI assistant that helps users determine an optimal snooze interval for medication reminders.

  Given the following information about the user's medication and behavior, recommend a snooze interval (in minutes) that balances avoiding missed doses with minimizing unnecessary interruptions.

  Medication Type: {{{medicationType}}}
  Past Snooze Behavior: {{#if pastSnoozeBehavior}}{{#each pastSnoozeBehavior}}{{{this}}} {{/each}}{{else}}No past snooze behavior recorded{{/if}}
  User Schedule: {{{userSchedule}}}

  Consider the medication type and potential consequences of delayed intake, the user's past snooze behavior, and their schedule.  Balance the need for adherence with the potential for interruptions, especially when the user is likely to be busy or sleeping.
  Provide a reasoning for your suggested snooze interval.
  `,
});

const intelligentSnoozeFlow = ai.defineFlow(
  {
    name: 'intelligentSnoozeFlow',
    inputSchema: IntelligentSnoozeInputSchema,
    outputSchema: IntelligentSnoozeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
