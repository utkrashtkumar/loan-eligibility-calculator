-- ============================================
-- add-profile-update-policy.sql
-- Hand to Hand Fintech Loan Platform
-- Allow authenticated users to update their own profile details
-- ============================================

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
