import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Patient } from '../../types/patient';
import type { Consultation } from '../../types/consultation';

interface DepartmentStatsProps {
  dateFilter: {
    startDate: string;
    endDate: string;
    period: string;
  };
}

const DepartmentStats: React.FC<DepartmentStatsProps> = ({ dateFilter }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartmentData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch all required data
        const [patientsResult, consultationsResult, departmentsResult] = await Promise.all([
          supabase
            .from('admissions')
            .select(`
              id,
              patient_id,
              department,
              status,
              patients(*)
            `)
            .eq('status', 'active')
            .is('discharge_date', null),
          supabase
            .from('consultations')
            .select('*')
            .eq('status', 'active'),
          supabase
            .from('departments')
            .select('*')
        ]);

        // Check for errors in each query
        if (patientsResult.error) {
          throw new Error(`Admissions query failed: ${patientsResult.error.message}`);
        }
        if (consultationsResult.error) {
          throw new Error(`Consultations query failed: ${consultationsResult.error.message}`);
        }
        if (departmentsResult.error) {
          throw new Error(`Departments query failed: ${departmentsResult.error.message}`);
        }

        // Log the raw data for debugging
        console.log('Admissions data:', patientsResult.data);
        console.log('Consultations data:', consultationsResult.data);
        console.log('Departments data:', departmentsResult.data);

        const departments = departmentsResult.data.map((dept: any) => dept.name);

        const departmentData = departments.map((department) => {
          // Count active admissions for this department
          const deptPatients = patientsResult.data.filter(
            (admission) => admission.department === department
          ).length;

          // Count active consultations for this department
          const deptConsultations = consultationsResult.data.filter(
            (consultation) => consultation.consultation_specialty === department
          ).length;

          const occupancyRate = Math.min(100, Math.round((deptPatients / 10) * 100));

          return {
            name: department,
            patients: deptPatients,
            consultations: deptConsultations,
            occupancyRate,
          };
        });

        console.log('Processed department data:', departmentData);
        setData(departmentData);

      } catch (error) {
        console.error('Error in fetchDepartmentData:', error);
        setError(error instanceof Error ? error.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Loading department statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6">
        <h3 className="text-red-800 font-medium">Error loading department statistics</h3>
        <p className="text-red-600 mt-2">{error}</p>
      </div>
    );
  }

  const totalPatients = data.reduce((sum, dept) => sum + dept.patients, 0);
  const totalConsultations = data.reduce((sum, dept) => sum + dept.consultations, 0);
  const averageOccupancy = Math.round(
    data.reduce((sum, dept) => sum + dept.occupancyRate, 0) / data.length
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Activity className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">Department Statistics</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-indigo-50 rounded-lg">
          <p className="text-sm font-medium text-indigo-600">Total Active Patients</p>
          <p className="text-2xl font-bold text-indigo-900">{totalPatients}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <p className="text-sm font-medium text-green-600">Active Consultations</p>
          <p className="text-2xl font-bold text-green-900">{totalConsultations}</p>
        </div>
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm font-medium text-blue-600">Average Occupancy</p>
          <p className="text-2xl font-bold text-blue-900">{averageOccupancy}%</p>
        </div>
      </div>

      <div className="h-[400px] mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey="patients"
              name="Active Patients"
              fill="#4f46e5"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="consultations"
              name="Active Consultations"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="occupancyRate"
              name="Occupancy Rate %"
              fill="#6366f1"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((department) => (
          <div key={department.name} className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">{department.name}</h4>
            <div className="space-y-1 text-sm">
              <p className="text-gray-600">
                Active Patients:{' '}
                <span className="font-medium text-gray-900">{department.patients}</span>
              </p>
              <p className="text-gray-600">
                Consultations:{' '}
                <span className="font-medium text-gray-900">{department.consultations}</span>
              </p>
              <p className="text-gray-600">
                Occupancy:{' '}
                <span className="font-medium text-gray-900">{department.occupancyRate}%</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DepartmentStats;