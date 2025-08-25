
'use server';
/**
 * @fileOverview Analyzes user symptoms to provide multi-faceted health advice in Bengali.
 *
 * - analyzeSymptoms - A function that provides a comprehensive analysis.
 * - SymptomAnalysisInput - The input type for the function.
 * - SymptomAnalysisOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SymptomAnalysisInputSchema = z.object({
  symptoms: z.string().describe("A description of the user's symptoms in Bengali or English."),
});
export type SymptomAnalysisInput = z.infer<typeof SymptomAnalysisInputSchema>;


const SymptomAnalysisOutputSchema = z.object({
  specialistSuggestion: z.string().describe("কোন বিশেষজ্ঞ ডাক্তার দেখানো উচিত তার পরামর্শ। (e.g., 'মেডিসিন বিশেষজ্ঞের সাথে পরামর্শ করুন।')"),
  diseaseConcept: z.string().describe("উপসর্গগুলোর উপর ভিত্তি করে সম্ভাব্য রোগের ধারণা দিন। (e.g., 'আপনার উপসর্গগুলো সাধারণ ভাইরাল জ্বরের ইঙ্গিত দেয়।')"),
  foodSuggestion: z.string().describe("দ্রুত সুস্থ হওয়ার জন্য কী ধরনের খাবার খাওয়া উচিত তার তালিকা বা পরামর্শ দিন। (e.g., 'প্রচুর পরিমাণে পানি পান করুন এবং সহজপাচ্য খাবার খান।')"),
  activitySuggestion: z.string().describe("সুস্থ থাকার জন্য কী ধরনের কাজ বা ব্যায়াম করা যেতে পারে তার পরামর্শ দিন। (e.g., 'পর্যাপ্ত বিশ্রাম নিন এবং হালকা ব্যায়াম করতে পারেন।')"),
});
export type SymptomAnalysisOutput = z.infer<typeof SymptomAnalysisOutputSchema>;


export async function analyzeSymptoms(input: SymptomAnalysisInput): Promise<SymptomAnalysisOutput> {
  return symptomAnalysisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'symptomAnalysisPrompt',
  input: {schema: SymptomAnalysisInputSchema},
  output: {schema: SymptomAnalysisOutputSchema},
  prompt: `আপনি একজন অভিজ্ঞ ডাক্তার এবং স্বাস্থ্য পরামর্শদাতা। আপনার কাজ হলো ব্যবহারকারীর দেওয়া রোগের উপসর্গগুলো বিশ্লেষণ করে বাংলায় চারটি ভিন্ন বিষয়ে পরামর্শ দেওয়া। কোনো অবস্থাতেই চূড়ান্ত রোগ নির্ণয় করবেন না, শুধুমাত্র পরামর্শ দিন।

ব্যবহারকারীর উপসর্গ: "{{{symptoms}}}"

আপনার উত্তর অবশ্যই চারটি অংশে বিভক্ত থাকবে:

১. বিশেষজ্ঞের পরামর্শ: উপসর্গ অনুযায়ী কোন ধরনের বিশেষজ্ঞ ডাক্তার দেখানো প্রয়োজন, সেই পরামর্শ দিন।
২. রোগের ধারণা: উপসর্গগুলো কোন সাধারণ রোগের ইঙ্গিত দিতে পারে, তার একটি ধারণা দিন। এটি চূড়ান্ত কোনো সিদ্ধান্ত নয়, শুধু একটি সম্ভাবনা।
৩. খাবার পরামর্শ: দ্রুত আরোগ্যের জন্য কী কী খাবার খাওয়া উচিত বা এড়িয়ে চলা উচিত, তার একটি তালিকা বা বর্ণনা দিন।
৪. করণীয়: রোগীর দ্রুত সুস্থতার জন্য কী কী কাজ করা উচিত বা কী ধরনের বিশ্রাম প্রয়োজন, তার পরামর্শ দিন।

প্রতিটি উত্তর সংক্ষিপ্ত, সহজবোধ্য এবং ইতিবাচক হতে হবে।
`,
});

const symptomAnalysisFlow = ai.defineFlow(
  {
    name: 'symptomAnalysisFlow',
    inputSchema: SymptomAnalysisInputSchema,
    outputSchema: SymptomAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
