-- Remove doctor_name column from consultations table
ALTER TABLE consultations DROP COLUMN IF EXISTS doctor_name; 