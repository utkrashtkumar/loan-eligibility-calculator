-- ============================================
-- add-profile-fields.sql
-- Hand to Hand Fintech Loan Platform
-- Add fields for profile picture, ID verification, and demoted log details
-- ============================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dob TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fathers_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permanent_address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marital_status TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar TEXT; -- Base64 profile pic
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_type TEXT; -- Aadhaar, PAN, etc.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_number TEXT; -- Identity proof ID
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS id_file TEXT; -- Base64 Identity document
