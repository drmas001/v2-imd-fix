import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { useState } from 'react';
import type { Appointment } from '../types/appointment';

type AppointmentType = 'routine' | 'urgent';
type AppointmentStatus = 'pending' | 'completed' | 'cancelled';

interface AppointmentStore {
  appointments: Appointment[];
  loading: boolean;
  error: string | null;
  fetchAppointments: () => Promise<void>;
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => Promise<void>;
  updateAppointment: (id: number, updates: Partial<Appointment>) => Promise<void>;
  removeExpiredAppointments: () => Promise<void>;
}

export const useAppointmentStore = create<AppointmentStore>((set, get) => ({
  appointments: [],
  loading: false,
  error: null,

  fetchAppointments: async () => {
    set({ loading: true, error: null });
    try {
      // Calculate cutoff time (20 hours ago)
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - 20);

      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('status', 'pending') // Only fetch pending appointments
        .gte('created_at', cutoffTime.toISOString()) // Only fetch appointments less than 20 hours old
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedAppointments = data?.map(appointment => ({
        id: appointment.id,
        patientName: appointment.patient_name,
        medicalNumber: appointment.medical_number,
        specialty: appointment.specialty,
        appointmentType: appointment.appointment_type as AppointmentType,
        notes: appointment.notes || '',
        createdAt: appointment.created_at,
        status: appointment.status as AppointmentStatus
      })) || [];

      set({ appointments: formattedAppointments, loading: false });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addAppointment: async (appointment) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          patient_name: appointment.patientName,
          medical_number: appointment.medicalNumber,
          specialty: appointment.specialty,
          appointment_type: appointment.appointmentType,
          notes: appointment.notes,
          status: appointment.status
        }])
        .select()
        .single();

      if (error) throw error;

      const formattedAppointment = {
        id: data.id,
        patientName: data.patient_name,
        medicalNumber: data.medical_number,
        specialty: data.specialty,
        appointmentType: data.appointment_type as AppointmentType,
        notes: data.notes || '',
        createdAt: data.created_at,
        status: data.status as AppointmentStatus
      };

      set(state => ({
        appointments: [formattedAppointment, ...state.appointments],
        loading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
      throw error;
    }
  },

  updateAppointment: async (id, updates) => {
    set(state => ({
      appointments: state.appointments.map(appointment =>
        appointment.id === id
          ? { ...appointment, ...updates }
          : appointment
      )
    }));

    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          status: updates.status,
          notes: updates.notes
        })
        .eq('id', id);

      if (error) {
        // Revert the optimistic update if the server update fails
        set(state => ({
          appointments: state.appointments.map(appointment =>
            appointment.id === id
              ? { ...appointment, ...updates }
              : appointment
          ),
          error: error.message
        }));
        throw error;
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  },

  removeExpiredAppointments: async () => {
    try {
      const cutoffTime = new Date();
      cutoffTime.setHours(cutoffTime.getHours() - 20);

      const { error } = await supabase
        .from('appointments')
        .delete()
        .lt('created_at', cutoffTime.toISOString());

      if (error) throw error;
      await get().fetchAppointments();
    } catch (error) {
      console.error('Error removing expired appointments:', error);
    }
  }
}));