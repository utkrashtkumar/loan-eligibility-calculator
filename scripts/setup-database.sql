-- ============================================
-- Loan Eligibility Checker - Database Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Bank Policies Table
CREATE TABLE IF NOT EXISTS bank_policies (
  id SERIAL PRIMARY KEY,
  bank_name TEXT NOT NULL UNIQUE,
  min_age INTEGER DEFAULT 21,
  max_age INTEGER DEFAULT 60,
  min_cibil INTEGER NOT NULL,
  min_salary INTEGER NOT NULL,
  company_category TEXT DEFAULT 'ALL TYPES',
  pf_required TEXT DEFAULT 'No',
  foir_max NUMERIC(5,2) NOT NULL,
  min_experience TEXT DEFAULT '1 Year',
  min_residence_stability TEXT DEFAULT '1+ Year',
  loan_type TEXT DEFAULT 'PL',
  all_pincodes BOOLEAN DEFAULT false,
  special_notes TEXT,
  logo_url TEXT,
  employment_type TEXT DEFAULT 'salaried',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bank Pincodes Table
CREATE TABLE IF NOT EXISTS bank_pincodes (
  id SERIAL PRIMARY KEY,
  bank_name TEXT NOT NULL,
  pincode TEXT NOT NULL,
  city TEXT,
  state TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_bank_pincodes_pincode ON bank_pincodes(pincode);
CREATE INDEX IF NOT EXISTS idx_bank_pincodes_bank ON bank_pincodes(bank_name);
CREATE INDEX IF NOT EXISTS idx_bank_pincodes_bank_pincode ON bank_pincodes(bank_name, pincode);

-- 3. User Inquiries Table (for lead tracking)
CREATE TABLE IF NOT EXISTS user_inquiries (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  current_address TEXT,
  permanent_address TEXT,
  pincode TEXT NOT NULL,
  salary INTEGER NOT NULL,
  existing_emi INTEGER DEFAULT 0,
  credit_score INTEGER NOT NULL,
  eligible_banks TEXT[],
  employment_type TEXT DEFAULT 'salaried',
  dob TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Row Level Security (RLS)
-- Enable RLS on all tables
ALTER TABLE bank_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_pincodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inquiries ENABLE ROW LEVEL SECURITY;

-- Allow public read access to policies and pincodes
CREATE POLICY "Allow public read on bank_policies" 
  ON bank_policies FOR SELECT 
  USING (true);

CREATE POLICY "Allow public read on bank_pincodes" 
  ON bank_pincodes FOR SELECT 
  USING (true);

-- Allow public insert on user_inquiries (for saving leads)
CREATE POLICY "Allow public insert on user_inquiries" 
  ON user_inquiries FOR INSERT 
  WITH CHECK (true);

-- Allow public insert on bank_policies (for migration)
CREATE POLICY "Allow public insert on bank_policies" 
  ON bank_policies FOR INSERT 
  WITH CHECK (true);

-- Allow public insert on bank_pincodes (for migration)
CREATE POLICY "Allow public insert on bank_pincodes" 
  ON bank_pincodes FOR INSERT 
  WITH CHECK (true);

-- Allow upsert on bank_policies (for migration)
CREATE POLICY "Allow public update on bank_policies" 
  ON bank_policies FOR UPDATE 
  USING (true);

-- Allow delete for migration reset
CREATE POLICY "Allow public delete on bank_policies"
  ON bank_policies FOR DELETE
  USING (true);

CREATE POLICY "Allow public delete on bank_pincodes"
  ON bank_pincodes FOR DELETE
  USING (true);

-- Allow admin to delete user inquiries
CREATE POLICY "Allow admin to delete inquiries"
  ON user_inquiries FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'handtohandloans@gmail.com');
