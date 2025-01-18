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
      console.log('Fetching consultations...');
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
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching consultations:', error);
        throw error;
      }
      
      console.log('Fetched consultations:', data?.length || 0);
      
      const consultationsWithDates = (data || []).map(consultation => {
        const processed = {
          ...consultation,
          created_at: new Date(consultation.created_at).toISOString(),
          updated_at: new Date(consultation.updated_at).toISOString(),
          completed_at: consultation.completed_at ? new Date(consultation.completed_at).toISOString() : undefined
        };
        console.log('Processed consultation:', processed.id, processed.created_at);
        return processed;
      });

      set({ consultations: consultationsWithDates as Consultation[], loading: false });
    } catch (error) {
      console.error('Error in fetchConsultations:', error);
      set({ error: (error as Error).message, loading: false });
    }
  },

  addConsultation: async (consultation) => {
    set({ loading: true, error: null });
    try {
      // First check if patient exists
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('id')
        .eq('mrn', consultation.mrn)
        .single();

      console.log('Patient lookup response:', { patientData, patientError });

      let patientId;
      if (patientError || !patientData) {
        // Create new patient if not found
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

        if (createError) {
          console.error('Error creating patient:', createError);
          throw createError;
        }
        patientId = newPatient.id;
      } else {
        patientId = patientData.id;
      }

      // Create consultation with patient ID
      const { data: insertedData, error: insertError } = await supabase
        .from('consultations')
        .insert([{
          ...consultation,
          patient_id: patientId,
          doctor_id: null,
          status: 'active'
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting consultation:', insertError);
        throw insertError;
      }

      // Fetch complete consultation data
      const { data: completeData, error: fetchError } = await supabase
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
        .eq('id', insertedData.id)
        .single();

      if (fetchError) {
        console.error('Error fetching complete consultation:', fetchError);
        throw fetchError;
      }

      const newConsultation = {
        ...completeData,
        created_at: new Date(completeData.created_at).toISOString(),
        updated_at: new Date(completeData.updated_at).toISOString(),
        completed_at: completeData.completed_at ? new Date(completeData.completed_at).toISOString() : undefined
      } as Consultation;

      set(state => ({
        consultations: [newConsultation, ...state.consultations],
        loading: false
      }));

      // Refresh the consultations list
      await get().fetchConsultations();

      return newConsultation;
    } catch (error) {
      console.error('Error in addConsultation:', error);
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