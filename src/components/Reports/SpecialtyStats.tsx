import React, { useMemo } from 'react';
import type { Consultation } from '../../types/consultation';
import { ResponsiveContainer } from 'recharts';

interface SpecialtyStatsProps {
  consultations: Consultation[];
}

interface SpecialtyData {
  specialty: string;
  count: number;
  percentage: number;
}

const SpecialtyStats: React.FC<SpecialtyStatsProps> = ({ consultations }) => {
  const specialtyStats = useMemo(() => {
    const stats = consultations.reduce((acc: { [key: string]: number }, consultation) => {
      const specialty = consultation.consultation_specialty || 'Unspecified';
      acc[specialty] = (acc[specialty] || 0) + 1;
      return acc;
    }, {});

    const total = consultations.length;
    
    return Object.entries(stats)
      .map(([specialty, count]): SpecialtyData => ({
        specialty,
        count,
        percentage: (count / total) * 100
      }))
      .sort((a, b) => b.count - a.count);
  }, [consultations]);

  if (consultations.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        No consultation data available
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">Specialty Distribution</h2>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%" id="specialty-stats-chart">
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left">Specialty</th>
                  <th className="px-4 py-2 text-right">Count</th>
                  <th className="px-4 py-2 text-right">Percentage</th>
                </tr>
              </thead>
              <tbody>
                {specialtyStats.map((stat) => (
                  <tr key={stat.specialty} className="border-t">
                    <td className="px-4 py-2">{stat.specialty}</td>
                    <td className="px-4 py-2 text-right">{stat.count}</td>
                    <td className="px-4 py-2 text-right">
                      {stat.percentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2">
                <tr className="font-semibold">
                  <td className="px-4 py-2">Total</td>
                  <td className="px-4 py-2 text-right">{consultations.length}</td>
                  <td className="px-4 py-2 text-right">100%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SpecialtyStats;