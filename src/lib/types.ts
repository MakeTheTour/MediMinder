export type Frequency = 'Daily' | 'Hourly' | 'Weekly' | 'Monthly';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: Frequency;
  times: string[];
  daysOfWeek?: number[];
  dayOfMonth?: number;
}

export interface Appointment {
  id: string;
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
}

export interface UserProfile {
  name: string;
  email: string;
}
