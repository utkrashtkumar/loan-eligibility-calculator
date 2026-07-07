-- ============================================================
-- SQL Migration to fix Admin Policies for Agreements & Requests
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Update public.agent_agreements admin policy to use JWT email checks
DROP POLICY IF EXISTS "Allow admins to manage all agreements" ON public.agent_agreements;
CREATE POLICY "Allow admins to manage all agreements"
  ON public.agent_agreements FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' IN ('handtohandloans@gmail.com', 'utkrashtkumar@gmail.com'));

-- 2. Update public.agreement_regen_requests admin policy to use JWT email checks
DROP POLICY IF EXISTS "Allow admins to manage all requests" ON public.agreement_regen_requests;
CREATE POLICY "Allow admins to manage all requests"
  ON public.agreement_regen_requests FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' IN ('handtohandloans@gmail.com', 'utkrashtkumar@gmail.com'));
