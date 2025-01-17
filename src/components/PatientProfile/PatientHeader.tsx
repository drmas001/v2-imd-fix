import React, { useState } from 'react';
import { ArrowLeft, Printer, Share2, Copy, Check } from 'lucide-react';
import { useNavigate } from '../../hooks/useNavigate';
import { usePatientStore } from '../../stores/usePatientStore';
import { useDischargeStore } from '../../stores/useDischargeStore';
import { printPatientProfile } from '../../utils/printService';
import DoctorDisplay from '../DoctorDisplay';
import type { ActivePatient } from '../../types/activePatient';

const PatientHeader: React.FC = () => {
  const { selectedPatient } = usePatientStore();
  const { setSelectedPatient: setDischargePatient } = useDischargeStore();
  const { goBack } = useNavigate();
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    if (!selectedPatient || isPrinting) return;
    
    setIsPrinting(true);
    try {
      const printablePatient = {
        ...selectedPatient,
        doctor_name: selectedPatient.doctor_name ?? undefined,
        admissions: selectedPatient.admissions?.map(admission => ({
          ...admission,
          users: admission.admitting_doctor ? admission.admitting_doctor : undefined
        }))
      };
      
      printPatientProfile(printablePatient);
    } catch (error) {
      console.error('Print error:', error);
    } finally {
      setIsPrinting(false);
    }
  };

  const formatPatientInfo = () => {
    if (!selectedPatient) return '';
    
    const activeAdmission = selectedPatient.admissions?.[0];
    
    return [
      `Patient Information`,
      `----------------`,
      `Name: ${selectedPatient.name}`,
      `MRN: ${selectedPatient.mrn}`,
      `Department: ${activeAdmission?.department || 'Not assigned'}`,
      `Admission Date: ${activeAdmission?.admission_date ? new Date(activeAdmission.admission_date).toLocaleDateString() : 'Not available'}`,
      `Doctor: ${activeAdmission?.admitting_doctor?.name || 'Not assigned'}`
    ].join('\n');
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formatPatientInfo());
      setCopied(true);
      setShareError(null);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      setShareError('Unable to copy to clipboard. Please try again.');
      setTimeout(() => setShareError(null), 3000);
    }
  };

  const handleShare = async () => {
    if (!selectedPatient) return;
    setShareError(null);

    const shareData = {
      title: `Patient: ${selectedPatient.name}`,
      text: formatPatientInfo()
    };

    try {
      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await copyToClipboard();
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return;
        }
        await copyToClipboard();
      }
    }
  };

  const handleDischarge = () => {
    if (!selectedPatient || !selectedPatient.admissions?.[0]) return;

    const admission = selectedPatient.admissions[0];
    const dischargePatient: ActivePatient = {
      id: admission.id,
      patient_id: selectedPatient.id,
      mrn: selectedPatient.mrn,
      name: selectedPatient.name,
      admission_date: admission.admission_date,
      department: admission.department,
      doctor_name: admission.admitting_doctor?.name ?? null,
      diagnosis: admission.diagnosis,
      status: 'active',
      admitting_doctor_id: admission.admitting_doctor?.id ?? null,
      shift_type: admission.shift_type,
      is_weekend: admission.is_weekend,
      safety_type: admission.safety_type,
      admitting_doctor: admission.admitting_doctor ?? null
    };

    setDischargePatient(dischargePatient);
    const event = new CustomEvent('navigate', { detail: 'discharge' });
    window.dispatchEvent(event);
  };

  if (!selectedPatient) {
    return null;
  }

  const activeAdmission = selectedPatient.admissions?.[0];
  const isActive = activeAdmission?.status === 'active';

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={goBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{selectedPatient.name}</h1>
            <p className="text-gray-600">MRN: {selectedPatient.mrn}</p>
            {activeAdmission?.admitting_doctor && (
              <div className="mt-2">
                <DoctorDisplay doctor={activeAdmission.admitting_doctor} />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleShare}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors group"
            aria-label="Share patient information"
          >
            {copied ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <Share2 className="h-5 w-5 text-gray-600" />
            )}
          </button>
          
          <button
            onClick={handlePrint}
            disabled={isPrinting}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors group"
            aria-label="Print patient information"
          >
            <Printer className={`h-5 w-5 ${isPrinting ? 'text-indigo-600 animate-pulse' : 'text-gray-600'}`} />
          </button>
          
          {isActive && (
            <button
              onClick={handleDischarge}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 transition-colors"
            >
              Discharge
            </button>
          )}
        </div>
      </div>

      {shareError && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">
          {shareError}
        </div>
      )}
    </div>
  );
};

export default PatientHeader;