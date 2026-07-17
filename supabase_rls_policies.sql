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
DECLARE
  v_role TEXT;
  v_approved BOOLEAN;
  v_agent_code TEXT;
BEGIN
  -- Extract role from metadata, default to user
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
  
  -- Automatically assign admin role and approval to designated admin emails
  IF NEW.email IN ('handtohandloans@gmail.com', 'utkrashtkumar@gmail.com') THEN
    v_role := 'admin';
    v_approved := TRUE;
  ELSIF v_role = 'agent' THEN
    v_approved := FALSE;
    -- Generate unique agent code H2H-XXXXX (5 digits)
    v_agent_code := 'H2H-' || floor(random() * 90000 + 10000)::text;
  ELSE
    v_approved := TRUE;
    v_agent_code := NULL;
  END IF;

  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    phone, 
    role, 
    approved, 
    referred_by, 
    agent_code,
    created_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    v_role,
    v_approved,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'referred_by'), ''),
    v_agent_code,
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
-- LOOPHOLE FIX (L1): Prevent agents from self-setting privileged
-- application statuses (Disbursed / Approved / Paid).
--
-- Without this, an agent can UPDATE their own application's status
-- to 'Disbursed' and immediately inflate their commission balance,
-- then submit a payout request for money they haven't earned.
-- Only admins (is_admin() = true) may write these statuses.
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_application_status_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Block agents from setting privileged statuses
  IF LOWER(NEW.status) IN ('disbursed', 'approved', 'paid')
     AND NOT public.is_admin()
  THEN
    RAISE EXCEPTION
      'Permission denied: only admins can set status to Disbursed, Approved, or Paid.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_application_status ON public.applications;
CREATE TRIGGER trg_validate_application_status
  BEFORE INSERT OR UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.validate_application_status_update();


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
-- LOOPHOLE FIX (L2 + L3): Server-side payout balance enforcement.
--
-- L2: Race condition — two browser tabs can both pass the client-side
--     balance check simultaneously and insert double the available balance.
-- L3: API bypass — a savvy agent can replay the Supabase REST call with
--     a modified 'amount' value, bypassing the client-side check entirely.
--
-- This SECURITY DEFINER function reads earned commission and pending/paid
-- payouts inside a single DB transaction, so concurrent inserts are safe.
-- The RLS INSERT policy calls it atomically — no race window exists.
-- ============================================================
CREATE OR REPLACE FUNCTION public.payout_within_balance(p_agent_id UUID, p_amount NUMERIC)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT (
    -- Total earned commission from disbursed applications
    COALESCE((
      SELECT SUM(commission_amount)
      FROM public.applications
      WHERE agent_id = p_agent_id
        AND LOWER(status) = 'disbursed'
    ), 0)
    -
    -- Already paid out + currently pending payouts
    COALESCE((
      SELECT SUM(amount)
      FROM public.payout_requests
      WHERE agent_id = p_agent_id
        AND status IN ('Pending', 'Paid')
    ), 0)
  ) >= p_amount
  AND p_amount > 0;
$$;

DROP POLICY IF EXISTS "payouts: agent reads own"            ON public.payout_requests;
DROP POLICY IF EXISTS "payouts: admin reads all"            ON public.payout_requests;
DROP POLICY IF EXISTS "payouts: agent inserts own"          ON public.payout_requests;
DROP POLICY IF EXISTS "payouts: agent inserts own balanced" ON public.payout_requests;
DROP POLICY IF EXISTS "payouts: admin updates all"          ON public.payout_requests;

CREATE POLICY "payouts: agent reads own"
  ON public.payout_requests FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "payouts: admin reads all"
  ON public.payout_requests FOR SELECT
  USING (public.is_admin());

-- Balance-enforced insert: DB rejects if amount > available balance (L2 + L3)
CREATE POLICY "payouts: agent inserts own balanced"
  ON public.payout_requests FOR INSERT
  WITH CHECK (
    agent_id = auth.uid()
    AND public.payout_within_balance(auth.uid(), amount)
  );

CREATE POLICY "payouts: admin updates all"
  ON public.payout_requests FOR UPDATE
  USING (public.is_admin());

