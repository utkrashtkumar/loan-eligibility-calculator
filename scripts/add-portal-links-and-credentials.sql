-- ============================================
-- add-portal-links-and-credentials.sql
-- Hand to Hand Fintech Loan Platform
-- Database Migration Script
-- ============================================

-- Add columns to public.bank_policies table
ALTER TABLE public.bank_policies ADD COLUMN IF NOT EXISTS apply_url TEXT;
ALTER TABLE public.bank_policies ADD COLUMN IF NOT EXISTS portal_username TEXT;
ALTER TABLE public.bank_policies ADD COLUMN IF NOT EXISTS portal_password TEXT;
ALTER TABLE public.bank_policies ADD COLUMN IF NOT EXISTS direct_submit BOOLEAN DEFAULT FALSE;
