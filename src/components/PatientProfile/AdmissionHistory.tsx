import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { usePatientStore } from '../../stores/usePatientStore';
import { formatDate } from '../../utils/dateFormat';
import { isLongStay } from '../../utils/stayCalculator';
import SafetyBadge from './SafetyBadge';
import LongStayBadge from '../LongStay/LongStayBadge';
import DoctorDisplay from '../DoctorDisplay';
import type { Patient } from '../../types/patient';

const AdmissionHistory: React.FC = () => {
  const { selectedPatient } = usePatientStore();

  if (!selectedPatient) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-2" />
          <p>Select a patient to view admission history</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Admission History</h2>
      
      <div className="space-y-4">
        {selectedPatient.admissions?.length === 0 ? (
          <p className="text-center text-gray-500">No admission history available</p>
        ) : (
          selectedPatient.admissions?.map((admission, index) => (
            <div
              key={index}
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50"
            >
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900">
                    Visit #{admission.visit_number}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      admission.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : admission.status === 'discharged'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {admission.status}
                    </span>
                    {admission.safety_type && (
                      <SafetyBadge type={admission.safety_type as 'emergency' | 'observation' | 'short-stay'} />
                    )}
                    {isLongStay(admission.admission_date) && (
                      <LongStayBadge 
                        admissionDate={admission.admission_date}
                        showDuration={true}
                      />
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Admitted: {formatDate(admission.admission_date)}
                </p>
                <p className="text-sm text-gray-600">{admission.department}</p>
                {admission.admitting_doctor && (
                  <div className="mt-2">
                    <DoctorDisplay 
                      doctor={admission.admitting_doctor}
                      label="Admitting Doctor"
                    />
                  </div>
                )}
                {admission.discharge_date && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <p className="text-sm text-gray-600">
                      Discharged: {formatDate(admission.discharge_date)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdmissionHistory;