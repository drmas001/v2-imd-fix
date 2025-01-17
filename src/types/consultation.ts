export interface Consultation {
  id: number;
  created_at: string;
  status: string;
  patient_id: number;
  doctor_id: number;
  patient_name: string;
  mrn: string;
  consultation_specialty: string;
  urgency: string;
  doctor_name: string;
  age: number;
  gender: string;
  requesting_department: string;
  patient_location: string;
  shift_type: string;
  reason: string;
  updated_at: string;
  completion_note?: string;
  completed_at?: string;
  completed_by?: number;
}