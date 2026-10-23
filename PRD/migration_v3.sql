-- Migration: Add withdraw_date to tournaments table to enforce withdrawal deadlines
ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS withdraw_date DATE;
