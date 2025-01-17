import React, { useEffect } from 'react';
import { Calendar, Filter, Search } from 'lucide-react';
import type { ReportFilters } from '../../types/report';

interface ReportFiltersProps {
  onFilterChange: (filters: ReportFilters) => void;
}

const specialties = [
  { value: 'Internal Medicine', label: 'Internal Medicine' },
  { value: 'Pulmonology', label: 'Pulmonology' },
  { value: 'Neurology', label: 'Neurology' },
  { value: 'Gastroenterology', label: 'Gastroenterology' },
  { value: 'Rheumatology', label: 'Rheumatology' },
  { value: 'Endocrinology', label: 'Endocrinology' },
  { value: 'Hematology', label: 'Hematology' },
  { value: 'Infectious Disease', label: 'Infectious Disease' },
  { value: 'Thrombosis Medicine', label: 'Thrombosis Medicine' },
  { value: 'Immunology & Allergy', label: 'Immunology & Allergy' }
];

const ReportFilters: React.FC<ReportFiltersProps> = ({ onFilterChange }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const [filters, setFilters] = React.useState<ReportFilters>({
    dateFrom: today,
    dateTo: today,
    reportType: 'daily',
    specialty: 'all',
    searchQuery: ''
  });

  useEffect(() => {
    if (filters.reportType === 'daily') {
      const updatedFilters = {
        ...filters,
        dateFrom: today,
        dateTo: today
      };
      setFilters(updatedFilters);
      onFilterChange(updatedFilters);
    } else {
      const fromDate = new Date(filters.dateFrom);
      const toDate = new Date(filters.dateTo);
      
      if (fromDate > toDate) {
        const updatedFilters = {
          ...filters,
          dateTo: filters.dateFrom
        };
        setFilters(updatedFilters);
        onFilterChange(updatedFilters);
      } else {
        onFilterChange(filters);
      }
    }
  }, [filters.dateFrom, filters.dateTo, filters.reportType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newFilters = { ...filters, [name]: value };

    if (name === 'reportType' && value === 'daily') {
      newFilters = {
        ...newFilters,
        dateFrom: today,
        dateTo: today
      };
    }

    if (name === 'dateFrom' && new Date(value) > new Date(filters.dateTo)) {
      newFilters.dateTo = value;
    }
    if (name === 'dateTo' && new Date(value) < new Date(filters.dateFrom)) {
      newFilters.dateFrom = value;
    }

    setFilters(newFilters);
  };

  const handleReset = () => {
    const resetFilters: ReportFilters = {
      dateFrom: today,
      dateTo: today,
      reportType: 'daily',
      specialty: 'all',
      searchQuery: ''
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Report Filters</h2>
        <button 
          onClick={handleReset}
          className="text-sm text-indigo-600 hover:text-indigo-700 mt-2 md:mt-0"
        >
          Reset Filters
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
            Report Type
          </label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              id="reportType"
              name="reportType"
              value={filters.reportType}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            >
              <option value="daily">Daily Report</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-1">
            From Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              id="dateFrom"
              name="dateFrom"
              value={filters.dateFrom}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent ${
                filters.reportType === 'daily' ? 'bg-gray-50' : ''
              }`}
              disabled={filters.reportType === 'daily'}
              max={filters.dateTo}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-1">
            To Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              id="dateTo"
              name="dateTo"
              value={filters.dateTo}
              onChange={handleChange}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent ${
                filters.reportType === 'daily' ? 'bg-gray-50' : ''
              }`}
              disabled={filters.reportType === 'daily'}
              min={filters.dateFrom}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="specialty" className="block text-sm font-medium text-gray-700 mb-1">
            Specialty
          </label>
          <select
            id="specialty"
            name="specialty"
            value={filters.specialty}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
          >
            <option value="all">All Specialties</option>
            {specialties.map(specialty => (
              <option key={specialty.value} value={specialty.value}>{specialty.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          id="searchQuery"
          name="searchQuery"
          value={filters.searchQuery}
          onChange={handleChange}
          placeholder="Search by MRN, patient name, or doctor..."
          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
        />
      </div>

      {filters.reportType === 'custom' && (
        <p className="text-sm text-gray-500">
          Showing data from {new Date(filters.dateFrom).toLocaleDateString()} to {new Date(filters.dateTo).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

export default ReportFilters;