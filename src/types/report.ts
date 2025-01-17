import type { Patient } from './patient';
import type { Consultation } from './consultation';

export interface DateFilter {
  startDate: string;
  endDate: string;
  period: 'today' | 'week' | 'month' | 'custom';
}

export interface ExportData {
  patients: Patient[];
  consultations: Consultation[];
  dateFilter: DateFilter;
  appointments: any[];
  generatedAt: string;
  generatedBy: string;
  title?: string;
}

export interface ReportFilters {
  dateFrom: string;
  dateTo: string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'custom';
  specialty: string;
  searchQuery: string;
}