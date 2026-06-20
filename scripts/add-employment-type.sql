-- =======================================================
-- Add employment_type column to bank_policies and user_inquiries
-- Run this in Supabase SQL Editor
-- =======================================================

-- 1. Add employment_type column to bank_policies
ALTER TABLE bank_policies ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'salaried';

-- 2. Add employment_type column to user_inquiries
ALTER TABLE user_inquiries ADD COLUMN IF NOT EXISTS employment_type TEXT DEFAULT 'salaried';
