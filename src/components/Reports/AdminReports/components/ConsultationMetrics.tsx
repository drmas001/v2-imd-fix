import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useConsultationStore } from '../../../../stores/useConsultationStore';
import type { Consultation } from '../../../../types/consultation';

interface ConsultationMetricsProps {
  dateFilter: {
    startDate: string;
    endDate: string;
    period: string;
  };
}

interface UrgencyData {
  name: string;
  value: number;
}

const COLORS = {
  emergency: '#ef4444',
  urgent: '#f59e0b',
  routine: '#10b981'
} as const;

const ConsultationMetrics: React.FC<ConsultationMetricsProps> = ({ dateFilter }) => {
  const { consultations } = useConsultationStore();

  const getFilteredConsultations = () => {
    const startDate = new Date(dateFilter.startDate);
    const endDate = new Date(dateFilter.endDate);
    endDate.setHours(23, 59, 59, 999); // Set to end of day

    console.log('Date range:', {
      startDate,
      endDate,
      totalConsultations: consultations.length
    });

    const filtered = consultations.filter(consultation => {
      const consultationDate = new Date(consultation.created_at);
      return consultationDate >= startDate && consultationDate <= endDate;
    });

    console.log('Filtered consultations:', {
      count: filtered.length,
      consultations: filtered.map(c => ({
        id: c.id,
        created_at: c.created_at,
        urgency: c.urgency
      }))
    });

    return filtered;
  };

  const getUrgencyData = (): UrgencyData[] => {
    const filtered = getFilteredConsultations();
    const counts = {
      emergency: 0,
      urgent: 0,
      routine: 0
    };

    filtered.forEach(consultation => {
      counts[consultation.urgency as keyof typeof counts]++;
    });

    return Object.entries(counts).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value
    }));
  };

  const data = getUrgencyData();
  const totalConsultations = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Consultation Metrics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Distribution by Urgency</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%" id="consultation-metrics-chart">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }: UrgencyData) => `${name}: ${value}`}
                >
                  {data.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} 
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Summary</h3>
            <p className="text-2xl font-bold text-gray-900">{totalConsultations}</p>
            <p className="text-sm text-gray-600">Total Consultations</p>
          </div>

          <div className="space-y-2">
            {data.map(({ name, value }) => (
              <div key={name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[name.toLowerCase() as keyof typeof COLORS] }}
                  />
                  <span className="text-sm text-gray-600">{name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {Math.round((value / totalConsultations) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationMetrics;