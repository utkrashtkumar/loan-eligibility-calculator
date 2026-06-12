-- ============================================
-- add-profile-update-message.sql
-- Hand to Hand Fintech Loan Platform
-- Add profile_update_message column to allow custom notes when requesting updates
-- ============================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_update_message TEXT DEFAULT NULL;
