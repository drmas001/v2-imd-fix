import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { User, Clock, Activity, AlertCircle } from 'lucide-react';
import type { Consultation } from '../../types/consultation';
import type { DateFilter } from '../../types/report';

interface DoctorStatsProps {
  consultations: Consultation[];
  dateFilter: DateFilter;
}

interface DoctorMetrics {
  doctorName: string;
  totalConsultations: number;
  completedConsultations: number;
  emergencyCount: number;
  urgentCount: number;
  routineCount: number;
  averageResponseTime: number;
}

interface DoctorAccumulatorMetrics extends Omit<DoctorMetrics, 'averageResponseTime'> {
  responseTimeSum: number;
  responseTimeCount: number;
}

const DoctorStats: React.FC<DoctorStatsProps> = ({ consultations, dateFilter }) => {
  const doctorMetrics = useMemo(() => {
    // Filter consultations by date range
    const filteredConsultations = consultations.filter(consultation =>
      new Date(consultation.created_at) >= new Date(dateFilter.startDate) &&
      new Date(consultation.created_at) <= new Date(dateFilter.endDate)
    );

    // Group consultations by doctor
    const doctorStats = filteredConsultations.reduce((acc, consultation) => {
      const { doctor_id, status, urgency, created_at, updated_at } = consultation;
      const doctorName = consultation.doctor?.name || 'Unknown';
      
      if (!doctor_id) return acc;

      if (!acc[doctor_id]) {
        acc[doctor_id] = {
          doctorName,
          totalConsultations: 0,
          completedConsultations: 0,
          emergencyCount: 0,
          urgentCount: 0,
          routineCount: 0,
          responseTimeSum: 0,
          responseTimeCount: 0,
        };
      }

      acc[doctor_id].totalConsultations++;
      
      if (status === 'completed') {
        acc[doctor_id].completedConsultations++;
        
        // Calculate response time for completed consultations
        const responseTime = new Date(updated_at).getTime() - new Date(created_at).getTime();
        acc[doctor_id].responseTimeSum += responseTime;
        acc[doctor_id].responseTimeCount++;
      }

      // Count by urgency
      switch (urgency.toLowerCase()) {
        case 'emergency':
          acc[doctor_id].emergencyCount++;
          break;
        case 'urgent':
          acc[doctor_id].urgentCount++;
          break;
        case 'routine':
          acc[doctor_id].routineCount++;
          break;
      }

      return acc;
    }, {} as Record<number, DoctorAccumulatorMetrics>);

    // Convert to array and calculate averages
    return Object.values(doctorStats).map(({
      responseTimeSum,
      responseTimeCount,
      ...stats
    }) => ({
      ...stats,
      averageResponseTime: responseTimeCount > 0
        ? Math.round(responseTimeSum / responseTimeCount / (1000 * 60)) // Convert to minutes
        : 0
    }));
  }, [consultations, dateFilter]);

  // Sort doctors by total consultations
  const sortedDoctors = [...doctorMetrics].sort((a, b) => b.totalConsultations - a.totalConsultations);

  // Calculate overall stats
  const totalConsultations = doctorMetrics.reduce((sum, doc) => sum + doc.totalConsultations, 0);
  const completionRate = totalConsultations > 0
    ? Math.round((doctorMetrics.reduce((sum, doc) => sum + doc.completedConsultations, 0) / totalConsultations) * 100)
    : 0;
  const averageResponseTime = Math.round(
    doctorMetrics.reduce((sum, doc) => sum + doc.averageResponseTime, 0) / doctorMetrics.length
  );

  const stats = [
    {
      title: 'Total Consultations',
      value: totalConsultations,
      icon: <User className="h-5 w-5" />,
      color: 'indigo' as const
    },
    {
      title: 'Completion Rate',
      value: `${completionRate}%`,
      icon: <Activity className="h-5 w-5" />,
      color: 'green' as const
    },
    {
      title: 'Avg Response Time',
      value: `${averageResponseTime} min`,
      icon: <Clock className="h-5 w-5" />,
      color: 'blue' as const
    },
    {
      title: 'Emergency Cases',
      value: doctorMetrics.reduce((sum, doc) => sum + doc.emergencyCount, 0),
      icon: <AlertCircle className="h-5 w-5" />,
      color: 'red' as const
    }
  ];

  return (
    <div className="space-y-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900">Doctor Statistics</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg bg-${stat.color}-50`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium text-${stat.color}-600 mb-1`}>{stat.title}</p>
                <p className={`text-2xl font-bold text-${stat.color}-900`}>{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg bg-${stat.color}-100/50`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Consultation Distribution by Doctor</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%" id="doctor-stats-chart">
            <BarChart data={sortedDoctors}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="doctorName" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar 
                name="Emergency" 
                dataKey="emergencyCount" 
                stackId="a" 
                fill="#ef4444" 
              />
              <Bar 
                name="Urgent" 
                dataKey="urgentCount" 
                stackId="a" 
                fill="#f59e0b" 
              />
              <Bar 
                name="Routine" 
                dataKey="routineCount" 
                stackId="a" 
                fill="#10b981" 
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-4">Performance Metrics</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Cases</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Response (min)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedDoctors.map((doctor, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {doctor.doctorName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doctor.totalConsultations}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doctor.totalConsultations > 0
                      ? `${Math.round((doctor.completedConsultations / doctor.totalConsultations) * 100)}%`
                      : '0%'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {doctor.averageResponseTime}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DoctorStats;