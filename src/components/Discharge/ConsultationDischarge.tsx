import React, { useState } from 'react';
import { Clock, AlertCircle, CheckCircle, Stethoscope } from 'lucide-react';
import { useConsultationStore } from '../../stores/useConsultationStore';
import { useUserStore } from '../../stores/useUserStore';
import DischargeNoteEditor from './DischargeNoteEditor';
import type { Consultation } from '../../types/consultation';

interface ConsultationDischargeProps {
  consultation: Consultation;
}

const ConsultationDischarge: React.FC<ConsultationDischargeProps> = ({ consultation }) => {
  const { updateConsultation } = useConsultationStore();
  const { currentUser } = useUserStore();
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleComplete = async () => {
    if (!note.trim()) {
      setError('Please enter a completion note');
      return;
    }

    if (!currentUser) {
      setError('User not authenticated');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await updateConsultation(consultation.id, {
        status: 'completed',
        completion_note: note,
        completed_at: new Date().toISOString(),
        completed_by: currentUser.id
      });
      setIsCompleted(true);
    } catch (error) {
      console.error('Error completing consultation:', error);
      setError('Failed to complete consultation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCompleted) {
    return (
      <div className="p-4 border border-green-200 rounded-lg bg-green-50">
        <div className="flex items-center space-x-2 text-green-800">
          <CheckCircle className="h-5 w-5" />
          <span>Consultation completed successfully</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Stethoscope className="h-5 w-5 text-indigo-600" />
            <h3 className="font-medium text-gray-900">{consultation.consultation_specialty}</h3>
          </div>
          {consultation.doctor?.name && (
            <p className="text-sm text-gray-600 mt-1">
              Assigned to: {consultation.doctor.name}
            </p>
          )}
          <div className="flex items-center space-x-2 mt-1">
            <Clock className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {new Date(consultation.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          consultation.urgency === 'emergency'
            ? 'bg-red-100 text-red-800'
            : consultation.urgency === 'urgent'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {consultation.urgency}
        </span>
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700">Reason for Consultation</p>
          <p className="text-sm text-gray-600 mt-1">{consultation.reason}</p>
        </div>

        <DischargeNoteEditor
          value={note}
          onChange={setNote}
          error={error}
          isConsultation={true}
        />

        {error && (
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={handleComplete}
            disabled={isSubmitting}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-50 flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Completing...</span>
              </>
            ) : (
              <span>Complete Consultation</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConsultationDischarge;