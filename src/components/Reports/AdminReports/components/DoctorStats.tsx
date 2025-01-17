import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { Consultation } from '../../../../types/consultation';

interface DoctorStatsProps {
  dateFilter: {
    startDate: string;
    endDate: string;
    period: 'today' | 'week' | 'month' | 'custom';
  };
  consultations: Consultation[];
}

const DoctorStats: React.FC<DoctorStatsProps> = ({ dateFilter, consultations }) => {
  return (
    <div id="doctor-stats-chart">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={consultations}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="doctorName" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="status" fill="#4f46e5" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DoctorStats;

// ... existing code ...