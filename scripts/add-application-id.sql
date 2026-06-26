-- ============================================
-- add-application-id.sql
-- Hand to Hand Fintech Loan Platform
-- Migration to add unique application ID
-- ============================================

-- 1. Add application_id column to public.applications
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS application_id TEXT;

-- 2. Create a unique index for application_id (excluding NULLs to avoid conflicts with old records)
CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_application_id 
  ON public.applications (application_id) 
  WHERE application_id IS NOT NULL;
