import React, { useState, useEffect } from 'react';
import { User, Calendar, Clock, AlertCircle, Shield } from 'lucide-react';
import { usePatientStore } from '../../stores/usePatientStore';
import { useNavigate } from '../../hooks/useNavigate';
import { supabase } from '../../lib/supabase';

interface AdmissionFormData {
  mrn: string;
  name: string;
  age: string;
  gender: 'male' | 'female';
  admissionDate: string;
  useWeekendShift: boolean;
  shiftType:
    | 'morning'
    | 'evening'
    | 'night'
    | 'weekend_morning'
    | 'weekend_night';
  assignedDoctorId: number;
  department: string;
  diagnosis: string;
  safetyType: 'emergency' | 'observation' | 'short-stay' | '';
}

const initialFormData: AdmissionFormData = {
  mrn: '',
  name: '',
  age: '',
  gender: 'male',
  admissionDate: new Date().toISOString().split('T')[0],
  useWeekendShift: false,
  shiftType: 'morning',
  assignedDoctorId: 0,
  department: '',
  diagnosis: '',
  safetyType: '',
};

const departments = [
  'Internal Medicine',
  'Pulmonology',
  'Neurology',
  'Gastroenterology',
  'Rheumatology',
  'Endocrinology',
  'Hematology',
  'Infectious Disease',
  'Thrombosis Medicine',
  'Immunology & Allergy',
] as const;

const safetyTypes = [
  {
    id: 'emergency' as const,
    label: 'Emergency',
    color: 'red',
    description: 'Requires immediate medical attention',
  },
  {
    id: 'observation' as const,
    label: 'Observation',
    color: 'yellow',
    description: 'Needs close monitoring',
  },
  {
    id: 'short-stay' as const,
    label: 'Short Stay',
    color: 'green',
    description: 'Planned brief admission',
  },
] as const;

interface Doctor {
  id: number;
  name: string;
  department: string;
  // Include any other fields you need from the user table
}

