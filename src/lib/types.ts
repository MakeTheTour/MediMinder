
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
    id: z.string(),
    date: z.string(), // ISO String
    weight: z.number().optional(),
    bloodPressure: z.object({
        systolic: z.number(),
        diastolic: z.number(),
    }).optional(),
    bloodSugar: z.number().optional(),
    heartRate: z.number().optional(),
    userId: z.string(),
});
export type HealthMetric = z.infer<typeof HealthMetricSchema>;


export interface UserProfile {
  name: string;
  email: string;
  photoURL?: string;
  dateOfBirth?: string;
  height?: number;
  gender?: string;
  country?: string;
  state?: string;
  postcode?: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relation: string;
  email: string;
  status: 'pending' | 'accepted';
  photoURL?: string;
}

export interface AdherenceLog {
    id?: string;
    medicationId: string;
    medicationName: string;
    takenAt: string; // ISO string
    status: 'taken' | 'skipped' | 'missed' | 'stock_out' | 'muted';
    userId: string;
    scheduledTime?: string;
}
