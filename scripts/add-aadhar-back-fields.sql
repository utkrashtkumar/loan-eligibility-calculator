-- ============================================
-- add-aadhar-back-fields.sql
-- Hand to Hand Fintech Loan Platform
-- Add fields for back of identity documents (Aadhaar Card)
-- ============================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_file_back TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_file_2_back TEXT;
