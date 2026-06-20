-- ============================================
-- add-contact-mobile.sql
-- Hand to Hand Fintech Loan Platform
-- Add mobile column to contact_messages table
-- ============================================

ALTER TABLE public.contact_messages ADD COLUMN IF NOT EXISTS mobile TEXT;
