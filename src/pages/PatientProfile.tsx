import React, { useEffect } from 'react';
import { usePatientStore } from '../stores/usePatientStore';
import { useNavigate } from '../hooks/useNavigate';
import PatientHeader from '../components/PatientProfile/PatientHeader';
import PatientInfo from '../components/PatientProfile/PatientInfo';
import AdmissionHistory from '../components/PatientProfile/AdmissionHistory';
import MedicalNotes from '../components/PatientProfile/MedicalNotes';

const PatientProfile: React.FC = () => {
  const { selectedPatient } = usePatientStore();
  const { goBack } = useNavigate();

  useEffect(() => {
    if (!selectedPatient) {
      goBack();
    }
  }, [selectedPatient, goBack]);

  if (!selectedPatient) {
    return null;
  }

  return (
    <div className="flex-1 p-6">
      <PatientHeader />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-1 space-y-6">
          <PatientInfo />
          <AdmissionHistory />
        </div>
        <div className="lg:col-span-2">
          <MedicalNotes />
        </div>
      </div>
    </div>
  );
};

export default PatientProfile;