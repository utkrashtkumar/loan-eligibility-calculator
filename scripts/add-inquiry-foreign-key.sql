-- ============================================
-- add-inquiry-foreign-key.sql
-- Hand to Hand Fintech Loan Platform
-- Add Foreign Key Constraint
-- ============================================

-- Add constraint to allow PostgREST to join user_inquiries and profiles
ALTER TABLE public.user_inquiries 
  DROP CONSTRAINT IF EXISTS fk_user_inquiries_profiles;

ALTER TABLE public.user_inquiries 
  ADD CONSTRAINT fk_user_inquiries_profiles 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE SET NULL;
