import React, { useMemo } from 'react';
import type { Patient } from '../../types/patient';
import type { DateFilter } from '../../types/report';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { differenceInDays, parseISO, isWithinInterval } from 'date-fns';

interface LongStayReportProps {
  patients: Patient[];
  dateFilter: DateFilter;
}

interface PatientStayInfo {
  id: number;
  name: string;
  mrn: string;
  department: string;
  admissionDate: Date;
  daysOfStay: number;
  doctor: string;
  diagnosis?: string;
}

const LongStayReport: React.FC<LongStayReportProps> = ({ patients, dateFilter }) => {
  const longStayPatients = useMemo(() => {
    const startDate = parseISO(dateFilter.startDate);
    const endDate = parseISO(dateFilter.endDate);

    return patients
      .filter(patient => {
        const admissionDate = parseISO(patient.admission_date);
        return isWithinInterval(admissionDate, { start: startDate, end: endDate });
      })
      .map(patient => {
        const admissionDate = parseISO(patient.admission_date);
        const currentDate = new Date();
        const latestAdmission = patient.admissions?.[patient.admissions.length - 1];
        
        return {
          id: patient.id,
          name: patient.full_name,
          mrn: patient.mrn,
          department: patient.department,
          admissionDate: admissionDate,
          daysOfStay: differenceInDays(currentDate, admissionDate),
          doctor: patient.doctor_name || 'Not Assigned',
          diagnosis: latestAdmission?.diagnosis
        };
      })
      .filter(patient => patient.daysOfStay >= 7) // Consider stays of 7 or more days as long stays
      .sort((a, b) => b.daysOfStay - a.daysOfStay);
  }, [patients, dateFilter]);

  const stats = useMemo(() => {
    const total = longStayPatients.length;
    const averageStay = total > 0
      ? Math.round(longStayPatients.reduce((acc, curr) => acc + curr.daysOfStay, 0) / total)
      : 0;
    const maxStay = total > 0
      ? Math.max(...longStayPatients.map(p => p.daysOfStay))
      : 0;

    return { total, averageStay, maxStay };
  }, [longStayPatients]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Long Stay Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Stay Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageStay} days</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Longest Stay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.maxStay} days</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Long Stay Patients Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    MRN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days of Stay
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Doctor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Diagnosis
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {longStayPatients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {patient.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.mrn}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.department}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.daysOfStay}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.doctor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {patient.diagnosis || 'N/A'}
                    </td>
                  </tr>
                ))}
                {longStayPatients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No long stay patients found in the selected date range
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LongStayReport;