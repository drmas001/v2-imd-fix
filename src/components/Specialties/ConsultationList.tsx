import React from 'react';
import { Clock, AlertCircle, User } from 'lucide-react';
import { formatDate } from '../../utils/dateFormat';
import { usePatientStore } from '../../stores/usePatientStore';
import type { Consultation } from '../../types/consultation';
import type { Patient } from '../../types/patient';

interface ConsultationListProps {
  consultations: Consultation[];
  onPatientClick: (patient: Patient) => void;
}

const ConsultationList: React.FC<ConsultationListProps> = ({ consultations, onPatientClick }) => {
  const { setSelectedPatient } = usePatientStore();

  const handleConsultationClick = (consultation: Consultation) => {
    const admissionDate = new Date(consultation.created_at);
    const dayOfWeek = admissionDate.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday or Saturday

    const doctor = consultation.doctor_id ? {
      id: consultation.doctor_id,
      name: consultation.doctor?.name || '',
      medical_code: '',
      role: 'doctor' as const,
      department: consultation.requesting_department
    } : null;

    const admission = {
      id: consultation.id,
      patient_id: consultation.patient_id,
      admission_date: consultation.created_at,
      discharge_date: undefined,
      department: consultation.consultation_specialty,
      diagnosis: consultation.reason,
      status: 'active' as const,
      visit_number: 1,
      shift_type: isWeekend ? 'weekend_morning' as const : 'morning' as const,
      is_weekend: isWeekend,
      admitting_doctor_id: consultation.doctor_id || null,
      safety_type: 'observation' as const,
      admitting_doctor: doctor
    };

    const patientData: Patient = {
      id: consultation.patient_id,
      mrn: consultation.mrn,
      name: consultation.patient_name,
      full_name: consultation.patient_name,
      created_at: consultation.created_at,
      gender: consultation.gender,
      date_of_birth: new Date(new Date().getFullYear() - consultation.age, 0, 1).toISOString(),
      department: consultation.consultation_specialty,
      doctor_name: consultation.doctor?.name || '',
      admission_date: consultation.created_at,
      admissions: [admission]
    };

    setSelectedPatient(patientData);
    onPatientClick(patientData);
  };

  if (consultations.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Consultations</h3>
        <p className="text-gray-500">There are no active consultations for this specialty</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {consultations.map(consultation => (
        <button
          key={consultation.id}
          onClick={() => handleConsultationClick(consultation)}
          className="w-full p-4 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-left"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-gray-900">{consultation.patient_name}</h3>
              <p className="text-sm text-gray-600">MRN: {consultation.mrn}</p>
              <div className="flex items-center space-x-4 mt-2">
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatDate(consultation.created_at)}
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <User className="h-4 w-4 mr-1" />
                  {consultation.doctor?.name || 'Pending Assignment'}
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                <span className="font-medium">Reason:</span> {consultation.reason}
              </p>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                consultation.urgency === 'emergency'
                  ? 'bg-red-100 text-red-800'
                  : consultation.urgency === 'urgent'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {consultation.urgency}
              </span>
              <span className="text-sm text-gray-500">
                {consultation.patient_location}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ConsultationList;