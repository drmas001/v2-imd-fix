import React from 'react';
import { User } from 'lucide-react';

interface DoctorDisplayProps {
  doctor?: {
    id?: number;
    name: string;
    medical_code?: string;
    role?: 'doctor' | 'nurse' | 'administrator';
    department?: string;
  } | null;
  showIcon?: boolean;
  className?: string;
  label?: string;
}

const DoctorDisplay: React.FC<DoctorDisplayProps> = ({ 
  doctor, 
  showIcon = false, 
  className = '',
  label = 'Assigned Doctor'
}) => {
  if (!doctor || !doctor.name) {
    return (
      <div className={`text-sm text-gray-500 italic flex items-center space-x-2 ${className}`}>
        {showIcon && <User className="h-5 w-5 text-gray-400" />}
        <span>No doctor assigned</span>
      </div>
    );
  }

  const { name, medical_code, role, department } = doctor;
  const roleDisplay = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Doctor';

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <div className="text-sm text-gray-600">{label}</div>
      )}
      <div className="flex items-center space-x-2">
        {showIcon && <User className="h-5 w-5 text-gray-400" />}
        <div>
          <div className="font-medium text-gray-900">
            {roleDisplay} {name}
            {medical_code && <span className="ml-1 text-gray-500">({medical_code})</span>}
          </div>
          {department && <div className="text-sm text-gray-600">{department}</div>}
        </div>
      </div>
    </div>
  );
};

export default DoctorDisplay;