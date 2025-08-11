// src/ai/flows/customize-voice-prompts.ts
'use server';

/**
 * @fileOverview Customizes voice prompts for medication reminders.
 *
 * - customizeVoicePrompt - A function that handles the voice prompt customization process.
 * - CustomizeVoicePromptInput - The input type for the customizeVoicePrompt function.
 * - CustomizeVoicePromptOutput - The return type for the customizeVoicePrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import wav from 'wav';

const CustomizeVoicePromptInputSchema = z.object({
  text: z.string().describe('The text to be converted to speech.'),
  voiceName: z.string().optional().describe('The name of the voice to use. e.g. Algenib'),
});
export type CustomizeVoicePromptInput = z.infer<typeof CustomizeVoicePromptInputSchema>;

const CustomizeVoicePromptOutputSchema = z.object({
  audioDataUri: z.string().describe('The audio data URI of the customized voice prompt.'),
});
export type CustomizeVoicePromptOutput = z.infer<typeof CustomizeVoicePromptOutputSchema>;

export async function customizeVoicePrompt(input: CustomizeVoicePromptInput): Promise<CustomizeVoicePromptOutput> {
  return customizeVoicePromptFlow(input);
}

const customizeVoicePromptFlow = ai.defineFlow(
  {
    name: 'customizeVoicePromptFlow',
    inputSchema: CustomizeVoicePromptInputSchema,
    outputSchema: CustomizeVoicePromptOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-preview-tts',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: input.voiceName || 'Algenib' },
          },
        },
      },
      prompt: input.text,
    });
    if (!media) {
      throw new Error('no media returned');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    return {
      audioDataUri: 'data:audio/wav;base64,' + (await toWav(audioBuffer)),
    };
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
