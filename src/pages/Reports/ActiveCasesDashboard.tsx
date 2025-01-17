import React, { useState, useEffect, useCallback } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState
} from '@tanstack/react-table';
import { RefreshCw, AlertCircle, Users, Stethoscope, Calendar, Download } from 'lucide-react';
import { usePatientStore } from '../../stores/usePatientStore';
import { useConsultationStore } from '../../stores/useConsultationStore';
import { useAppointmentStore } from '../../stores/useAppointmentStore';
import { useUserStore } from '../../stores/useUserStore';
import { TableContainer } from '../../components/Reports/Tables/TableContainer';
import { patientColumns, consultationColumns, appointmentColumns } from '../../components/Reports/Tables/columns';
import StatCard from '../../components/Dashboard/StatCard';
import type { Patient } from '../../types/patient';
import type { Consultation } from '../../types/consultation';
import type { Appointment } from '../../types/appointment';
import { PDFDocument } from '../../utils/pdf/core/PDFDocument';
import { PDFTable } from '../../utils/pdf/core/PDFTable';

const ActiveCasesDashboard: React.FC = () => {
  const { currentUser } = useUserStore();
  const { patients, fetchPatients } = usePatientStore();
  const { consultations, fetchConsultations } = useConsultationStore();
  const { appointments, fetchAppointments } = useAppointmentStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchPatients(),
        fetchConsultations(),
        fetchAppointments(),
      ]);
      setLastUpdate(new Date());
    } catch (error) {
      setError('Failed to fetch data. Please try again.');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);

      // Console logs
      console.log('Fetched patients:', patients);
      console.log('Fetched consultations:', consultations);
      console.log('Fetched appointments:', appointments);
      console.log('Current user:', currentUser);
    }
  }, [fetchPatients, fetchConsultations, fetchAppointments]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchData();
  }, []);

  const filterByDepartment = <T extends {
    department?: string;
    consultation_specialty?: string;
    specialty?: string;
  }>(data: T[]): T[] => {
    if (!currentUser) return data;
    if (currentUser.role === 'administrator') return data;

    return data.filter(
      (item) =>
        item.department === currentUser.department ||
        item.consultation_specialty === currentUser.department ||
        item.specialty === currentUser.department
    );
  };

  const activePatients = patients.filter((patient: Patient) => {
    const latestAdmission = patient.admissions?.[0];
    return latestAdmission && latestAdmission.status === 'active';
  });

  const activeConsultations = consultations.filter(
    (consultation: Consultation) => consultation.status === 'active'
  );

  const pendingAppointments = appointments.filter(
    (appointment) => appointment.status === 'pending'
  );

  const patientTable = useReactTable({
    data: activePatients,
    columns: patientColumns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  });

  const consultationTable = useReactTable({
    data: activeConsultations,
    columns: consultationColumns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  });

  const appointmentTable = useReactTable({
    data: pendingAppointments,
    columns: appointmentColumns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel()
  });

  const generatePDF = async () => {
    try {
      const doc = new PDFDocument({
        title: 'Active Cases Dashboard',
        showLogo: false,
      });
      await doc.initialize();

      const pdfTable = new PDFTable(doc.document);

      let startY = doc.document.lastAutoTable?.finalY || 60;

      // Add a section for Active Patients
      pdfTable.addTable({
        head: [
          {
            cells: [
              { content: 'MRN', styles: { fontStyle: 'bold' } },
              { content: 'Patient Name', styles: { fontStyle: 'bold' } },
              { content: 'Admission Date', styles: { fontStyle: 'bold' } },
              { content: 'Assigned Doctor', styles: { fontStyle: 'bold' } },
              { content: 'Department', styles: { fontStyle: 'bold' } },
            ],
          },
        ],
        body: activePatients.map((patient) => ({
          cells: [
            { content: patient.mrn || '' },
            { content: patient.name || '' },
            { content: patient.admissions?.[0]?.admission_date
                ? new Date(patient.admissions[0].admission_date).toLocaleDateString()
                : '' },
            { content: patient.admissions?.[0]?.admitting_doctor?.name || '' },
            { content: patient.admissions?.[0]?.department || '' },
          ],
        })),
        startY,
        theme: 'grid',
        tableTitle: 'Active Patients',
      });

      // Update startY for next table
      startY = (doc.document.lastAutoTable?.finalY || startY) + 20;

      // Add a section for Active Consultations
      pdfTable.addTable({
        head: [
          {
            cells: [
              { content: 'MRN', styles: { fontStyle: 'bold' } },
              { content: 'Patient Name', styles: { fontStyle: 'bold' } },
              { content: 'Date', styles: { fontStyle: 'bold' } },
              { content: 'Department', styles: { fontStyle: 'bold' } },
            ],
          },
        ],
        body: activeConsultations.map((consultation) => ({
          cells: [
            { content: consultation.mrn || '' },
            { content: consultation.patient_name || '' },
            { content: consultation.created_at
                ? new Date(consultation.created_at).toLocaleDateString()
                : '' },
            { content: consultation.consultation_specialty || '' },
          ],
        })),
        startY,
        theme: 'grid',
        tableTitle: 'Active Consultations',
      });

      // Update startY for next table
      startY = (doc.document.lastAutoTable?.finalY || startY) + 20;

      // Add a section for Pending Appointments
      pdfTable.addTable({
        head: [
          {
            cells: [
              { content: 'MRN', styles: { fontStyle: 'bold' } },
              { content: 'Patient Name', styles: { fontStyle: 'bold' } },
              { content: 'Date', styles: { fontStyle: 'bold' } },
              { content: 'Department', styles: { fontStyle: 'bold' } },
            ],
          },
        ],
        body: pendingAppointments.map((appointment) => ({
          cells: [
            { content: appointment.medicalNumber || '' },
            { content: appointment.patientName || '' },
            { content: appointment.createdAt
                ? new Date(appointment.createdAt).toLocaleDateString()
                : '' },
            { content: appointment.specialty || '' },
          ],
        })),
        startY,
        theme: 'grid',
        tableTitle: 'Pending Appointments',
      });

      // Save the PDF
      doc.save('ActiveCasesDashboard.pdf');
    } catch (error) {
      console.error('Failed to generate PDF', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center space-x-2">
        <AlertCircle className="h-5 w-5" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="dashboard-content">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Cases Dashboard</h1>
          <p className="text-gray-600">
            Last updated: {lastUpdate.toLocaleTimeString()}
            {loading && ' (Refreshing...)'}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button
            onClick={generatePDF}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={fetchData}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Data</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Active Patients"
          value={activePatients.length}
          icon={Users}
          color="indigo"
          description="Currently admitted patients"
        />
        <StatCard
          title="Active Consultations"
          value={activeConsultations.length}
          icon={Stethoscope}
          color="green"
          description="Pending medical consultations"
        />
        <StatCard
          title="Pending Appointments"
          value={pendingAppointments.length}
          icon={Calendar}
          color="blue"
          description="Scheduled clinic appointments"
        />
      </div>

      <TableContainer
        table={patientTable}
        title="Active Patients"
        count={activePatients.length}
        searchValue={globalFilter}
        onSearchChange={setGlobalFilter}
        onRowClick={(patient: Patient) => {
          const event = new CustomEvent('navigate', { 
            detail: {
              page: 'patient',
              patient
            }
          });
          window.dispatchEvent(event);
        }}
      />

      <TableContainer
        table={consultationTable}
        title="Active Consultations"
        count={activeConsultations.length}
        searchValue={globalFilter}
        onSearchChange={setGlobalFilter}
        onRowClick={(consultation: Consultation) => {
          const event = new CustomEvent('navigate', { 
            detail: {
              page: 'consultation',
              consultation
            }
          });
          window.dispatchEvent(event);
        }}
      />

      <TableContainer
        table={appointmentTable}
        title="Pending Appointments"
        count={pendingAppointments.length}
        searchValue={globalFilter}
        onSearchChange={setGlobalFilter}
        onRowClick={(appointment: Appointment) => {
          const event = new CustomEvent('navigate', { 
            detail: {
              page: 'appointments',
              appointment
            }
          });
          window.dispatchEvent(event);
        }}
      />
    </div>
  );
};

export default ActiveCasesDashboard;