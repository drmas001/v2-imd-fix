import React, { useState, useEffect } from 'react';
import { Download, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import { usePatientStore } from '../stores/usePatientStore';
import { useConsultationStore } from '../stores/useConsultationStore';
import { useAppointmentStore } from '../stores/useAppointmentStore';
import { exportDailyReport } from '../utils/reportExport';
import ReportFilters from '../components/Reports/ReportFilters';
import ReportTable from '../components/Reports/ReportTable';
import ReportSummary from '../components/Reports/ReportSummary';
import type { ReportFilters as ReportFiltersType } from '../types/report';
import type { ExportData,} from '../types/report';
import { PDFDocument } from '../utils/pdf/core/PDFDocument';
import { PDFTable } from '../utils/pdf/core/PDFTable';

const DailyReports: React.FC = () => {
  const { patients, fetchPatients } = usePatientStore();
  const { consultations, fetchConsultations } = useConsultationStore();
  const { appointments, fetchAppointments } = useAppointmentStore();
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const today = new Date();
  const yesterday = new Date(today.getTime() - (24 * 60 * 60 * 1000));
  const [filters, setFilters] = useState<ReportFiltersType>({
    dateFrom: yesterday.toISOString().split('T')[0],
    dateTo: today.toISOString().split('T')[0],
    reportType: 'daily',
    specialty: 'all',
    searchQuery: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setLoadingError(null);
      try {
        await Promise.all([
          fetchPatients(true),
          fetchConsultations(),
          fetchAppointments()
        ]);
        setLastRefresh(new Date());
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoadingError('Failed to load data. Please refresh the page and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const refreshInterval = setInterval(fetchData, 300000); // 5 minutes
    return () => clearInterval(refreshInterval);
  }, [fetchPatients, fetchConsultations, fetchAppointments]);

  const getFilteredData = () => {
    let dateFrom = new Date(filters.dateFrom);
    let dateTo = new Date(filters.dateTo);

    // If it's a daily report, set the date range to last 24 hours
    if (filters.reportType === 'daily') {
      dateTo = new Date(); // Current time
      dateFrom = new Date(dateTo.getTime() - (24 * 60 * 60 * 1000)); // 24 hours ago
    } else {
      // For other report types, use the end of day
      dateTo.setHours(23, 59, 59, 999);
    }

    const filteredConsultations = consultations.map(consultation => ({
      id: consultation.id,
      consultation_date: consultation.created_at,
      created_at: consultation.created_at,
      status: consultation.status,
      patient_id: consultation.patient_id,
      doctor_id: consultation.doctor_id || 0,
      patient_name: consultation.patient_name,
      mrn: consultation.mrn,
      consultation_specialty: consultation.consultation_specialty,
      urgency: consultation.urgency,
      doctor_name: consultation.doctor?.name || '',
      age: consultation.age,
      gender: consultation.gender,
      requesting_department: consultation.requesting_department,
      patient_location: consultation.patient_location,
      shift_type: consultation.shift_type,
      reason: consultation.reason,
      updated_at: consultation.updated_at
    })).filter(consultation => {
      const matchesDate = new Date(consultation.created_at) >= dateFrom &&
        new Date(consultation.created_at) <= dateTo;
      
      const matchesSpecialty = filters.specialty === 'all' || 
        consultation.consultation_specialty === filters.specialty;
      
      const matchesSearch = filters.searchQuery === '' ||
        consultation.patient_name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        consultation.mrn.toLowerCase().includes(filters.searchQuery.toLowerCase());

      return matchesDate && matchesSpecialty && matchesSearch;
    });

    const filteredPatients = patients.map(patient => ({
      id: patient.id,
      full_name: patient.name,
      name: patient.name,
      created_at: new Date().toISOString(),
      mrn: patient.mrn,
      admission_date: patient.admission_date,
      department: patient.department,
      doctor_name: patient.doctor_name || '',
      date_of_birth: patient.date_of_birth,
      gender: patient.gender,
      severity: 1,
      admissions: patient.admissions?.map(admission => ({
        status: admission.status,
        admission_date: admission.admission_date,
        discharge_date: admission.discharge_date,
        department: admission.department,
        diagnosis: admission.diagnosis,
        visit_number: admission.visit_number,
        safety_type: admission.safety_type,
        admitting_doctor: admission.admitting_doctor ? {
          name: admission.admitting_doctor.name
        } : undefined
      }))
    })).filter(patient => {
      const matchesDate = patient.admission_date && 
        new Date(patient.admission_date) >= dateFrom &&
        new Date(patient.admission_date) <= dateTo;
      
      const matchesSpecialty = filters.specialty === 'all' || 
        patient.department === filters.specialty;
      
      const matchesSearch = filters.searchQuery === '' ||
        patient.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        patient.mrn.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        patient.doctor_name.toLowerCase().includes(filters.searchQuery.toLowerCase());

      return matchesDate && matchesSpecialty && matchesSearch;
    });

    const filteredAppointments = appointments.filter(appointment => {
      const matchesDate = new Date(appointment.createdAt) >= dateFrom &&
        new Date(appointment.createdAt) <= dateTo;
      
      const matchesSpecialty = filters.specialty === 'all' || 
        appointment.specialty === filters.specialty;
      
      const matchesSearch = filters.searchQuery === '' ||
        appointment.patientName.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        appointment.medicalNumber.toLowerCase().includes(filters.searchQuery.toLowerCase());

      return matchesDate && matchesSpecialty && matchesSearch;
    }).map(appointment => {
      let appointmentType: 'routine' | 'urgent';
      if (appointment.appointmentType === 'routine' || appointment.appointmentType === 'urgent') {
        appointmentType = appointment.appointmentType;
      } else {
        appointmentType = 'routine';
      }

      return {
        id: appointment.id,
        patientName: appointment.patientName,
        medicalNumber: appointment.medicalNumber,
        specialty: appointment.specialty,
        appointmentType: appointmentType,
        createdAt: appointment.createdAt,
        status: appointment.status,
      };
    });

    return {
      patients: filteredPatients,
      consultations: filteredConsultations,
      appointments: filteredAppointments,
      dateFilter: {
        startDate: filters.dateFrom,
        endDate: filters.dateTo,
        period: filters.reportType === 'daily' ? 'today' :
                filters.reportType === 'weekly' ? 'week' :
                filters.reportType === 'monthly' ? 'month' : 'custom'
      },
      generatedAt: new Date().toISOString(),
      generatedBy: 'system'
    } as ExportData;
  };

  const handleFilterChange = (newFilters: ReportFiltersType) => {
    // If switching to daily report, set date range to last 24 hours
    if (newFilters.reportType === 'daily') {
      const now = new Date();
      const last24Hours = new Date(now.getTime() - (24 * 60 * 60 * 1000));
      newFilters.dateTo = now.toISOString().split('T')[0];
      newFilters.dateFrom = last24Hours.toISOString().split('T')[0];
    }
    
    setFilters(newFilters);
    setExportError(null);
  };

  const handleExport = async () => {
    if (isExporting) return;
    setExportError(null);
    setIsExporting(true);

    try {
      const filteredData = getFilteredData();
      const doc = new PDFDocument({
        title: 'Daily Report',
        showLogo: false,
      });
      await doc.initialize();

      const pdfTable = new PDFTable(doc.document);

      // Define starting Y position
      let startY = 60;

      // Add tables for patients, consultations, and appointments as needed
      // Ensure that the data conforms to the expected structure

      // Example for Patients
      pdfTable.addTable({
        head: [
          {
            cells: [
              { content: 'MRN', styles: { fontStyle: 'bold' } },
              { content: 'Patient Name', styles: { fontStyle: 'bold' } },
              { content: 'Department', styles: { fontStyle: 'bold' } },
              { content: 'Assigned Doctor', styles: { fontStyle: 'bold' } },
            ],
          },
        ],
        body: filteredData.patients.filter(patient => 
          filters.specialty === 'all' || patient.department === filters.specialty
        ).map((patient) => ({
          cells: [
            { content: patient.mrn || '' },
            { content: patient.name || '' },
            { content: patient.department || '' },
            { content: patient.doctor_name || '' },
          ],
        })),
        startY,
        theme: 'grid',
        tableTitle: 'Patients Report',
      });

      // Save the PDF
      doc.save('DailyReport.pdf');
    } catch (error) {
      console.error('Export error:', error);
      setExportError(
        error instanceof Error ? error.message : 'Failed to export report. Please try again.'
      );
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>{loadingError}</span>
          </div>
        </div>
      </div>
    );
  }

  const filteredData = getFilteredData();

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-gray-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Daily Reports</h1>
              <p className="text-gray-600">View and export daily reports</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
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

        {exportError && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{exportError}</span>
          </div>
        )}

        <div className="mt-4 text-sm text-gray-500">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <ReportFilters onFilterChange={handleFilterChange} />
        </div>

        <ReportSummary dateFilter={filters} />
        
     
      </div>
    </div>
  );
};

export default DailyReports;