const AdmissionForm: React.FC = () => {
  const { addPatient } = usePatientStore();
  const { goBack } = useNavigate();
  const [formData, setFormData] =
    useState<AdmissionFormData>(initialFormData);
  const [error, setError] = useState<string>('');

  // State to hold doctors fetched from the database
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState<boolean>(false);
  const [doctorsError, setDoctorsError] = useState<string>('');

  // Fetch doctors whenever the department changes
  useEffect(() => {
    const fetchDoctors = async () => {
      if (!formData.department) {
        setDoctors([]);
        return;
      }

      setLoadingDoctors(true);
      setDoctorsError('');

      try {
        const { data, error } = await supabase
          .from('users')
          .select(`
            id,
            name,
            department
          `)
          .eq('role', 'doctor')
          .eq('status', 'active')
          .eq('department', formData.department);

        if (error) throw error;
        
        setDoctors(data);
      } catch (error) {
        console.error('Error fetching doctors:', error);
        setDoctorsError('Error fetching doctors');
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, [formData.department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      if (!formData.assignedDoctorId) {
        throw new Error('Please select an assigned doctor');
      }

      const today = new Date();
      const birthYear = today.getFullYear() - parseInt(formData.age);
      const dateOfBirth = new Date(
        birthYear,
        0,
        1
      ).toISOString().split('T')[0];

      const patientData = {
        mrn: formData.mrn,
        name: formData.name,
        date_of_birth: dateOfBirth,
        gender: formData.gender,
        admission: {
          admission_date: formData.admissionDate,
          department: formData.department,
          admitting_doctor_id: formData.assignedDoctorId,
          diagnosis: formData.diagnosis,
          status: 'active' as const,
          shift_type: formData.shiftType,
          safety_type: formData.safetyType || undefined,
          is_weekend: formData.useWeekendShift,
        },
      };

      await addPatient(patientData);
      alert('Patient admitted successfully!');
      goBack();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Error admitting patient'
      );
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Reset assignedDoctorId if department changes
      ...(name === 'department' && { assignedDoctorId: 0 }),
    }));
  };

  const handleWeekendShiftToggle = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const useWeekend = e.target.checked;
    setFormData((prev) => ({
      ...prev,
      useWeekendShift: useWeekend,
      shiftType: useWeekend ? 'weekend_morning' : 'morning',
    }));
  };

  const isWeekend = (() => {
    const date = new Date(formData.admissionDate);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 5 || dayOfWeek === 6; // Friday or Saturday
  })();

  const getWeekendMessage = () => {
    const date = new Date(formData.admissionDate);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 5
      ? 'Friday admission'
      : dayOfWeek === 6
      ? 'Saturday admission'
      : '';
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div>
          <label
            htmlFor="mrn"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            MRN
          </label>
          <input
            type="text"
            id="mrn"
            name="mrn"
            value={formData.mrn}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Patient Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              required
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="age"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Age
          </label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            min="0"
            max="150"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label
            htmlFor="gender"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Gender
          </label>
          <select
            id="gender"
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            required
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>

        {/* Admission Details */}
        <div>
          <label
            htmlFor="admissionDate"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Admission Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="date"
              id="admissionDate"
              name="admissionDate"
              value={formData.admissionDate}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              required
            />
          </div>
          {isWeekend && (
            <div className="mt-2">
              <p className="text-sm text-yellow-600 mb-2">
                {getWeekendMessage()}
              </p>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.useWeekendShift}
                  onChange={handleWeekendShiftToggle}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">
                  Use weekend shift schedule
                </span>
              </label>
            </div>
          )}
        </div>

        <div>
          <label
            htmlFor="shiftType"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Shift Type
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              id="shiftType"
              name="shiftType"
              value={formData.shiftType}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              required
            >
              {isWeekend && formData.useWeekendShift ? (
                <>
                  <option value="weekend_morning">
                    Weekend Morning (7:00 - 19:00)
                  </option>
                  <option value="weekend_night">
                    Weekend Night (19:00 - 7:00)
                  </option>
                </>
              ) : (
                <>
                  <option value="morning">Morning</option>
                  <option value="evening">Evening</option>
                  <option value="night">Night</option>
                </>
              )}
            </select>
          </div>
          {isWeekend && (
            <p className="mt-1 text-sm text-gray-500">
              {formData.useWeekendShift
                ? 'Weekend shifts follow a 12-hour schedule'
                : 'Using regular weekday shift schedule'}
            </p>
          )}
        </div>

        {/* Department */}
        <div>
          <label
            htmlFor="department"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Department
          </label>
          <select
            id="department"
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            required
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        {/* Assigned Doctor */}
        <div>
          <label
            htmlFor="assignedDoctorId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Assigned Doctor
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              id="assignedDoctorId"
              name="assignedDoctorId"
              value={formData.assignedDoctorId}
              onChange={handleChange}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              required
              disabled={
                !formData.department || loadingDoctors || Boolean(doctorsError)
              }
            >
              <option value="">
                {!formData.department
                  ? 'Select a department first'
                  : loadingDoctors
                  ? 'Loading doctors...'
                  : doctorsError
                  ? 'Error loading doctors'
                  : doctors.length === 0
                  ? 'No doctors available'
                  : 'Select a doctor'}
              </option>
              {doctors.map((doctor) => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </select>
          </div>
          {doctorsError && (
            <p className="mt-1 text-sm text-red-600">{doctorsError}</p>
          )}
        </div>

        {/* Safety Type */}
        <div>
          <label
            htmlFor="safetyType"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Safety Type
          </label>
          <div className="space-y-2">
            <select
              id="safetyType"
              name="safetyType"
              value={formData.safetyType}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            >
              <option value="">No Safety Type</option>
              {safetyTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
            {formData.safetyType && (
              <div
                className={`p-2 bg-${
                  safetyTypes.find(
                    (t) => t.id === formData.safetyType
                  )?.color
                }-50 rounded-lg`}
              >
                <div className="flex items-center space-x-2">
                  <Shield
                    className={`h-4 w-4 text-${
                      safetyTypes.find(
                        (t) => t.id === formData.safetyType
                      )?.color
                    }-600`}
                  />
                  <span className="text-sm text-gray-600">
                    {
                      safetyTypes.find(
                        (t) => t.id === formData.safetyType
                      )?.description
                    }
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diagnosis */}
      <div>
        <label
          htmlFor="diagnosis"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Diagnosis
        </label>
        <textarea
          id="diagnosis"
          name="diagnosis"
          value={formData.diagnosis}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
          required
        />
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={goBack}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600"
        >
          Admit Patient
        </button>
      </div>
    </form>
  );
};

export default AdmissionForm;