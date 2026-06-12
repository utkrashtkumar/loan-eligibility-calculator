-- ============================================
-- add-profile-lock.sql
-- Hand to Hand Fintech Loan Platform
-- Add lock column to allow admin to lock agent profile edits
-- ============================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_locked BOOLEAN DEFAULT FALSE;
