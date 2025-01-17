import React from 'react';
import { Shield, Activity, Clock } from 'lucide-react';
import type { Patient } from '../../types/patient';
import type { DateFilter } from '../../types/report';
import type { Admission } from '../../types/admission';

interface SafetyAdmissionStatsProps {
  patients: Patient[];
  dateFilter: DateFilter;
}

const SafetyAdmissionStats: React.FC<SafetyAdmissionStatsProps> = ({ patients, dateFilter }) => {
  // Get all active admissions within date range
  const activeAdmissions = patients.filter((patient: Patient) => {
    const admissions = patient.admissions as Admission[] | undefined;
    const activeAdmission = admissions?.find(admission => 
      admission.status === 'active' &&
      new Date(admission.admission_date) >= new Date(dateFilter.startDate) &&
      new Date(admission.admission_date) <= new Date(dateFilter.endDate)
    );

    return !!activeAdmission;
  });

  // Calculate safety admission counts
  const safetyData = activeAdmissions.reduce((acc, patient) => {
    const admissions = patient.admissions as Admission[] | undefined;
    const activeAdmission = admissions?.find(admission => 
      admission.status === 'active' &&
      new Date(admission.admission_date) >= new Date(dateFilter.startDate) &&
      new Date(admission.admission_date) <= new Date(dateFilter.endDate)
    );

    if (activeAdmission?.safety_type) {
      acc[activeAdmission.safety_type] = (acc[activeAdmission.safety_type] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Calculate total safety admissions and rate
  const totalSafetyAdmissions = Object.values(safetyData).reduce((sum, count) => sum + count, 0);
  const totalActiveAdmissions = activeAdmissions.length;
  const safetyRate = totalActiveAdmissions > 0 
    ? Math.round((totalSafetyAdmissions / totalActiveAdmissions) * 100) 
    : 0;

  // Calculate average stay duration for discharged safety admissions
  const calculateAverageStay = () => {
    const dischargedSafetyAdmissions = patients.flatMap(patient => {
      const admissions = patient.admissions as Admission[] | undefined;
      if (!admissions) return [];

      return admissions.filter(admission => 
        admission.safety_type &&
        admission.status === 'discharged' &&
        admission.discharge_date &&
        new Date(admission.admission_date) >= new Date(dateFilter.startDate) &&
        new Date(admission.admission_date) <= new Date(dateFilter.endDate)
      );
    });

    if (dischargedSafetyAdmissions.length === 0) return 0;

    const totalDays = dischargedSafetyAdmissions.reduce((sum, admission) => {
      const admissionDate = new Date(admission.admission_date);
      const dischargeDate = new Date(admission.discharge_date!);
      return sum + Math.ceil((dischargeDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24));
    }, 0);

    return Math.round(totalDays / dischargedSafetyAdmissions.length);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Shield className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Safety Admission Statistics</h2>
            <p className="text-sm text-gray-500">
              {totalSafetyAdmissions} safety admissions ({safetyRate}% of total)
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Safety Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm font-medium text-red-600">Emergency</p>
            <p className="text-2xl font-bold text-red-900">{safetyData['emergency'] || 0}</p>
            <p className="text-sm text-red-600">Requires immediate attention</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm font-medium text-yellow-600">Observation</p>
            <p className="text-2xl font-bold text-yellow-900">{safetyData['observation'] || 0}</p>
            <p className="text-sm text-yellow-600">Needs close monitoring</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-600">Short Stay</p>
            <p className="text-2xl font-bold text-green-900">{safetyData['short-stay'] || 0}</p>
            <p className="text-sm text-green-600">Planned brief admission</p>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-indigo-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Activity className="h-4 w-4 text-indigo-600" />
              <p className="text-sm font-medium text-indigo-600">Safety Rate</p>
            </div>
            <p className="text-2xl font-bold text-indigo-900">{safetyRate}%</p>
            <p className="text-xs text-indigo-600">of total admissions</p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <Clock className="h-4 w-4 text-blue-600" />
              <p className="text-sm font-medium text-blue-600">Average Stay</p>
            </div>
            <p className="text-2xl font-bold text-blue-900">{calculateAverageStay()} days</p>
            <p className="text-xs text-blue-600">for safety admissions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyAdmissionStats;