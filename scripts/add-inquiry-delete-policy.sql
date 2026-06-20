-- ============================================
-- add-inquiry-delete-policy.sql
-- Hand to Hand Fintech Loan Platform
-- Allow admin to delete user inquiries
-- ============================================

DROP POLICY IF EXISTS "Allow admin to delete inquiries" ON public.user_inquiries;

CREATE POLICY "Allow admin to delete inquiries"
  ON public.user_inquiries FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'utkrashtkumar@gmail.com');
