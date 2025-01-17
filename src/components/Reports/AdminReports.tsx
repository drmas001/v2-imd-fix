import React, { useState } from 'react';
import { Calendar, Download, FileText, Filter, Printer, RefreshCw } from 'lucide-react';
import { usePatientStore } from '../../stores/usePatientStore';
import { useConsultationStore } from '../../stores/useConsultationStore';
import { exportAdminPDF } from '../../utils/pdf/adminReport';
import DoctorStats from './DoctorStats';
import SpecialtyStats from './SpecialtyStats';
import SafetyAdmissionStats from './SafetyStats/SafetyAdmissionStats';
import { DischargeStats } from './DischargeStats';
import OccupancyChart from './OccupancyChart';
import AdmissionTrends from './AdmissionTrends';
import ConsultationMetrics from './ConsultationMetrics';
import LongStayReport from '../LongStay/LongStayReport';
import { ExportData as ReportExportData } from '../../types/report';

interface DateFilter {
  startDate: string;
  endDate: string;
  period: 'today' | 'week' | 'month' | 'custom';
}

const AdminReports: React.FC = () => {
  const { patients } = usePatientStore();
  const { consultations } = useConsultationStore();
  const [isExporting, setIsExporting] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    period: 'today'
  });

  const handlePeriodChange = (period: DateFilter['period']) => {
    const today = new Date();
    let startDate = new Date(today);
    let endDate = new Date(today);

    switch (period) {
      case 'week':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        break;
    }

    setDateFilter({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      period
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportData: ReportExportData = {
        title: 'IMD-Care Administrative Report',
        patients,
        consultations,
        appointments: [],
        dateFilter: {
          startDate: dateFilter.startDate,
          endDate: dateFilter.endDate,
          period: dateFilter.period
        },
        generatedAt: new Date().toISOString(),
        generatedBy: 'Admin User'
      };
      await exportAdminPDF(exportData);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export administrative report. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Filter patients based on date range and get all admissions
  const filteredPatients = patients.filter(patient => {
    // Get all admissions for the patient
    const admissions = patient.admissions || [];
    
    return admissions.some(admission => {
      const admissionDate = new Date(admission.admission_date);
      return admissionDate >= new Date(dateFilter.startDate) && 
             admissionDate <= new Date(dateFilter.endDate);
    });
  });

  // Get discharged patients specifically for discharge stats
  const dischargedPatients = patients.filter(patient => {
    const admissions = patient.admissions || [];
    return admissions.some(admission => {
      if (admission.status !== 'discharged' || !admission.discharge_date) {
        return false;
      }
      const dischargeDate = new Date(admission.discharge_date);
      dischargeDate.setHours(0, 0, 0, 0);
      
      const filterStartDate = new Date(dateFilter.startDate);
      filterStartDate.setHours(0, 0, 0, 0);
      
      const filterEndDate = new Date(dateFilter.endDate);
      filterEndDate.setHours(23, 59, 59, 999);
      
      return dischargeDate >= filterStartDate && dischargeDate <= filterEndDate;
    });
  });

  // Calculate statistics
  const totalPatients = filteredPatients.length;
  
  const activePatients = filteredPatients.filter(patient => 
    (patient.admissions || []).some(admission =>
      admission.status === 'active' &&
      new Date(admission.admission_date) >= new Date(dateFilter.startDate) &&
      new Date(admission.admission_date) <= new Date(dateFilter.endDate)
    )
  ).length;

  const dischargedPatientsCount = dischargedPatients.length;

  const activeConsultations = consultations.filter(consultation =>
    consultation.status === 'active' &&
    new Date(consultation.created_at) >= new Date(dateFilter.startDate) &&
    new Date(consultation.created_at) <= new Date(dateFilter.endDate)
  ).length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6">
          {/* Header with export buttons */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-6 space-y-4 md:space-y-0">
            <div className="flex items-center space-x-3">
              <FileText className="h-6 w-6 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Administrative Report</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handlePrint}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Printer className="h-4 w-4" />
                <span>Print</span>
              </button>
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Export PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Date filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Period
              </label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={dateFilter.period}
                  onChange={(e) => handlePeriodChange(e.target.value as DateFilter['period'])}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                >
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
            </div>

            {dateFilter.period === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      value={dateFilter.startDate}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      value={dateFilter.endDate}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                    />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Summary statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-indigo-900 mb-2">Total Patients</h3>
              <p className="text-2xl font-bold text-indigo-600">{totalPatients}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-green-900 mb-2">Active Patients</h3>
              <p className="text-2xl font-bold text-green-600">{activePatients}</p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-900 mb-2">Discharged Patients</h3>
              <p className="text-2xl font-bold text-yellow-600">{dischargedPatientsCount}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Active Consultations</h3>
              <p className="text-2xl font-bold text-blue-600">{activeConsultations}</p>
            </div>
          </div>

          {/* Charts and detailed statistics */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OccupancyChart dateFilter={dateFilter} />
              <AdmissionTrends dateFilter={dateFilter} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SpecialtyStats consultations={consultations} />
              <DoctorStats consultations={consultations} dateFilter={dateFilter} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ConsultationMetrics consultations={consultations} dateFilter={dateFilter} />
              <SafetyAdmissionStats dateFilter={dateFilter} />
            </div>

            <DischargeStats dateFilter={dateFilter} />

            <LongStayReport dateFilter={dateFilter} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;