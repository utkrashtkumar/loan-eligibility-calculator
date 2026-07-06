-- SQL Migration script to setup Admin Activity Notifications via Triggers
-- Run this in your Supabase SQL Editor

-- 1. Add extra metadata columns to the public.notifications table
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS activity_type TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS reference_id TEXT;

-- 2. Create Delete policy for Admins (if not exists)
DROP POLICY IF EXISTS "Admins can delete notifications" ON public.notifications;
CREATE POLICY "Admins can delete notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN ('handtohandloans@gmail.com', 'utkrashtkumar@gmail.com')
  );

-- 3. Create Trigger function to log agent activities
CREATE OR REPLACE FUNCTION public.create_admin_activity_notification()
RETURNS TRIGGER AS $$
DECLARE
  agent_name TEXT;
  msg TEXT;
  t_title TEXT;
  act_type TEXT;
  ref_id TEXT;
  ag_id UUID;
BEGIN
  IF TG_TABLE_NAME = 'profiles' THEN
    IF TG_OP = 'INSERT' AND NEW.role = 'agent' THEN
      ag_id := NEW.id;
      t_title := 'New Agent Registration';
      msg := NEW.full_name || ' (' || NEW.email || ') has registered as an agent and is pending approval.';
      act_type := 'registration';
      ref_id := NEW.id::text;
    ELSE
      RETURN NEW;
    END IF;

  ELSIF TG_TABLE_NAME = 'applications' THEN
    IF TG_OP = 'INSERT' THEN
      ag_id := NEW.agent_id;
      SELECT full_name INTO agent_name FROM public.profiles WHERE id = NEW.agent_id;
      t_title := 'New Client Application';
      msg := COALESCE(agent_name, 'An agent') || ' submitted a new loan application for ' || NEW.client_name || ' (Amount: ₹' || NEW.loan_amount || ')';
      act_type := 'application';
      ref_id := NEW.id::text;
    ELSE
      RETURN NEW;
    END IF;

  ELSIF TG_TABLE_NAME = 'payout_requests' THEN
    IF TG_OP = 'INSERT' THEN
      ag_id := NEW.agent_id;
      SELECT full_name INTO agent_name FROM public.profiles WHERE id = NEW.agent_id;
      t_title := 'Payout Requested';
      msg := COALESCE(agent_name, 'An agent') || ' requested a payout of ₹' || NEW.amount;
      act_type := 'payout';
      ref_id := NEW.id::text;
    ELSE
      RETURN NEW;
    END IF;

  ELSIF TG_TABLE_NAME = 'agent_agreements' THEN
    IF TG_OP = 'INSERT' THEN
      ag_id := NEW.agent_id;
      SELECT full_name INTO agent_name FROM public.profiles WHERE id = NEW.agent_id;
      t_title := 'Agreement Signed';
      msg := COALESCE(agent_name, 'An agent') || ' signed their DSA Partner Agreement (' || NEW.agreement_no || ').';
      act_type := 'agreement';
      ref_id := NEW.agent_id::text;
    ELSE
      RETURN NEW;
    END IF;

  ELSIF TG_TABLE_NAME = 'agreement_regen_requests' THEN
    IF TG_OP = 'INSERT' AND NEW.requested_by = 'agent' THEN
      ag_id := NEW.agent_id;
      SELECT full_name INTO agent_name FROM public.profiles WHERE id = NEW.agent_id;
      t_title := 'Re-sign Requested';
      msg := COALESCE(agent_name, 'An agent') || ' requested permission to re-sign: "' || COALESCE(NEW.reason, '') || '"';
      act_type := 'resign';
      ref_id := NEW.agent_id::text;
    ELSE
      RETURN NEW;
    END IF;

  ELSE
    RETURN NEW;
  END IF;

  -- Insert notification into public.notifications
  INSERT INTO public.notifications (agent_id, title, message, activity_type, reference_id)
  VALUES (ag_id, t_title, msg, act_type, ref_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS trigger_profile_registration_notify ON public.profiles;
DROP TRIGGER IF EXISTS trigger_application_submit_notify ON public.applications;
DROP TRIGGER IF EXISTS trigger_payout_request_notify ON public.payout_requests;
DROP TRIGGER IF EXISTS trigger_agreement_sign_notify ON public.agent_agreements;
DROP TRIGGER IF EXISTS trigger_resign_request_notify ON public.agreement_regen_requests;

-- 5. Bind triggers to tables
CREATE TRIGGER trigger_profile_registration_notify
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_admin_activity_notification();

CREATE TRIGGER trigger_application_submit_notify
  AFTER INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.create_admin_activity_notification();

CREATE TRIGGER trigger_payout_request_notify
  AFTER INSERT ON public.payout_requests
  FOR EACH ROW EXECUTE FUNCTION public.create_admin_activity_notification();

CREATE TRIGGER trigger_agreement_sign_notify
  AFTER INSERT ON public.agent_agreements
  FOR EACH ROW EXECUTE FUNCTION public.create_admin_activity_notification();

CREATE TRIGGER trigger_resign_request_notify
  AFTER INSERT ON public.agreement_regen_requests
  FOR EACH ROW EXECUTE FUNCTION public.create_admin_activity_notification();
