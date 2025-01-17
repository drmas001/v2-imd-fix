import React, { useMemo, useEffect } from 'react';
import { usePatientStore } from '../../stores/usePatientStore';
import type { DateFilter } from '../../types/dateFilter';
import { Card } from '../ui/Card';
import { Spinner } from '../ui/Spinner';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface DischargeStatsProps {
  dateFilter: DateFilter;
}

export const DischargeStats: React.FC<DischargeStatsProps> = ({ dateFilter }) => {
  const { patients, loading, fetchPatients } = usePatientStore();

  useEffect(() => {
    // Fetch all discharged patients
    fetchPatients(true);
  }, [fetchPatients]);

  const metrics = useMemo(() => {
    if (!patients || patients.length === 0) {
      return {
        totalDischarges: 0,
        avgLengthOfStay: 0,
        departmentDischarges: {},
        timelineMap: new Map<string, number>()
      };
    }

    const startDate = new Date(dateFilter.startDate);
    const endDate = new Date(dateFilter.endDate);
    endDate.setHours(23, 59, 59, 999); // Include the entire end date

    let totalDischarges = 0;
    let totalLengthOfStay = 0;
    const departmentDischarges: { [key: string]: number } = {};
    const timelineMap = new Map<string, number>();

    // Initialize timeline map with all dates
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      timelineMap.set(currentDate.toISOString().split('T')[0], 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    patients.forEach(patient => {
      if (!patient.admissions) return;

      patient.admissions.forEach(admission => {
        if (!admission.discharge_date) return;

        const dischargeDate = new Date(admission.discharge_date);
        if (dischargeDate >= startDate && dischargeDate <= endDate) {
          totalDischarges++;

          // Calculate length of stay
          const admissionDate = new Date(admission.admission_date);
          const lengthOfStay = Math.ceil((dischargeDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24));
          totalLengthOfStay += lengthOfStay;

          // Count discharges by department
          departmentDischarges[admission.department] = (departmentDischarges[admission.department] || 0) + 1;

          // Add to timeline
          const dischargeDateStr = dischargeDate.toISOString().split('T')[0];
          if (timelineMap.has(dischargeDateStr)) {
            timelineMap.set(dischargeDateStr, (timelineMap.get(dischargeDateStr) || 0) + 1);
          }
        }
      });
    });

    return {
      totalDischarges,
      avgLengthOfStay: totalDischarges > 0 ? Math.round(totalLengthOfStay / totalDischarges * 10) / 10 : 0,
      departmentDischarges,
      timelineMap
    };
  }, [patients, dateFilter]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const timelineData = Array.from(metrics.timelineMap.entries()).map(([date, count]) => ({
    date,
    discharges: count
  }));

  const departmentData = Object.entries(metrics.departmentDischarges).map(([department, count]) => ({
    department,
    discharges: count
  }));

  return (
    <div id="discharge-stats-chart" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900">Discharged Patients</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">{metrics.totalDischarges}</p>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900">Total Discharges</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">{metrics.totalDischarges}</p>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900">Average Length of Stay</h3>
          <p className="mt-2 text-3xl font-bold text-indigo-600">{metrics.avgLengthOfStay} days</p>
        </div>
      </Card>

      <Card className="lg:col-span-4">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Discharges by Department</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" id="discharge-stats-chart">
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="department" 
                  angle={-45} 
                  textAnchor="end" 
                  height={100}
                  interval={0}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar 
                  dataKey="discharges" 
                  name="Discharges" 
                  fill="#4f46e5" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      <Card className="lg:col-span-4">
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Discharge Timeline</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  angle={-45} 
                  textAnchor="end" 
                  height={60}
                  interval={0}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="discharges" 
                  name="Discharges" 
                  stroke="#4f46e5" 
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    </div>
  );
};