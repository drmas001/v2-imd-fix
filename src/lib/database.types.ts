export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number;
          medical_code: string;
          name: string;
          role: 'doctor' | 'nurse' | 'administrator';
          department: string;
          status: 'active' | 'inactive';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          medical_code: string;
          name: string;
          role: 'doctor' | 'nurse' | 'administrator';
          department: string;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          medical_code?: string;
          name?: string;
          role?: 'doctor' | 'nurse' | 'administrator';
          department?: string;
          status?: 'active' | 'inactive';
          created_at?: string;
          updated_at?: string;
        };
      };
      patients: {
        Row: {
          id: string;
          mrn: string;
          name: string;
          date_of_birth: string;
          gender: 'male' | 'female';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mrn: string;
          name: string;
          date_of_birth: string;
          gender: 'male' | 'female';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          mrn?: string;
          name?: string;
          date_of_birth?: string;
          gender?: 'male' | 'female';
          created_at?: string;
          updated_at?: string;
        };
      };
      admissions: {
        Row: {
          id: string;
          patient_id: string;
          admitting_doctor_id: number | null;
          discharge_doctor_id: number | null;
          admission_date: string;
          discharge_date: string | null;
          department: string;
          diagnosis: string;
          status: 'active' | 'discharged' | 'transferred';
          safety_type: 'emergency' | 'observation' | 'short-stay' | null;
          shift_type: 'morning' | 'evening' | 'night' | 'weekend_morning' | 'weekend_night';
          is_weekend: boolean;
          visit_number: number;
          discharge_type: 'regular' | 'against-medical-advice' | 'transfer' | null;
          follow_up_required: boolean;
          follow_up_date: string | null;
          discharge_note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          patient_id: string;
          admitting_doctor_id?: number | null;
          discharge_doctor_id?: number | null;
          admission_date: string;
          discharge_date?: string | null;
          department: string;
          diagnosis: string;
          status: 'active' | 'discharged' | 'transferred';
          safety_type?: 'emergency' | 'observation' | 'short-stay' | null;
          shift_type: 'morning' | 'evening' | 'night' | 'weekend_morning' | 'weekend_night';
          is_weekend?: boolean;
          visit_number?: number;
          discharge_type?: 'regular' | 'against-medical-advice' | 'transfer' | null;
          follow_up_required?: boolean;
          follow_up_date?: string | null;
          discharge_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          patient_id?: string;
          admitting_doctor_id?: number | null;
          discharge_doctor_id?: number | null;
          admission_date?: string;
          discharge_date?: string | null;
          department?: string;
          diagnosis?: string;
          status?: 'active' | 'discharged' | 'transferred';
          safety_type?: 'emergency' | 'observation' | 'short-stay' | null;
          shift_type?: 'morning' | 'evening' | 'night' | 'weekend_morning' | 'weekend_night';
          is_weekend?: boolean;
          visit_number?: number;
          discharge_type?: 'regular' | 'against-medical-advice' | 'transfer' | null;
          follow_up_required?: boolean;
          follow_up_date?: string | null;
          discharge_note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      medical_notes: {
        Row: {
          id: number;
          patient_id: number;
          doctor_id: number;
          note_type: 'Progress Note' | 'Follow-up Note' | 'Consultation Note' | 'Discharge Note' | 'Discharge Summary';
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          patient_id: number;
          doctor_id: number;
          note_type: 'Progress Note' | 'Follow-up Note' | 'Consultation Note' | 'Discharge Note' | 'Discharge Summary';
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          patient_id?: number;
          doctor_id?: number;
          note_type?: 'Progress Note' | 'Follow-up Note' | 'Consultation Note' | 'Discharge Note' | 'Discharge Summary';
          content?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      departments: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
      };
      consultations: {
        Row: {
          id: string;
          status: string;
          consultation_specialty: string;
        };
      };
    };
    Views: {
      active_admissions: {
        Row: {
          id: number;
          patient_id: number;
          mrn: string;
          name: string;
          admission_date: string;
          department: string;
          safety_type: string | null;
          shift_type: string;
          is_weekend: boolean;
          diagnosis: string;
          status: string;
          visit_number: number;
          admitting_doctor_id: number | null;
          admitting_doctor_name: string | null;
          admitting_doctor_code: string | null;
          admitting_doctor_role: string | null;
          admitting_doctor_department: string | null;
        };
      };
      discharged_patients: {
        Row: {
          id: number;
          patient_id: number;
          mrn: string;
          name: string;
          admission_date: string;
          discharge_date: string;
          department: string;
          discharge_type: string | null;
          follow_up_required: boolean;
          follow_up_date: string | null;
          discharge_note: string | null;
          admitting_doctor_name: string | null;
          discharge_doctor_name: string | null;
        };
      };
    };
  };
}