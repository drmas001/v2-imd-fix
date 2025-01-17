import React from 'react';
import { format } from 'date-fns';
import type { Patient } from '../../../types/patient';
import type { Consultation } from '../../../types/consultation';
import type { Appointment } from '../../../types/appointment';

interface TimelineViewProps {
  patients: Patient[];
  consultations: Consultation[];
  appointments: Appointment[];
}

const TimelineView: React.FC<TimelineViewProps> = ({
  patients,
  consultations,
  appointments
}) => {
  // Combine all events into a single timeline
  const timelineEvents = [
    ...patients.map(patient => ({
      type: 'admission',
      date: patient.admission_date || '',
      title: `Patient Admission: ${patient.name}`,
      subtitle: `MRN: ${patient.mrn}`,
      department: patient.department || '',
      status: patient.admissions?.[0]?.status || '',
      details: patient.admissions?.[0]?.diagnosis || ''
    })),
    ...consultations.map(consultation => ({
      type: 'consultation',
      date: consultation.created_at,
      title: `Consultation: ${consultation.patient_name}`,
      subtitle: `MRN: ${consultation.mrn}`,
      department: consultation.consultation_specialty,
      status: consultation.status,
      details: consultation.reason
    })),
    ...appointments.map(appointment => ({
      type: 'appointment',
      date: appointment.createdAt,
      title: `Appointment: ${appointment.patientName}`,
      subtitle: `MRN: ${appointment.medicalNumber}`,
      department: appointment.specialty,
      status: appointment.status,
      details: appointment.notes || ''
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (timelineEvents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No historical records found for the selected period.
      </div>
    );
  }

  return (
    <div className="relative">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Timeline View</h3>
      
      <div className="absolute left-1/2 transform -translate-x-px h-full w-0.5 bg-gray-200" />
      
      <div className="space-y-8">
        {timelineEvents.map((event, index) => (
          <div key={`${event.type}-${event.date}-${index}`} className="relative">
            <div className="flex items-center">
              <div className="flex-1 md:w-1/2 md:pr-8 md:text-right">
                <div className="text-sm text-gray-500">
                  {format(new Date(event.date), 'dd MMM yyyy HH:mm')}
                </div>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-indigo-600" />
              <div className="flex-1 md:w-1/2 md:pl-8">
                <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      event.status === 'active' || event.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : event.status === 'completed' || event.status === 'discharged'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {event.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{event.subtitle}</p>
                  <p className="text-sm text-gray-600 mt-1">Department: {event.department}</p>
                  {event.details && (
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">{event.details}</p>
                  )}
                  <div className="mt-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      event.type === 'admission'
                        ? 'bg-blue-100 text-blue-800'
                        : event.type === 'consultation'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TimelineView;