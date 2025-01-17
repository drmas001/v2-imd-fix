import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import type { Patient } from '../../../../types/patient';
import type { Consultation } from '../../../../types/consultation';

interface SpecialtyStatsProps {
  patients: Patient[];
  consultations: Consultation[];
}

export const SpecialtyStats: React.FC<SpecialtyStatsProps> = ({ patients, consultations }) => {
  return (
    <ResponsiveContainer id="specialty-stats-chart" width="100%" height={400}>
      <BarChart data={consultations}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="specialty" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="status" fill="#4f46e5" />
      </BarChart>
    </ResponsiveContainer>
  );
};
