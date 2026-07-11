-- ============================================================
-- HandToHand Loans — Supabase Row Level Security (RLS) Policies
-- Run this entire script in: Supabase Dashboard -> SQL Editor
-- IDEMPOTENT: Safe to re-run multiple times without errors.
-- ============================================================

-- HOW TO RUN:
--   1. Go to https://app.supabase.com -> your project
--   2. Click "SQL Editor" in the left sidebar
--   3. Paste the entire contents of this file
--   4. Click "Run"

-- ============================================================
-- SECURITY (F1): Auth Trigger - Prevent Role Self-Elevation
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, phone, role, approved, referred_by, created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'user',
    false,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'referred_by'), ''),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SECURITY: is_admin() helper — bypasses RLS to check admin role.
-- ============================================================
-- WHY THIS EXISTS:
--   Policies like "admin can read all" need to check profiles.role = 'admin'.
--   If that check is a subquery on profiles itself, Postgres enters infinite
--   recursion (RLS policy triggers itself). SECURITY DEFINER runs as the
--   function owner (postgres) which bypasses RLS entirely, breaking the loop.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================
-- TABLE: profiles
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles: owner can read own"   ON public.profiles;
DROP POLICY IF EXISTS "profiles: admins can read all"  ON public.profiles;
DROP POLICY IF EXISTS "profiles: owner can update own" ON public.profiles;
DROP POLICY IF EXISTS "profiles: service role insert"  ON public.profiles;

CREATE POLICY "profiles: owner can read own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Use is_admin() instead of subquery to avoid infinite RLS recursion
CREATE POLICY "profiles: admins can read all"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "profiles: owner can update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: service role insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- TABLE: applications
-- ============================================================
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "applications: agent reads own"   ON public.applications;
DROP POLICY IF EXISTS "applications: admin reads all"   ON public.applications;
DROP POLICY IF EXISTS "applications: agent inserts own" ON public.applications;
DROP POLICY IF EXISTS "applications: agent updates own" ON public.applications;
DROP POLICY IF EXISTS "applications: agent deletes own" ON public.applications;
DROP POLICY IF EXISTS "applications: admin updates all" ON public.applications;

CREATE POLICY "applications: agent reads own"
  ON public.applications FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "applications: admin reads all"
  ON public.applications FOR SELECT
  USING (public.is_admin());

CREATE POLICY "applications: agent inserts own"
  ON public.applications FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "applications: agent updates own"
  ON public.applications FOR UPDATE
  USING (agent_id = auth.uid())
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "applications: agent deletes own"
  ON public.applications FOR DELETE
  USING (agent_id = auth.uid());

CREATE POLICY "applications: admin updates all"
  ON public.applications FOR UPDATE
  USING (public.is_admin());

-- Commission enforcement
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS chk_commission_rate;
ALTER TABLE public.applications ADD CONSTRAINT chk_commission_rate CHECK (commission_rate = 2.00);

CREATE OR REPLACE FUNCTION public.enforce_commission()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.commission_rate   := 2.00;
  NEW.commission_amount := NEW.loan_amount * 0.02;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_commission ON public.applications;
CREATE TRIGGER trg_enforce_commission
  BEFORE INSERT OR UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.enforce_commission();

-- ============================================================
-- TABLE: agent_agreements
-- ============================================================
ALTER TABLE public.agent_agreements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agreements: agent reads own"               ON public.agent_agreements;
DROP POLICY IF EXISTS "agreements: admin reads all"               ON public.agent_agreements;
DROP POLICY IF EXISTS "agreements: public verify by agreement_no" ON public.agent_agreements;

CREATE POLICY "agreements: agent reads own"
  ON public.agent_agreements FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "agreements: admin reads all"
  ON public.agent_agreements FOR SELECT
  USING (public.is_admin());

CREATE POLICY "agreements: public verify by agreement_no"
  ON public.agent_agreements FOR SELECT
  USING (true);

-- ============================================================
-- TABLE: notifications
-- ============================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications: agent reads own"   ON public.notifications;
DROP POLICY IF EXISTS "notifications: admin reads all"   ON public.notifications;
DROP POLICY IF EXISTS "notifications: agent updates own" ON public.notifications;
DROP POLICY IF EXISTS "notifications: admin updates all" ON public.notifications;
DROP POLICY IF EXISTS "notifications: agent deletes own" ON public.notifications;
DROP POLICY IF EXISTS "notifications: admin deletes all" ON public.notifications;

CREATE POLICY "notifications: agent reads own"
  ON public.notifications FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "notifications: admin reads all"
  ON public.notifications FOR SELECT
  USING (public.is_admin());

CREATE POLICY "notifications: agent updates own"
  ON public.notifications FOR UPDATE
  USING (agent_id = auth.uid());

CREATE POLICY "notifications: admin updates all"
  ON public.notifications FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "notifications: agent deletes own"
  ON public.notifications FOR DELETE
  USING (agent_id = auth.uid());

CREATE POLICY "notifications: admin deletes all"
  ON public.notifications FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- TABLE: payout_requests
-- ============================================================
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payouts: agent reads own"   ON public.payout_requests;
DROP POLICY IF EXISTS "payouts: admin reads all"   ON public.payout_requests;
DROP POLICY IF EXISTS "payouts: agent inserts own" ON public.payout_requests;
DROP POLICY IF EXISTS "payouts: admin updates all" ON public.payout_requests;

CREATE POLICY "payouts: agent reads own"
  ON public.payout_requests FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "payouts: admin reads all"
  ON public.payout_requests FOR SELECT
  USING (public.is_admin());

CREATE POLICY "payouts: agent inserts own"
  ON public.payout_requests FOR INSERT
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "payouts: admin updates all"
  ON public.payout_requests FOR UPDATE
  USING (public.is_admin());

-- ============================================================
-- TABLE: site_feedbacks
-- ============================================================
ALTER TABLE public.site_feedbacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feedbacks: public insert"   ON public.site_feedbacks;
DROP POLICY IF EXISTS "feedbacks: admin reads all" ON public.site_feedbacks;

CREATE POLICY "feedbacks: public insert"
  ON public.site_feedbacks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "feedbacks: admin reads all"
  ON public.site_feedbacks FOR SELECT
  USING (public.is_admin());

-- ============================================================
-- TABLE: bank_policies
-- ============================================================
ALTER TABLE public.bank_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bank_policies: public read" ON public.bank_policies;

CREATE POLICY "bank_policies: public read"
  ON public.bank_policies FOR SELECT
  USING (true);

REVOKE SELECT (portal_password) ON public.bank_policies FROM anon;
REVOKE SELECT (portal_password) ON public.bank_policies FROM authenticated;

-- ============================================================
-- NOTE: Add RLS for other tables (user_inquiries, leaderboard, etc.)
-- using the same patterns above.
-- ============================================================
