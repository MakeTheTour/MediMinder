
import { config } from 'dotenv';
config();

import '@/ai/flows/customize-voice-prompts.ts';
import '@/ai/flows/intelligent-snooze.ts';
import '@/ai/flows/family-alert-flow.ts';
import '@/ai/flows/send-premium-confirmation-email.ts';
import '@/ai/flows/track-adherence-flow.ts';
import '@/ai/flows/health-insights-flow.ts';
import '@/ai/flows/symptom-checker-flow.ts';
