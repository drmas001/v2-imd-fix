import React, { useState } from 'react';
import { ArrowUpDown, Filter } from 'lucide-react';
import { format } from 'date-fns';
import type { Patient } from '../../../types/patient';
import type { Consultation } from '../../../types/consultation';
import type { Appointment } from '../../../types/appointment';

interface ComparisonTableProps {
  patients: Patient[];
  consultations: Consultation[];
  appointments: Appointment[];
}

type SortField = 'date' | 'type' | 'name' | 'department';
type SortDirection = 'asc' | 'desc';

const ComparisonTable: React.FC<ComparisonTableProps> = ({
  patients,
  consultations,
  appointments
}) => {
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filter, setFilter] = useState('all');

  // Combine all records into a unified format
  const allRecords = [
    ...patients.map(patient => ({
      type: 'admission',
      date: patient.admission_date || '',
      name: patient.name,
      identifier: patient.mrn,
      department: patient.department || '',
      status: patient.admissions?.[0]?.status || '',
      details: patient.admissions?.[0]?.diagnosis || ''
    })),
    ...consultations.map(consultation => ({
      type: 'consultation',
      date: consultation.created_at,
      name: consultation.patient_name,
      identifier: consultation.mrn,
      department: consultation.consultation_specialty,
      status: consultation.status,
      details: consultation.reason
    })),
    ...appointments.map(appointment => ({
      type: 'appointment',
      date: appointment.createdAt,
      name: appointment.patientName,
      identifier: appointment.medicalNumber,
      department: appointment.specialty,
      status: appointment.status,
      details: appointment.notes || ''
    }))
  ];

  // Sort records
  const sortedRecords = [...allRecords].sort((a, b) => {
    switch (sortField) {
      case 'date':
        return sortDirection === 'asc'
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      case 'type':
        return sortDirection === 'asc'
          ? a.type.localeCompare(b.type)
          : b.type.localeCompare(a.type);
      case 'name':
        return sortDirection === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      case 'department':
        return sortDirection === 'asc'
          ? a.department.localeCompare(b.department)
          : b.department.localeCompare(a.department);
      default:
        return 0;
    }
  });

  // Filter records
  const filteredRecords = filter === 'all'
    ? sortedRecords
    : sortedRecords.filter(record => record.type === filter);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h3 className="text-lg font-semibold text-gray-900">Historical Records</h3>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            >
              <option value="all">All Records</option>
              <option value="admission">Admissions</option>
              <option value="consultation">Consultations</option>
              <option value="appointment">Appointments</option>
            </select>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => handleSort('date')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </th>
              <th
                onClick={() => handleSort('type')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center space-x-1">
                  <span>Type</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </th>
              <th
                onClick={() => handleSort('name')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center space-x-1">
                  <span>Name</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Identifier
              </th>
              <th
                onClick={() => handleSort('department')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center space-x-1">
                  <span>Department</span>
                  <ArrowUpDown className="h-4 w-4" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRecords.map((record, index) => (
              <tr key={`${record.type}-${record.identifier}-${index}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {format(new Date(record.date), 'dd MMM yyyy HH:mm')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    record.type === 'admission'
                      ? 'bg-blue-100 text-blue-800'
                      : record.type === 'consultation'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {record.type.charAt(0).toUpperCase() + record.type.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.identifier}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {record.department}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    record.status === 'active' || record.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : record.status === 'completed' || record.status === 'discharged'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {record.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                  {record.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredRecords.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No records found for the selected filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparisonTable;