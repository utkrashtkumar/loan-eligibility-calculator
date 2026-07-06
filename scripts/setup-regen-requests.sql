-- SQL Migration script to setup Agreement Regen Requests table and RLS policies
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.agreement_regen_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_by TEXT NOT NULL, -- 'agent' or 'admin'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'resolved'
  reason TEXT,
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Drop the old status check constraint if it exists and recreate it to include 'resolved'
ALTER TABLE public.agreement_regen_requests DROP CONSTRAINT IF EXISTS agreement_regen_requests_status_check;
ALTER TABLE public.agreement_regen_requests ADD CONSTRAINT agreement_regen_requests_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'resolved'));

-- Enable RLS
ALTER TABLE public.agreement_regen_requests ENABLE ROW LEVEL SECURITY;

-- 1. Create policy to allow authenticated agents to view their own requests
DROP POLICY IF EXISTS "Allow agents to view their own requests" ON public.agreement_regen_requests;
CREATE POLICY "Allow agents to view their own requests" 
ON public.agreement_regen_requests FOR SELECT 
TO authenticated 
USING (auth.uid() = agent_id);

-- 2. Create policy to allow authenticated agents to submit/insert their own requests
DROP POLICY IF EXISTS "Allow agents to insert their own requests" ON public.agreement_regen_requests;
CREATE POLICY "Allow agents to insert their own requests" 
ON public.agreement_regen_requests FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = agent_id);

-- 3. Create policy to allow authenticated agents to update their own requests (status resolved)
DROP POLICY IF EXISTS "Allow agents to update their own requests" ON public.agreement_regen_requests;
CREATE POLICY "Allow agents to update their own requests" 
ON public.agreement_regen_requests FOR UPDATE 
TO authenticated 
USING (auth.uid() = agent_id)
WITH CHECK (auth.uid() = agent_id);

-- 4. Create policy to allow admin users to manage all requests
DROP POLICY IF EXISTS "Allow admins to manage all requests" ON public.agreement_regen_requests;
CREATE POLICY "Allow admins to manage all requests" 
ON public.agreement_regen_requests FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);
