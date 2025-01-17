import React, { useState, useEffect } from 'react';
import { Clock, Download, FileText, Filter, Printer, MessageSquare, AlertCircle } from 'lucide-react';
import { useLongStayStore } from '../../stores/useLongStayStore';
import { formatDate } from '../../utils/dateFormat';
import { calculateStayDuration, LONG_STAY_THRESHOLD } from '../../utils/stayCalculator';
import { exportLongStayReport } from '../../utils/longStayReportExport';
import LongStayBadge from '../LongStay/LongStayBadge';
import SafetyBadge from '../PatientProfile/SafetyBadge';
import LongStayNotes from './LongStayNotes';
import DoctorDisplay from '../DoctorDisplay';

interface ExportOptions {
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

const LongStayReports: React.FC = () => {
  const { patients, loading, error, lastUpdate, fetchLongStayPatients } = useLongStayStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(null);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      await fetchLongStayPatients();
    };

    fetchData();
    const refreshInterval = setInterval(fetchData, 300000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, [fetchLongStayPatients]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportError(null);

    const exportOptions: ExportOptions = {
      dateRange: {
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
      }
    };

    try {
      await exportLongStayReport(filteredPatients, exportOptions);
    } catch (error) {
      console.error('Export error:', error);
      setExportError('Failed to export report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  // Filter and sort patients
  const filteredPatients = patients
    .filter(patient => {
      const matchesDepartment = selectedDepartment === 'all' || patient.department === selectedDepartment;
      const matchesSearch = !searchQuery || 
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.mrn.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDepartment && matchesSearch;
    })
    .sort((a, b) => {
      const durationA = calculateStayDuration(a.admission_date || '');
      const durationB = calculateStayDuration(b.admission_date || '');
      return durationB - durationA;
    });

  // Get unique departments from active long-stay patients
  const departments = Array.from(new Set(patients.map(p => p.department))).sort();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-6 w-6 text-gray-400" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Long Stay Patients</h2>
                <p className="text-sm text-gray-600">
                  Active patients hospitalized over {LONG_STAY_THRESHOLD} days
                </p>
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={isExporting || filteredPatients.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Export Report</span>
                </>
              )}
            </button>
          </div>

          {exportError && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span>{exportError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department Filter
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              >
                <option value="all">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or MRN..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {lastUpdate && (
            <div className="mt-4 text-sm text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>

        <div className="p-6">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Long Stay Patients</h3>
              <p className="text-gray-500">
                No active patients with stays longer than {LONG_STAY_THRESHOLD} days
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPatients.map(patient => {
                const admission = patient.admissions?.[0];
                if (!admission) return null;

                const stayDuration = calculateStayDuration(admission.admission_date);

                return (
                  <div
                    key={patient.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-3">
                          <h3 className="text-lg font-medium text-gray-900">{patient.name}</h3>
                          <LongStayBadge 
                            admissionDate={admission.admission_date}
                            showDuration={true}
                          />
                          {admission.safety_type && (
                            <SafetyBadge type={admission.safety_type as 'emergency' | 'observation' | 'short-stay'} />
                          )}
                          <button
                            onClick={() => {
                              setSelectedPatientId(patient.id);
                              setShowNotes(true);
                            }}
                            className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700"
                          >
                            <MessageSquare className="h-4 w-4" />
                            <span className="text-sm">Notes</span>
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">MRN: {patient.mrn}</p>
                        
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-sm text-gray-600">Admission Date</p>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(admission.admission_date)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Department</p>
                            <p className="text-sm font-medium text-gray-900">
                              {admission.department}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Stay Duration</p>
                            <p className="text-sm font-medium text-gray-900">
                              {stayDuration} days
                            </p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <DoctorDisplay 
                            doctor={admission.admitting_doctor ? {
                              id: 0,
                              name: admission.admitting_doctor.name,
                              medical_code: '',
                              role: 'doctor' as const,
                              department: admission.department || ''
                            } : null}
                            showIcon={true}
                            label="Attending Doctor"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {selectedPatientId && (
        <LongStayNotes
          patientId={selectedPatientId}
          isOpen={showNotes}
          onClose={() => {
            setShowNotes(false);
            setSelectedPatientId(null);
          }}
        />
      )}
    </div>
  );
};

export default LongStayReports;