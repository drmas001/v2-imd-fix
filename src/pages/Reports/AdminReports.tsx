import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ExportButton } from '../../components/Reports/ExportButton';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import { useUserStore } from '../../stores/useUserStore';
import { AccessDenied } from '../../components/ui/AccessDenied';
import { PrinterIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { Spinner } from '../../components/ui/Spinner';
import type { ExportData, DateFilter } from '../../types/report';
import type { Patient } from '../../types/patient';
import type { Consultation } from '../../types/consultation';
import type { Database } from '../../lib/database.types';

import OccupancyChart from './OccupancyChart';
import AdmissionTrends from './AdmissionTrends';
import SpecialtyStats from '../../components/Reports/SpecialtyStats';
import DoctorStats from '../../components/Reports/DoctorStats';
import ConsultationMetrics from '../../components/Reports/ConsultationMetrics';
import SafetyAdmissionStats from '../../components/Reports/SafetyAdmissionStats';
import { DischargeStats } from '../../components/Reports/DischargeStats';
import LongStayReport from '../../components/Reports/LongStayReport';

const AdminReports: React.FC = () => {
  const { currentUser } = useUserStore();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    period: 'today',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch patients with date filtering
        const { data: patientsData, error: patientsError } = await supabase
          .from('patients')
          .select('*, admissions(*)')
          .gte('created_at', dateFilter.startDate)
          .lte('created_at', dateFilter.endDate);

        if (patientsError) throw patientsError;

        // Fetch consultations with date filtering
        const { data: consultationsData, error: consultationsError } = await supabase
          .from('consultations')
          .select(`
            *,
            patient:patients(id, full_name),
            doctor:doctors(id, full_name, specialty)
          `)
          .gte('consultation_date', dateFilter.startDate)
          .lte('consultation_date', dateFilter.endDate);

        if (consultationsError) throw consultationsError;

        setPatients(patientsData as Patient[] || []);
        setConsultations(consultationsData as Consultation[] || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to fetch report data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [dateFilter]);

  // Check if user has admin access
  if (currentUser?.role !== 'administrator') {
    return <AccessDenied />;
  }

  const exportData: ExportData = {
    patients,
    consultations,
    dateFilter,
    appointments: [], // Include appointments if available
    generatedAt: new Date().toISOString(),
    generatedBy: currentUser?.name || 'Unknown',
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Administrative Report</CardTitle>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => window.print()}
                leftIcon={<PrinterIcon className="h-4 w-4" />}
              >
                Print
              </Button>
              <ExportButton data={exportData} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DateRangePicker
            value={dateFilter}
            onChange={setDateFilter}
            className="mb-6"
          />

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OccupancyChart dateFilter={dateFilter} />
                <AdmissionTrends dateFilter={dateFilter} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <SpecialtyStats consultations={consultations} />
                <DoctorStats consultations={consultations} dateFilter={dateFilter} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <ConsultationMetrics consultations={consultations} dateFilter={dateFilter} />
                <SafetyAdmissionStats patients={patients} dateFilter={dateFilter} />
              </div>

              <div className="mt-6">
                <DischargeStats dateFilter={dateFilter} />
              </div>

              <div className="mt-6">
                <LongStayReport patients={patients} dateFilter={dateFilter} />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReports;