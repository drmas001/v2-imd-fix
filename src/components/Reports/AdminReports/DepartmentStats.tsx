import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import ResponsiveChart from './ResponsiveChart';
import { supabase } from '../../../lib/supabase';
import type { Patient } from '../../../types/patient';
import type { Consultation } from '../../../types/consultation';

interface DepartmentData {
  name: string;
  patients: number;
  consultations: number;
  occupancyRate: number;
}

interface DepartmentStat {
  department_name: string;
  total_patients: number;
  total_consultations: number;
  occupancy_rate: number;
}

const DepartmentStats: React.FC = () => {
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDepartmentStats = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .rpc('get_department_statistics');

        if (error) throw error;

        const formattedData = data.map((stat: DepartmentStat) => ({
          name: stat.department_name,
          patients: Number(stat.total_patients),
          consultations: Number(stat.total_consultations),
          occupancyRate: stat.occupancy_rate
        }));

        setDepartmentData(formattedData);
      } catch (error) {
        console.error('Error fetching department statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentStats();
  }, []);

  if (loading) {
    return <div>Loading department statistics...</div>;
  }

  return (
    <ResponsiveChart title="Department Statistics" subtitle="All-time patient distribution by department">
      <BarChart 
        data={departmentData} 
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        height={400}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
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
          dataKey="patients" 
          name="Total Patients" 
          fill="#4f46e5" 
          radius={[4, 4, 0, 0]} 
        />
        <Bar 
          dataKey="consultations" 
          name="Total Consultations" 
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
    </ResponsiveChart>
  );
};

export default DepartmentStats;