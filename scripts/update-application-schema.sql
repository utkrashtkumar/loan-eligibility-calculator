-- ============================================
-- update-application-schema.sql
-- Hand to Hand Fintech Loan Platform
-- Add problem column and update status check constraint
-- ============================================

-- 1. Add problem column if not exists
ALTER TABLE public.applications ADD COLUMN IF NOT EXISTS problem TEXT;

-- 2. Drop existing constraint if it exists (check name applications_status_check)
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_status_check;

-- 3. Add updated constraint to support lowercase status options
ALTER TABLE public.applications ADD CONSTRAINT applications_status_check CHECK (
  status IN (
    'Applied', 'In Progress', 'Approved', 'Disbursed', 'Rejected',
    'applied', 'in process', 'kyc verification', 'disbursed', 'rejected'
  )
);
