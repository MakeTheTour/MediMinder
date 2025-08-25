
import { config } from 'dotenv';
config();

import '@/ai/flows/customize-voice-prompts.ts';
import '@/ai/flows/intelligent-snooze.ts';
import '@/ai/flows/send-premium-confirmation-email.ts';
import '@/ai/flows/track-adherence-flow.ts';
import '@/ai/flows/health-insights-flow.ts';
import '@/ai/flows/symptom-checker-flow.ts';
import '@/ai/flows/appointment-reminder-flow.ts';
import '@/ai/flows/generate-family-alert-flow.ts';
import '@/ai/flows/remove-family-member-flow.ts';
import '@/ai/flows/save-doctor-suggestion-flow.ts';
import '@/ai/flows/delete-doctor-suggestion-flow.ts';
import '@/ai/flows/cleanup-flow.ts';
import '@/ai/flows/symptom-analysis-flow.ts';
