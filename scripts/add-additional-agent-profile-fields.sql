-- ============================================
-- add-additional-agent-profile-fields.sql
-- Hand to Hand Fintech Loan Platform
-- Add fields for identity verification 2, selfie, bank details, and cancelled cheque
-- ============================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_type_2 TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_number_2 TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_file_2 TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS selfie TEXT; -- Base64 live selfie
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cancelled_cheque TEXT; -- Base64 cancelled cheque file
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_holder_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_account_no TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bank_ifsc TEXT;
