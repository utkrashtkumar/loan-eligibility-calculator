-- SQL Migration script to setup Agent Agreements table and RLS policies

CREATE TABLE IF NOT EXISTS public.agent_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  agreement_no TEXT NOT NULL UNIQUE,
  signature_base64 TEXT NOT NULL, -- stores the agent's base64 encoded uploaded signature
  status TEXT NOT NULL DEFAULT 'active', -- active, revoked, terminated
  created_at TIMESTAMPTZ DEFAULT now(),
  signed_at TIMESTAMPTZ DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT
);

-- Enable RLS
ALTER TABLE public.agent_agreements ENABLE ROW LEVEL SECURITY;

-- 1. Create policy to allow authenticated agents to view their own agreements
DROP POLICY IF EXISTS "Allow agents to view their own agreements" ON public.agent_agreements;
CREATE POLICY "Allow agents to view their own agreements" 
ON public.agent_agreements FOR SELECT 
TO authenticated 
USING (auth.uid() = agent_id);

-- 2. Create policy to allow authenticated agents to sign/insert their own agreement
DROP POLICY IF EXISTS "Allow agents to insert their own agreements" ON public.agent_agreements;
CREATE POLICY "Allow agents to insert their own agreements" 
ON public.agent_agreements FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = agent_id);

-- 3. Create policy to allow public/anonymous users to read agreements (for QR code verification)
DROP POLICY IF EXISTS "Allow public read of agreements for verification" ON public.agent_agreements;
CREATE POLICY "Allow public read of agreements for verification" 
ON public.agent_agreements FOR SELECT 
TO anon, authenticated 
USING (true);

-- 4. Create policy to allow authenticated agents to delete their own agreements (required for re-sign reset)
DROP POLICY IF EXISTS "Allow agents to delete their own agreements" ON public.agent_agreements;
CREATE POLICY "Allow agents to delete their own agreements" 
ON public.agent_agreements FOR DELETE 
TO authenticated 
USING (auth.uid() = agent_id);

-- 5. Create policy to allow authenticated agents to update their own agreements
DROP POLICY IF EXISTS "Allow agents to update their own agreements" ON public.agent_agreements;
CREATE POLICY "Allow agents to update their own agreements" 
ON public.agent_agreements FOR UPDATE 
TO authenticated 
USING (auth.uid() = agent_id)
WITH CHECK (auth.uid() = agent_id);

-- 6. Create policy to allow admin users to manage all agreements
DROP POLICY IF EXISTS "Allow admins to manage all agreements" ON public.agent_agreements;
CREATE POLICY "Allow admins to manage all agreements" 
ON public.agent_agreements FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Index for fast lookup by agreement number (QR code scans)
CREATE INDEX IF NOT EXISTS idx_agent_agreements_no ON public.agent_agreements(agreement_no);
