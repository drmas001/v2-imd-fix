export interface DateFilter {
  startDate: string;
  endDate: string;
  period: 'today' | 'week' | 'month' | 'custom';
} 