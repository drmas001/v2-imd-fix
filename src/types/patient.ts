export interface Patient {
  id: number;
  full_name: string;
  created_at: string;
  mrn: string;
  name: string;
  admission_date: string;
  department: string;
  doctor_name?: string;
  date_of_birth: string;
  gender: string;
  admissions?: {
    id: number;
    status: string;
    admission_date: string;
    discharge_date?: string;
    visit_number: number;
    department: string;
    diagnosis: string;
    safety_type: 'emergency' | 'observation' | 'short-stay' | undefined;
    shift_type: 'morning' | 'evening' | 'night' | 'weekend_morning' | 'weekend_night';
    is_weekend: boolean;
    admitting_doctor?: {
      id: number;
      name: string;
      medical_code: string;
      role: 'doctor' | 'nurse' | 'administrator';
      department: string;
    } | null;
  }[];
  // Add other patient properties as per your database schema
}