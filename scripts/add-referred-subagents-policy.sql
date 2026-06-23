-- ============================================
-- add-referred-subagents-policy.sql
-- Hand to Hand Fintech Loan Platform
-- Add policy to allow agents to view their recruited sub-agents
-- ============================================

-- Helper function to get current user's agent code securely without causing RLS recursion
CREATE OR REPLACE FUNCTION public.get_current_agent_code()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT agent_code FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy to allow agents to select profiles of users referred by them
DROP POLICY IF EXISTS "Agents can view referred sub-agents" ON public.profiles;
CREATE POLICY "Agents can view referred sub-agents"
  ON public.profiles FOR SELECT
  USING (
    auth.role() = 'authenticated'
    AND referred_by = public.get_current_agent_code()
  );
