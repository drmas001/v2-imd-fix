import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { LONG_STAY_THRESHOLD } from '../utils/stayCalculator';
import type { Patient } from '../types/patient';
import type { Admission } from '../types/admission';

interface LongStayStore {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  fetchLongStayPatients: () => Promise<void>;
  removeDischargedPatient: (patientId: number) => void;
}

interface AdmissionResponse {
  id: number;
  patient_id: number;
  admission_date: string;
  discharge_date: string | null;
  department: string;
  diagnosis: string;
  status: 'active' | 'discharged' | 'transferred';
  safety_type: 'emergency' | 'observation' | 'short-stay' | null;
  shift_type: 'morning' | 'evening' | 'night' | 'weekend_morning' | 'weekend_night';
  is_weekend: boolean;
  visit_number: number;
  admitting_doctor_id: number | null;
  patients: {
    id: number;
    mrn: string;
    name: string;
    gender: 'male' | 'female';
    date_of_birth: string;
  };
  admitting_doctor: {
    id: number;
    name: string;
    medical_code: string;
    role: 'doctor' | 'nurse' | 'administrator';
    department: string;
  } | null;
}

export const useLongStayStore = create<LongStayStore>((set) => ({
  patients: [],
  loading: false,
  error: null,
  lastUpdate: null,

  fetchLongStayPatients: async () => {
    set({ loading: true, error: null });
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - LONG_STAY_THRESHOLD);

      const { data, error } = await supabase
        .from('admissions')
        .select(`
          id,
          patient_id,
          admission_date,
          discharge_date,
          department,
          diagnosis,
          status,
          safety_type,
          shift_type,
          is_weekend,
          visit_number,
          admitting_doctor_id,
          patients!inner (
            id,
            mrn,
            name,
            gender,
            date_of_birth
          ),
          admitting_doctor:users!admissions_admitting_doctor_id_fkey (
            id,
            name,
            medical_code,
            role,
            department
          )
        `)
        .eq('status', 'active')
        .lte('admission_date', cutoffDate.toISOString())
        .order('admission_date', { ascending: false });

      if (error) throw error;

      const longStayPatients: Patient[] = (data as unknown as AdmissionResponse[]).map(admission => ({
        id: admission.id,
        full_name: admission.patients.name,
        created_at: new Date().toISOString(),
        mrn: admission.patients.mrn,
        name: admission.patients.name,
        gender: admission.patients.gender,
        date_of_birth: admission.patients.date_of_birth,
        department: admission.department,
        admission_date: admission.admission_date,
        doctor_name: admission.admitting_doctor?.name,
        admissions: [{
          id: admission.id,
          status: admission.status,
          admission_date: admission.admission_date,
          discharge_date: admission.discharge_date || undefined,
          visit_number: admission.visit_number,
          department: admission.department,
          diagnosis: admission.diagnosis,
          safety_type: admission.safety_type || undefined,
          shift_type: admission.shift_type,
          is_weekend: admission.is_weekend,
          admitting_doctor: admission.admitting_doctor || undefined
        }]
      }));

      set({ 
        patients: longStayPatients, 
        lastUpdate: new Date(),
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch long stay patients',
        loading: false 
      });
    }
  },

  removeDischargedPatient: (patientId: number) => {
    set(state => ({
      patients: state.patients.filter(patient => patient.id !== patientId)
    }));
  }
}));