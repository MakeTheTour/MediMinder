
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

export interface HealthMetric {
    id: string;
    date: string; // ISO String
    weight?: number;
    bloodPressure?: {
        systolic: number;
        diastolic: number;
    };
    bloodSugar?: number;
    heartRate?: number;
    userId: string;
}

export interface UserProfile {
  name: string;
  email: string;
  photoURL?: string;
  dateOfBirth?: string;
  gender?: string;
  country?: string;
  city?: string;
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
    status: 'taken' | 'skipped' | 'missed';
    userId: string;
}
