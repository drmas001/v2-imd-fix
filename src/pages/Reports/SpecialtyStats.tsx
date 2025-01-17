import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const specialties = [
  'Internal Medicine',
  'Pulmonology',
  'Neurology',
  'Gastroenterology',
  'Rheumatology',
  'Endocrinology',
  'Hematology',
  'Infectious Disease',
  'Thrombosis Medicine',
  'Immunology & Allergy'
];

const SpecialtyStats: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSpecialtyData = async () => {
      try {
        const [
          { data: patientsData, error: patientsError },
          { data: consultationsData, error: consultationsError }
        ] = await Promise.all([
          supabase
            .from('patients')
            .select('*, admissions(*)')
            .eq('status', 'active'),
          supabase
            .from('consultations')
            .select('*')
            .eq('status', 'active')
        ]);

        if (patientsError) throw patientsError;
        if (consultationsError) throw consultationsError;

        const specialtyData = specialties.map(specialty => {
          const activePatients = patientsData.filter(patient => 
            patient.admissions?.some((admission: any) => 
              admission.department === specialty && 
              admission.status === 'active'
            )
          ).length;

          const activeConsultations = consultationsData.filter(consultation =>
            consultation.consultation_specialty === specialty
          ).length;

          const occupancyRate = Math.min(100, Math.round((activePatients / (activePatients + 5)) * 100));

          return {
            name: specialty,
            patients: activePatients,
            consultations: activeConsultations,
            occupancyRate
          };
        });

        setData(specialtyData);
      } catch (error) {
        console.error('Error fetching specialty data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecialtyData();
  }, []);

  if (loading) {
    return <div>Loading specialty statistics...</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Activity className="h-5 w-5 text-indigo-600" />
        <h3 className="text-lg font-semibold text-gray-900">Specialty Statistics</h3>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
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
            <Bar dataKey="patients" name="Active Patients" fill="#4f46e5" />
            <Bar dataKey="consultations" name="Active Consultations" fill="#06b6d4" />
            <Bar dataKey="occupancyRate" name="Occupancy Rate %" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map(specialty => (
          <div 
            key={specialty.name}
            className="p-3 bg-gray-50 rounded-lg"
          >
            <h4 className="font-medium text-gray-900 mb-2">{specialty.name}</h4>
            <div className="space-y-1 text-sm">
              <p className="text-gray-600">
                Active Patients: <span className="font-medium text-gray-900">{specialty.patients}</span>
              </p>
              <p className="text-gray-600">
                Consultations: <span className="font-medium text-gray-900">{specialty.consultations}</span>
              </p>
              <p className="text-gray-600">
                Occupancy: <span className="font-medium text-gray-900">{specialty.occupancyRate}%</span>
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpecialtyStats;