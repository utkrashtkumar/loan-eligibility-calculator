-- ============================================
-- add-check-user-exists-rpc.sql
-- Hand to Hand Fintech Loan Platform
-- Add check_user_exists RPC function to bypass SELECT RLS policies securely during signup
-- ============================================

CREATE OR REPLACE FUNCTION public.check_user_exists(p_email TEXT, p_phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE email = p_email OR phone = p_phone
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
