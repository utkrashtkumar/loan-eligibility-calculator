-- ============================================
-- Loan Eligibility Checker - Database Alteration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Add user_id column linking to auth.users
ALTER TABLE user_inquiries ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Enable Row Level Security (if not already enabled)
ALTER TABLE user_inquiries ENABLE ROW LEVEL SECURITY;

-- 3. Clean up existing policies for user_inquiries
DROP POLICY IF EXISTS "Allow public insert on user_inquiries" ON user_inquiries;
DROP POLICY IF EXISTS "Allow users to read their own inquiries" ON user_inquiries;
DROP POLICY IF EXISTS "Allow admin to read all inquiries" ON user_inquiries;

-- 4. Re-create secure policies

-- Policy A: Anyone can insert (so people can fill out the form)
CREATE POLICY "Allow public insert on user_inquiries" 
  ON user_inquiries FOR INSERT 
  WITH CHECK (true);

-- Policy B: Users can read only their own saved inquiries
CREATE POLICY "Allow users to read their own inquiries"
  ON user_inquiries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy C: Admin (utkrashtkumar@gmail.com) can read all inquiries
-- Uses auth.jwt() which is secure and does not query auth.users directly (avoids permission issues)
CREATE POLICY "Allow admin to read all inquiries"
  ON user_inquiries FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'utkrashtkumar@gmail.com');
