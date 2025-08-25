
import { z } from 'zod';

export type Frequency = 'Daily' | 'Hourly' | 'Weekly' | 'Monthly';

export interface Medication {
  id: string;
  name: string;
  dosage: string; // e.g. "1 pill", "10ml"
  intake_qty: number; // e.g. 1, 2
  food_relation: 'before' | 'after' | 'with';
  food_time_minutes?: number;
  start_date: string;
  end_date: string;
  frequency: Frequency;
  times: string[];
  daysOfWeek?: number[];
  dayOfMonth?: number;
}

export interface Appointment {
  id:string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  notes?: string;
}

export const HealthMetricSchema = z.object({
    id: z.string().optional(),
    date: z.string(), // ISO String
    weight: z.number().optional(),
    bloodPressure: z.object({
        systolic: z.number(),
        diastolic: z.number(),
    }).optional(),
    bloodSugar: z.number().optional(),
    heartRate: z.number().optional(),
    userId: z.string().optional(),
});
export type HealthMetric = z.infer<typeof HealthMetricSchema>;

export const UserProfileSchema = z.object({
  name: z.string(),
  email: z.string(),
  photoURL: z.string().optional(),
  dateOfBirth: z.string().optional(),
  height: z.number().optional(),
  gender: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  postcode: z.string().optional(),
  city: z.string().optional(),
  isPremium: z.boolean().optional(),
  premiumCycle: z.string().optional(),
  status: z.enum(['active', 'suspended', 'deactivated']).optional(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

export interface AdherenceLog {
    id?: string;
    reminderId: string;
    reminderType: 'medicine' | 'doctor_visit' | 'health_checkup';
    reminderContent: string;
    takenAt: string; // ISO string
    status: 'taken' | 'skipped' | 'missed' | 'stock_out' | 'muted' | 'snoozed';
    userId: string;
    scheduledTime?: string;
    snoozeDuration?: number;
}

export interface FamilyMember {
  id: string; // Document ID
  uid: string; // User ID of the family member
  name: string;
  relation: string;
  email: string;
  status: 'pending' | 'accepted';
  photoURL?: string;
}

export interface Invitation {
  id: string;
  inviterId: string;
  inviterName: string;
  inviterPhotoUrl?: string | null;
  inviteeEmail: string;
  relation: string;
  status: 'pending' | 'accepted' | 'declined';
  inviteeId?: string;
  inviteeName?: string;
}

export interface User {
  uid: string;
  name: string;
  email: string;
  createdAt: string;
  photoURL?: string;
  isPremium?: boolean;
  premiumCycle?: 'monthly' | 'yearly';
  premiumEndDate?: string | null;
  status?: 'active' | 'suspended' | 'deactivated';
}

export interface Subscription {
    id: string;
    userId: string;
    user: {
        name?: string | null;
        email?: string | null;
        photoURL?: string | null;
    };
    plan: 'Premium Monthly' | 'Premium Yearly';
    status: 'active' | 'cancelled' | 'expired';
    startDate: string;
    endDate: string;
    paymentMethod: 'Stripe' | 'PayPal' | 'Payoneer' | 'Admin Grant';
    transactionId: string;
}

export const SpecialistRecommendationOutputSchema = z.object({
  specialist: z.string().describe("The type of medical specialist recommended (e.g., Cardiologist, Neurologist)."),
  reasoning: z.string().describe("A brief explanation for why this specialist is recommended based on the symptoms."),
  doctorName: z.string().optional().describe("The name of a top-rated doctor for the suggested specialty in the user's city."),
  doctorAddress: z.string().optional().describe("The address of the recommended doctor."),
});
export type SpecialistRecommendationOutput = z.infer<typeof SpecialistRecommendationOutputSchema>;

export interface FamilyAlert {
    id: string;
    familyMemberId: string;
    patientName: string;
    medicationName: string;
    alertMessage: string;
    createdAt: string;
}

export const SymptomAnalysisOutputSchema = z.object({
  specialistSuggestion: z.string().describe("Advice on which specialist doctor to see. (e.g., 'Consult a General Physician.')"),
  diseaseConcept: z.string().describe("Provide a concept of the potential illness based on the symptoms. (e.g., 'Your symptoms may indicate a common viral fever.')"),
  foodForDisease: z.string().describe("Provide food suggestions that may help with the symptoms of the potential illness. (e.g., 'For a fever, it's good to eat light, easily digestible foods like soups and boiled vegetables.')"),
  activitySuggestion: z.string().describe("Advice on what kind of activities or exercises can be done to stay healthy. (e.g., 'Get adequate rest and you can do light exercises.')"),
});
export type SymptomAnalysisOutput = z.infer<typeof SymptomAnalysisOutputSchema>;

export interface SymptomAnalysis {
    id: string;
    symptoms: string;
    createdAt: string;
    analysis: SymptomAnalysisOutput
}