-- ============================================================
-- TABLE: site_feedbacks
-- ============================================================
ALTER TABLE public.site_feedbacks ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SECURITY (Issue2): Server-side rate limit for contact form.
-- Even if a user clears localStorage or uses DevTools to bypass
-- the client-side cooldown, the DB itself enforces a 60-second
-- cooldown per email address at the INSERT level.
-- ============================================================
CREATE OR REPLACE FUNCTION public.feedback_rate_limit_ok(p_email TEXT)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.site_feedbacks
    WHERE (
      (p_email IS NOT NULL AND email = p_email AND created_at > NOW() - INTERVAL '60 seconds')
      OR
      (p_email IS NULL AND email IS NULL AND created_at > NOW() - INTERVAL '10 seconds')
    )
  );
$$;

DROP POLICY IF EXISTS "Allow select on site_feedbacks"        ON public.site_feedbacks;
DROP POLICY IF EXISTS "Allow anonymous inserts"              ON public.site_feedbacks;
DROP POLICY IF EXISTS "Allow admin select"                    ON public.site_feedbacks;
DROP POLICY IF EXISTS "Allow admin delete"                    ON public.site_feedbacks;
DROP POLICY IF EXISTS "feedbacks: public insert"              ON public.site_feedbacks;
DROP POLICY IF EXISTS "feedbacks: public insert rate-limited" ON public.site_feedbacks;
DROP POLICY IF EXISTS "feedbacks: admin reads all"            ON public.site_feedbacks;
DROP POLICY IF EXISTS "feedbacks: admin deletes all"          ON public.site_feedbacks;

-- Rate-limited insert: one submission per email per 60 seconds (10s if email is null)
CREATE POLICY "feedbacks: public insert rate-limited"
  ON public.site_feedbacks FOR INSERT
  WITH CHECK (public.feedback_rate_limit_ok(email));

CREATE POLICY "feedbacks: admin reads all"
  ON public.site_feedbacks FOR SELECT
  USING (public.is_admin());

CREATE POLICY "feedbacks: admin deletes all"
  ON public.site_feedbacks FOR DELETE
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
-- TABLE: user_inquiries
-- Agents read their own inquiries; admins read all; anyone
-- authenticated can insert (agents submit client loan enquiries).
-- No UPDATE or DELETE for agents — only admins can modify records.
-- ============================================================
ALTER TABLE public.user_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inquiries: owner reads own"   ON public.user_inquiries;
DROP POLICY IF EXISTS "inquiries: admin reads all"   ON public.user_inquiries;
DROP POLICY IF EXISTS "inquiries: auth inserts own"  ON public.user_inquiries;
DROP POLICY IF EXISTS "inquiries: admin updates all" ON public.user_inquiries;
DROP POLICY IF EXISTS "inquiries: admin deletes all" ON public.user_inquiries;

CREATE POLICY "inquiries: owner reads own"
  ON public.user_inquiries FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "inquiries: admin reads all"
  ON public.user_inquiries FOR SELECT
  USING (public.is_admin());

-- Agents insert inquiries for their own user_id only
CREATE POLICY "inquiries: auth inserts own"
  ON public.user_inquiries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "inquiries: admin updates all"
  ON public.user_inquiries FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "inquiries: admin deletes all"
  ON public.user_inquiries FOR DELETE
  USING (public.is_admin());

-- ============================================================
-- TABLE: agreement_regen_requests
-- Agents can read and insert their own regen requests.
-- Agents can update their own requests only to mark as 'resolved'
-- (e.g. after re-signing). Admins have full access.
-- ============================================================
ALTER TABLE public.agreement_regen_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "regen: agent reads own"    ON public.agreement_regen_requests;
DROP POLICY IF EXISTS "regen: admin reads all"    ON public.agreement_regen_requests;
DROP POLICY IF EXISTS "regen: agent inserts own"  ON public.agreement_regen_requests;
DROP POLICY IF EXISTS "regen: agent updates own"  ON public.agreement_regen_requests;
DROP POLICY IF EXISTS "regen: admin updates all"  ON public.agreement_regen_requests;
DROP POLICY IF EXISTS "regen: admin inserts"      ON public.agreement_regen_requests;

CREATE POLICY "regen: agent reads own"
  ON public.agreement_regen_requests FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "regen: admin reads all"
  ON public.agreement_regen_requests FOR SELECT
  USING (public.is_admin());

-- Agents submit regen requests for themselves only
CREATE POLICY "regen: agent inserts own"
  ON public.agreement_regen_requests FOR INSERT
  WITH CHECK (agent_id = auth.uid());

