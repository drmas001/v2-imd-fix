import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Patient } from '../types/patient';
import type { Admission } from '../types/admission';

interface AdmissionResponse {
  id: number;
  patient_id: number;
  admission_date: string;
  discharge_date: string | null;
  department: string;
  diagnosis: string;
  status: 'active' | 'discharged' | 'transferred';
  visit_number: number;
  safety_type: 'emergency' | 'observation' | 'short-stay' | null;
  shift_type: 'morning' | 'evening' | 'night' | 'weekend_morning' | 'weekend_night';
  is_weekend: boolean;
  admitting_doctor_id: number | null;
  discharge_doctor_id: number | null;
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
  discharge_doctor: {
    id: number;
    name: string;
    medical_code: string;
    role: 'doctor' | 'nurse' | 'administrator';
    department: string;
  } | null;
}

interface PatientStore {
  patients: Patient[];
  selectedPatient: Patient | null;
  loading: boolean;
  error: string | null;
  fetchPatients: (includeAllDischarged?: boolean) => Promise<void>;
  addPatient: (patientData: {
    mrn: string;
    name: string;
    date_of_birth: string;
    gender: 'male' | 'female';
    admission: {
      admission_date: string;
      department: string;
      admitting_doctor_id: number;
      diagnosis: string;
      safety_type?: 'emergency' | 'observation' | 'short-stay';
      shift_type: 'morning' | 'evening' | 'night' | 'weekend_morning' | 'weekend_night';
      is_weekend: boolean;
    };
  }) => Promise<void>;
  updatePatient: (id: number, updates: Partial<Patient>) => Promise<void>;
  deletePatient: (id: number) => Promise<void>;
  setSelectedPatient: (patient: Patient | null) => void;
}

export const usePatientStore = create<PatientStore>((set, get) => ({
  patients: [],
  selectedPatient: null,
  loading: false,
  error: null,

  fetchPatients: async (includeAllDischarged = false) => {
    set({ loading: true, error: null });
    try {
      let query = supabase
        .from('admissions')
        .select(`
          id,
          patient_id,
          admission_date,
          discharge_date,
          department,
          diagnosis,
          status,
          visit_number,
          safety_type,
          shift_type,
          is_weekend,
          admitting_doctor_id,
          discharge_doctor_id,
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
          ),
          discharge_doctor:users!admissions_discharge_doctor_id_fkey (
            id,
            name,
            medical_code,
            role,
            department
          )
        `);

      if (!includeAllDischarged) {
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - 18);
        query = query.or(`status.eq.active,and(status.eq.discharged,discharge_date.gte.${cutoffTime.toISOString()})`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const patientsMap = new Map<number, Patient>();

      (data as unknown as AdmissionResponse[]).forEach((admission) => {
        const patientId = admission.patients.id;
        const existingPatient = patientsMap.get(patientId);

        const admissionData: Admission = {
          id: admission.id,
          patient_id: admission.patient_id,
          admission_date: admission.admission_date,
          discharge_date: admission.discharge_date,
          department: admission.department,
          diagnosis: admission.diagnosis,
          status: admission.status,
          visit_number: admission.visit_number,
          safety_type: admission.safety_type || undefined,
          shift_type: admission.shift_type,
          is_weekend: admission.is_weekend,
          admitting_doctor_id: admission.admitting_doctor_id,
          discharge_doctor_id: admission.discharge_doctor_id,
          admitting_doctor: admission.admitting_doctor,
          discharge_doctor: admission.discharge_doctor
        };

        if (existingPatient) {
          existingPatient.admissions = existingPatient.admissions || [];
          existingPatient.admissions.push({
            ...admissionData,
            discharge_date: admissionData.discharge_date || undefined,
            safety_type: admissionData.safety_type || undefined
          });

          const activeAdmission = existingPatient.admissions.find(a => a.status === 'active');
          if (activeAdmission) {
            existingPatient.admission_date = activeAdmission.admission_date;
            existingPatient.department = activeAdmission.department;
            existingPatient.doctor_name = activeAdmission.admitting_doctor?.name;
          }
        } else {
          const patient: Patient = {
            id: patientId,
            full_name: admission.patients.name,
            created_at: new Date().toISOString(),
            mrn: admission.patients.mrn,
            name: admission.patients.name,
            admission_date: admission.admission_date,
            department: admission.department,
            doctor_name: admission.admitting_doctor?.name,
            date_of_birth: admission.patients.date_of_birth,
            gender: admission.patients.gender,
            admissions: [{
              ...admissionData,
              discharge_date: admissionData.discharge_date || undefined,
              safety_type: admissionData.safety_type || undefined
            }]
          };
          patientsMap.set(patientId, patient);
        }
      });

      set({ patients: Array.from(patientsMap.values()) });

      const selectedPatient = get().selectedPatient;
      if (selectedPatient) {
        const updatedPatient = patientsMap.get(selectedPatient.id);
        if (updatedPatient) {
          set({ selectedPatient: updatedPatient });
        }
      }

      set({ loading: false });
    } catch (error) {
      console.error('Error fetching patients:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch patients', 
        loading: false 
      });
    }
  },

  addPatient: async (patientData) => {
    set({ loading: true, error: null });
    try {
      // First, create the patient record
      const { data: patientResult, error: patientError } = await supabase
        .from('patients')
        .insert({
          mrn: patientData.mrn,
          name: patientData.name,
          date_of_birth: patientData.date_of_birth,
          gender: patientData.gender
        })
        .select()
        .single();

      if (patientError) throw patientError;

      // Then, create the admission with doctor assignment
      const { data: admissionResult, error: admissionError } = await supabase
        .from('admissions')
        .insert({
          patient_id: patientResult.id,
          admitting_doctor_id: patientData.admission.admitting_doctor_id,
          admission_date: patientData.admission.admission_date,
          department: patientData.admission.department,
          diagnosis: patientData.admission.diagnosis,
          status: 'active',
          safety_type: patientData.admission.safety_type,
          shift_type: patientData.admission.shift_type,
          is_weekend: patientData.admission.is_weekend,
          visit_number: 1
        })
        .select(`
          *,
          admitting_doctor:users!admissions_admitting_doctor_id_fkey (
            id,
            name,
            medical_code,
            role,
            department
          )
        `)
        .single();

      if (admissionError) throw admissionError;

      // Update the local state with the complete data
      const newPatient: Patient = {
        ...patientResult,
        admissions: [{
          ...admissionResult,
          admitting_doctor: admissionResult.admitting_doctor
        }],
        department: admissionResult.department,
        doctor_name: admissionResult.admitting_doctor?.name,
        doctor: admissionResult.admitting_doctor
      };

      set(state => ({
        patients: [newPatient, ...state.patients],
        loading: false
      }));

      // Refresh the patient list to ensure consistency
      await get().fetchPatients();
    } catch (error) {
      console.error('Error adding patient:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add patient', 
        loading: false 
      });
      throw error;
    }
  },

  updatePatient: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        patients: state.patients.map(p => p.id === id ? { ...p, ...updates } : p),
        selectedPatient: state.selectedPatient?.id === id ? { ...state.selectedPatient, ...updates } : state.selectedPatient,
        loading: false
      }));
    } catch (error) {
      console.error('Error updating patient:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update patient', 
        loading: false 
      });
      throw error;
    }
  },

  deletePatient: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        patients: state.patients.filter(p => p.id !== id),
        selectedPatient: state.selectedPatient?.id === id ? null : state.selectedPatient,
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting patient:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete patient', 
        loading: false 
      });
      throw error;
    }
  },

  setSelectedPatient: (patient) => {
    set({ selectedPatient: patient });
  }
}));