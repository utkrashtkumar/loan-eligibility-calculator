-- ============================================
-- SQL Migration to add utkrashtkumar@gmail.com as Admin
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Update public.profiles policies
DROP POLICY IF EXISTS "Admin can manage all profiles" ON public.profiles;
CREATE POLICY "Admin can manage all profiles"
  ON public.profiles FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' IN ('handtohandloans@gmail.com', 'utkrashtkumar@gmail.com'));

-- 2. Update public.applications policies
DROP POLICY IF EXISTS "Admin can manage all applications" ON public.applications;
CREATE POLICY "Admin can manage all applications"
  ON public.applications FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' IN ('handtohandloans@gmail.com', 'utkrashtkumar@gmail.com'));

-- 3. Update public.payout_requests policies
DROP POLICY IF EXISTS "Admin can manage all payout requests" ON public.payout_requests;
CREATE POLICY "Admin can manage all payout requests"
  ON public.payout_requests FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' IN ('handtohandloans@gmail.com', 'utkrashtkumar@gmail.com'));

-- 4. Update public.user_inquiries policies
DROP POLICY IF EXISTS "Allow admin to read all inquiries" ON public.user_inquiries;
CREATE POLICY "Allow admin to read all inquiries"
  ON public.user_inquiries FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' IN ('handtohandloans@gmail.com', 'utkrashtkumar@gmail.com'));

DROP POLICY IF EXISTS "Allow admin to delete inquiries" ON public.user_inquiries;
CREATE POLICY "Allow admin to delete inquiries"
  ON public.user_inquiries FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' IN ('handtohandloans@gmail.com', 'utkrashtkumar@gmail.com'));

-- 5. Update public.contact_messages policies
DROP POLICY IF EXISTS "Allow admin select" ON public.contact_messages;
CREATE POLICY "Allow admin select"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' IN ('handtohandloans@gmail.com', 'utkrashtkumar@gmail.com'));

DROP POLICY IF EXISTS "Allow admin delete" ON public.contact_messages;
CREATE POLICY "Allow admin delete"
  ON public.contact_messages FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' IN ('handtohandloans@gmail.com', 'utkrashtkumar@gmail.com'));