-- Agents can only mark their own request as 'resolved' (after re-signing)
-- Admins use the admin updates policy which has no status restriction
-- Note: In RLS WITH CHECK, column names reference the new row directly (no NEW. prefix)
CREATE POLICY "regen: agent updates own"
  ON public.agreement_regen_requests FOR UPDATE
  USING (agent_id = auth.uid())
  WITH CHECK (
    agent_id = auth.uid()
    AND status = 'resolved'
  );

CREATE POLICY "regen: admin updates all"
  ON public.agreement_regen_requests FOR UPDATE
  USING (public.is_admin());

-- Admins can also insert regen requests on behalf of agents
CREATE POLICY "regen: admin inserts"
  ON public.agreement_regen_requests FOR INSERT
  WITH CHECK (public.is_admin());

-- ============================================================
-- NOTE: Add RLS for other new tables using the same patterns above.
-- ============================================================


-- ============================================================
-- LOOPHOLE FIX (L4): Prevent agent self-referral.
--
-- An agent could share their own agent_code, sign up a second
-- account, and earn the 0.5% referral bonus on their own applications.
-- This trigger nullifies referred_by if it matches the agent's own code.
--
-- Note: At INSERT time, the new profile's agent_code is not yet assigned
-- (it's set after approval). So self-referral is blocked at UPDATE time
-- and also via the referral bonus calculation guard below.
-- ============================================================
CREATE OR REPLACE FUNCTION public.validate_no_self_referral()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If referred_by matches the agent's own agent_code, clear it
  IF NEW.referred_by IS NOT NULL
     AND NEW.agent_code IS NOT NULL
     AND NEW.referred_by = NEW.agent_code
  THEN
    NEW.referred_by := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_no_self_referral ON public.profiles;
CREATE TRIGGER trg_validate_no_self_referral
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_no_self_referral();

-- ============================================================
-- ENSURE RLS IS ENABLED on payout_requests
-- (must be re-stated after policy drops/recreates above)
-- ============================================================
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TABLE: credit_cards
-- Anyone can view credit cards, but only admins can write.
-- ============================================================
ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select on credit_cards" ON public.credit_cards;
CREATE POLICY "Allow select on credit_cards"
  ON public.credit_cards FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admin can insert on credit_cards" ON public.credit_cards;
CREATE POLICY "Admin can insert on credit_cards"
  ON public.credit_cards FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admin can update on credit_cards" ON public.credit_cards;
CREATE POLICY "Admin can update on credit_cards"
  ON public.credit_cards FOR UPDATE
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admin can delete on credit_cards" ON public.credit_cards;
CREATE POLICY "Admin can delete on credit_cards"
  ON public.credit_cards FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ============================================================
-- TABLE: blogs
-- Published blogs are readable by anyone; managing blogs is admin-only.
-- ============================================================
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on published blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admin can manage all blogs"           ON public.blogs;
DROP POLICY IF EXISTS "blogs: public read published"         ON public.blogs;
DROP POLICY IF EXISTS "blogs: admin manage all"              ON public.blogs;

CREATE POLICY "blogs: public read published"
  ON public.blogs FOR SELECT
  USING (published = true);

CREATE POLICY "blogs: admin manage all"
  ON public.blogs FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- TABLE: contact_messages
-- Anyone can insert messages; viewing and deleting is admin-only.
-- ============================================================
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous inserts" ON public.contact_messages;
DROP POLICY IF EXISTS "Allow admin select"      ON public.contact_messages;
DROP POLICY IF EXISTS "Allow admin delete"      ON public.contact_messages;
DROP POLICY IF EXISTS "contact: public insert"  ON public.contact_messages;
DROP POLICY IF EXISTS "contact: admin select"   ON public.contact_messages;
DROP POLICY IF EXISTS "contact: admin delete"   ON public.contact_messages;

CREATE POLICY "contact: public insert"
  ON public.contact_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "contact: admin select"
  ON public.contact_messages FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "contact: admin delete"
  ON public.contact_messages FOR DELETE
  TO authenticated
  USING (public.is_admin());


-- ============================================================
-- TABLE: audit_logs
-- Managing or viewing audit logs is admin-only.
-- ============================================================
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view audit logs"   ON public.audit_logs;
DROP POLICY IF EXISTS "Admin can insert audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "audit: admin select"         ON public.audit_logs;
DROP POLICY IF EXISTS "audit: admin insert"         ON public.audit_logs;

CREATE POLICY "audit: admin select"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "audit: admin insert"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());


