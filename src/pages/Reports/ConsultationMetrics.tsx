import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useConsultationStore } from '../../stores/useConsultationStore';
import type { Consultation } from '../../types/consultation';

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

interface ResponseTime {
  type: Consultation['urgency'];
  average: number;
}

const COLORS = {
  emergency: '#ef4444',
  urgent: '#f59e0b',
  routine: '#10b981'
} as const;

const ConsultationMetrics: React.FC<ConsultationMetricsProps> = ({ dateFilter }) => {
  const { consultations } = useConsultationStore();

  const getFilteredConsultations = () => {
    return consultations.filter(consultation =>
      new Date(consultation.created_at) >= new Date(dateFilter.startDate) &&
      new Date(consultation.created_at) <= new Date(dateFilter.endDate)
    );
  };

  const getUrgencyData = (): UrgencyData[] => {
    const filtered = getFilteredConsultations();
    const counts = {
      emergency: 0,
      urgent: 0,
      routine: 0
    };

    filtered.forEach(consultation => {
      counts[consultation.urgency]++;
    });

    return Object.entries(counts).map(([key, value]) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value
    }));
  };

  const getResponseTimes = (): ResponseTime[] => {
    const filtered = getFilteredConsultations();
    const times: Record<Consultation['urgency'], number[]> = {
      emergency: [],
      urgent: [],
      routine: []
    };

    filtered.forEach(consultation => {
      if (consultation.response_time) {
        times[consultation.urgency].push(consultation.response_time);
      }
    });

    return Object.entries(times).map(([key, values]) => ({
      type: key as Consultation['urgency'],
      average: values.length ? 
        Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 
        0
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Consultation Metrics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Consultation Distribution</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getUrgencyData()}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }: UrgencyData) => `${name}: ${value}`}
                >
                  {getUrgencyData().map((entry, index) => (
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

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4">Average Response Times</h3>
          <div className="space-y-4">
            {getResponseTimes().map(({ type, average }) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full bg-${COLORS[type]}`} />
                  <span className="text-sm text-gray-600 capitalize">{type}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {average} minutes
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