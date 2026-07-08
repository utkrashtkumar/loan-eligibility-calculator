-- ============================================
-- setup-credit-cards.sql
-- Hand to Hand Fintech Loan Platform
-- Database Migration Script for Credit Cards
-- ============================================

CREATE TABLE IF NOT EXISTS public.credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL,
  logo_url TEXT, -- Can be external URL or base64 encoded image
  apply_url TEXT,
  pdf_url TEXT, -- Can be external URL or base64 encoded PDF
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure unique constraint exists on bank_name (handles existing table modifications)
ALTER TABLE public.credit_cards DROP CONSTRAINT IF EXISTS credit_cards_bank_name_key;
ALTER TABLE public.credit_cards ADD CONSTRAINT credit_cards_bank_name_key UNIQUE (bank_name);

-- Enable Row Level Security (RLS)
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

-- 1. Select policy: Anyone (public, guests, agents, customers) can read credit cards
DROP POLICY IF EXISTS "Allow select on credit_cards" ON public.credit_cards;
CREATE POLICY "Allow select on credit_cards"
  ON public.credit_cards FOR SELECT
  USING (true);

-- 2. Insert policy: Only admins can insert new credit cards
DROP POLICY IF EXISTS "Admin can insert on credit_cards" ON public.credit_cards;
CREATE POLICY "Admin can insert on credit_cards" 
  ON public.credit_cards FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.jwt() ->> 'email' IN ('handtohandloans@gmail.com', 'utkrashtkumar@gmail.com'));

-- 3. Update policy: Only admins can update existing credit cards
DROP POLICY IF EXISTS "Admin can update on credit_cards" ON public.credit_cards;
CREATE POLICY "Admin can update on credit_cards" 
  ON public.credit_cards FOR UPDATE 
  TO authenticated 
  USING (auth.jwt() ->> 'email' IN ('handtohandloans@gmail.com', 'utkrashtkumar@gmail.com'));

-- 4. Delete policy: Only admins can delete credit cards
DROP POLICY IF EXISTS "Admin can delete on credit_cards" ON public.credit_cards;
CREATE POLICY "Admin can delete on credit_cards" 
  ON public.credit_cards FOR DELETE 
  TO authenticated 
  USING (auth.jwt() ->> 'email' IN ('handtohandloans@gmail.com', 'utkrashtkumar@gmail.com'));

-- 5. Seed initial credit cards data
INSERT INTO public.credit_cards (bank_name, apply_url) VALUES
('IndusInd', 'https://spectrum.gotrackier.com/click?campaign_id=108&pub_id=2416'),
('TATA Neu HDFC Bank CC', 'https://spectrum.gotrackier.com/click?campaign_id=1201&pub_id=2416'),
('AXIS', 'https://spectrum.gotrackier.com/click?campaign_id=164&pub_id=2416'),
('SBI', 'https://spectrum.gotrackier.com/click?campaign_id=130&pub_id=2416'),
('IDFC', 'https://spectrum.gotrackier.com/click?campaign_id=384&pub_id=2416'),
('Jupiter', 'https://spectrum.gotrackier.com/click?campaign_id=1750&pub_id=2416')
ON CONFLICT (bank_name) DO UPDATE 
SET apply_url = EXCLUDED.apply_url;
