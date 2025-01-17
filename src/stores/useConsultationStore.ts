import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import type { Consultation } from '../types/consultation';

interface ConsultationStore {
  consultations: Consultation[];
  loading: boolean;
  error: string | null;
  fetchConsultations: () => Promise<void>;
  addConsultation: (consultation: Omit<Consultation, 'id' | 'created_at' | 'updated_at'>) => Promise<Consultation | null>;
  updateConsultation: (id: number, updates: Partial<Consultation>) => Promise<void>;
  getConsultationById: (id: number) => Promise<Consultation | null>;
}

export const useConsultationStore = create<ConsultationStore>((set, get) => ({
  consultations: [],
  loading: false,
  error: null,

  fetchConsultations: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          *,
          doctor:users!consultations_doctor_id_fkey (
            id,
            name,
            medical_code,
            role,
            department
          ),
          completed_by_user:users!consultations_completed_by_fkey (
            id,
            name,
            medical_code,
            role,
            department
          )
        `)
        .eq('status', 'active') // Only fetch active consultations
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Update local state with the fetched data
      const consultationsWithDates = (data || []).map(consultation => ({
        ...consultation,
        created_at: new Date(consultation.created_at).toISOString(),
        updated_at: new Date(consultation.updated_at).toISOString(),
        completed_at: consultation.completed_at ? new Date(consultation.completed_at).toISOString() : undefined
      }));

      set({ consultations: consultationsWithDates as Consultation[], loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addConsultation: async (consultation) => {
    set({ loading: true, error: null });
    try {
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('mrn', consultation.mrn)
        .single();

      if (patientError) {
        const { data: newPatient, error: createError } = await supabase
          .from('patients')
          .insert([{
            mrn: consultation.mrn,
            name: consultation.patient_name,
            gender: consultation.gender,
            date_of_birth: new Date(new Date().getFullYear() - consultation.age, 0, 1).toISOString()
          }])
          .select()
          .single();

        if (createError) throw createError;
        consultation.patient_id = newPatient.id;
      } else {
        consultation.patient_id = patientData.id;
      }

      const { data, error } = await supabase
        .from('consultations')
        .insert([{
          ...consultation,
          status: 'active'
        }])
        .select(`
          *,
          doctor:users(
            id,
            name
          )
        `)
        .single();

      if (error) throw error;

      const newConsultation = {
        ...data,
        doctor_name: data.doctor?.name || '',
        created_at: new Date(data.created_at).toISOString(),
        updated_at: new Date(data.updated_at).toISOString()
      } as Consultation;

      set(state => ({
        consultations: [newConsultation, ...state.consultations],
        loading: false
      }));

      return newConsultation;
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      return null;
    }
  },

  updateConsultation: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('consultations')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          doctor:users!consultations_doctor_id_fkey (
            id,
            name,
            medical_code,
            role,
            department
          ),
          completed_by_user:users!consultations_completed_by_fkey (
            id,
            name,
            medical_code,
            role,
            department
          )
        `)
        .single();

      if (error) throw error;

      const updatedConsultation = {
        ...data,
        created_at: new Date(data.created_at).toISOString(),
        updated_at: new Date(data.updated_at).toISOString(),
        completed_at: data.completed_at ? new Date(data.completed_at).toISOString() : undefined
      } as Consultation;
      
      set(state => ({
        consultations: state.consultations.map(c => 
          c.id === id ? updatedConsultation : c
        ),
        loading: false
      }));

      // Refresh the consultations list to ensure consistency
      await get().fetchConsultations();
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  getConsultationById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select(`
          *,
          doctor:users!consultations_doctor_id_fkey (
            id,
            name,
            medical_code,
            role,
            department
          ),
          completed_by_user:users!consultations_completed_by_fkey (
            id,
            name,
            medical_code,
            role,
            department
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        ...data,
        created_at: new Date(data.created_at).toISOString(),
        updated_at: new Date(data.updated_at).toISOString(),
        completed_at: data.completed_at ? new Date(data.completed_at).toISOString() : undefined
      } as Consultation;
    } catch (error) {
      console.error('Error fetching consultation:', error);
      return null;
    }
  }
}));