import React, { useState, useEffect } from 'react';
import { Download, FileText, RefreshCw, AlertCircle } from 'lucide-react';
import { usePatientStore } from '../stores/usePatientStore';
import { useConsultationStore } from '../stores/useConsultationStore';
import { useAppointmentStore } from '../stores/useAppointmentStore';
import { exportDailyReport } from '../utils/reportExport';
import ReportFilters from '../components/Reports/ReportFilters';
import TableView from '../components/Reports/TableView';
import ReportSummary from '../components/Reports/ReportSummary';
import type { ReportFilters as ReportFiltersType } from '../types/report';
import type { ExportData } from '../types/report';
import { format } from 'date-fns';

const formatDate = (date: string | Date, includeTime: boolean = false): string => {
  const dateObj = new Date(date);
  return format(dateObj, includeTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy');
};

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
        console.log('Fetching data for reports...');
        await Promise.all([
          fetchPatients(true),
          fetchConsultations(),
          fetchAppointments()
        ]);
        console.log('Data fetched successfully. Consultations:', consultations.length);
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

    // If it's a daily report, set the date range to today (midnight to midnight)
    if (filters.reportType === 'daily') {
      const now = new Date();
      dateFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0); // Start of today
      dateTo = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999); // End of today
    } else {
      // For other report types, ensure we capture the full days
      dateFrom.setHours(0, 0, 0, 0);
      dateTo.setHours(23, 59, 59, 999);
    }

    console.log('Filtering data:', {
      dateRange: {
        from: dateFrom.toISOString(),
        to: dateTo.toISOString()
      },
      filters: {
        specialty: filters.specialty,
        searchQuery: filters.searchQuery,
        reportType: filters.reportType
      },
      totalConsultations: consultations.length,
      totalAppointments: appointments.length,
      totalPatients: patients.length
    });

    // Filter recently admitted patients (last 24 hours)
    const recentlyAdmittedPatients = patients
      .filter(patient => {
        // Get the most recent active admission
        const activeAdmission = patient.admissions?.find(a => a.status === 'active');
        if (!activeAdmission) return false;

        const admissionDate = new Date(activeAdmission.admission_date);
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const matchesDate = admissionDate >= twentyFourHoursAgo;
        const matchesSpecialty = filters.specialty === 'all' || activeAdmission.department === filters.specialty;
        const matchesSearch = !filters.searchQuery || 
          patient.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
          patient.mrn.toLowerCase().includes(filters.searchQuery.toLowerCase());

        return matchesDate && matchesSpecialty && matchesSearch;
      })
      .map(patient => {
        const activeAdmission = patient.admissions?.find(a => a.status === 'active');
        return {
          id: patient.id,
          full_name: patient.name,
          name: patient.name,
          mrn: patient.mrn,
          department: activeAdmission?.department || '',
          admission_date: activeAdmission?.admission_date || '',
          doctor_name: activeAdmission?.admitting_doctor?.name || '',
          created_at: patient.created_at || new Date().toISOString(),
          date_of_birth: patient.date_of_birth,
          gender: patient.gender,
          admissions: patient.admissions || []
        };
      });

    const filteredConsultations = consultations
      .filter(consultation => {
        const consultationDate = new Date(consultation.created_at);
        const matchesDate = consultationDate >= dateFrom && consultationDate <= dateTo;
        const matchesSpecialty = filters.specialty === 'all' || consultation.consultation_specialty === filters.specialty;
        const matchesSearch = !filters.searchQuery || 
          consultation.patient_name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
          consultation.mrn.toLowerCase().includes(filters.searchQuery.toLowerCase());
        const isNotDischarged = consultation.status !== 'discharged';

        return matchesDate && matchesSpecialty && matchesSearch && isNotDischarged;
      })
      .map(consultation => ({
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
      }));

    // Filter upcoming appointments
    const filteredAppointments = appointments
      .filter(appointment => {
        const appointmentDate = new Date(appointment.createdAt);
        const matchesDate = appointmentDate >= dateFrom && appointmentDate <= dateTo;
        const matchesSpecialty = filters.specialty === 'all' || appointment.specialty === filters.specialty;
        const matchesSearch = !filters.searchQuery || 
          appointment.patientName.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
          appointment.medicalNumber.toLowerCase().includes(filters.searchQuery.toLowerCase());
        const isPending = appointment.status === 'pending';

        return matchesDate && matchesSpecialty && matchesSearch && isPending;
      })
      .map(appointment => ({
        id: appointment.id,
        patientName: appointment.patientName,
        medicalNumber: appointment.medicalNumber,
        specialty: appointment.specialty,
        appointmentType: appointment.appointmentType,
        createdAt: appointment.createdAt,
        status: appointment.status,
        notes: appointment.notes
      }));

    return {
      consultations: filteredConsultations,
      patients: filters.reportType === 'daily' ? recentlyAdmittedPatients : [], // Include recently admitted patients only for daily reports
      appointments: filteredAppointments,
      dateFilter: {
        startDate: dateFrom.toISOString(),
        endDate: dateTo.toISOString(),
        period: filters.reportType
      },
      generatedAt: new Date().toISOString(),
      generatedBy: 'system'
    } as ExportData;
  };

  const handleFilterChange = (newFilters: ReportFiltersType) => {
    // If switching to daily report, set date range to today
    if (newFilters.reportType === 'daily') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      newFilters.dateFrom = today.toISOString().split('T')[0];
      newFilters.dateTo = today.toISOString().split('T')[0];
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
      await exportDailyReport(filteredData);
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

        {/* Recently Admitted Patients Table */}
        {filters.reportType === 'daily' && filteredData.patients.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Admitted Patients (Last 24 Hours)</h2>
            <TableView
              data={filteredData.patients.map(patient => {
                const activeAdmission = patient.admissions?.find(a => a.status === 'active');
                return {
                  ...patient,
                  shift_type: activeAdmission?.shift_type || '-',
                  safety_type: activeAdmission?.safety_type || '-'
                };
              })}
              columns={[
                { header: 'Patient Name', accessor: 'name' },
                { header: 'MRN', accessor: 'mrn' },
                { header: 'Department', accessor: 'department' },
                { header: 'Doctor', accessor: 'doctor_name' },
                { header: 'Shift Type', accessor: 'shift_type',
                  format: (value: string) => value.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) },
                { header: 'Safety Type', accessor: 'safety_type',
                  format: (value: string) => value === '-' ? '-' : value.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()) }
              ]}
            />
          </div>
        )}

        {/* Medical Consultations Table */}
        {filteredData.consultations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Medical Consultations</h2>
            <TableView
              data={filteredData.consultations}
              columns={[
                { header: 'Patient Name', accessor: 'patient_name' },
                { header: 'MRN', accessor: 'mrn' },
                { header: 'Specialty', accessor: 'consultation_specialty' },
                { header: 'Doctor', accessor: 'doctor_name' },
                { header: 'Created', accessor: 'created_at',
                  format: (value: string) => formatDate(value, false) },
                { header: 'Urgency', accessor: 'urgency' }
              ]}
            />
          </div>
        )}

        {/* Appointments Table */}
        {filteredData.appointments.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">Upcoming Appointments</h2>
            <TableView
              data={filteredData.appointments}
              columns={[
                { header: 'Patient Name', accessor: 'patientName' },
                { header: 'Medical Number', accessor: 'medicalNumber' },
                { header: 'Specialty', accessor: 'specialty' },
                { header: 'Type', accessor: 'appointmentType' },
                { header: 'Created', accessor: 'createdAt',
                  format: (value: string) => formatDate(value, false) },
                { header: 'Status', accessor: 'status' }
              ]}
            />
          </div>
        )}

        <ReportSummary dateFilter={filters} />
      </div>
    </div>
  );
};

export default DailyReports;