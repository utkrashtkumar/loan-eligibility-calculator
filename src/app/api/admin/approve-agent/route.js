import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/admin/approve-agent
 *
 * Security Design:
 * ─────────────────────────────────────────────────────────────────────────────
 * The old approach passed NEXT_PUBLIC_INTERNAL_API_SECRET from the client, which
 * exposed the secret in the browser JS bundle. This proxy route fixes that by:
 *
 *   1. Receiving the caller's Supabase access token in the Authorization header.
 *   2. Verifying the token server-side with the Supabase service-role key.
 *   3. Checking the caller's profile.role === 'admin' in Supabase.
 *   4. Only then calling /api/agent-approval with INTERNAL_API_SECRET (server-only env var).
 *
 * The admin page only needs to send its own session token — the internal secret
 * never leaves the server.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function POST(request) {
  try {
    // ── Step 1: Extract caller's Supabase access token ───────────────────────
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const accessToken = authHeader.slice(7);

    // ── Step 2: Verify token and check admin role via Supabase service role ──
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Supabase env vars not configured.');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const adminSupabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    // Validate the access token by fetching the user it belongs to
    const { data: { user }, error: userError } = await adminSupabase.auth.getUser(accessToken);
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    // Fetch profile to verify admin role
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    // ── Step 3: Parse and validate request body ──────────────────────────────
    const { agentName, agentEmail, action, reason } = await request.json();
    if (!agentName || !agentEmail || !action) {
      return NextResponse.json(
        { error: 'Missing required parameters: agentName, agentEmail, action' },
        { status: 400 }
      );
    }

    // ── Step 4: Forward to email route using server-only secret ──────────────
    const internalSecret = process.env.INTERNAL_API_SECRET;
    if (!internalSecret) {
      console.error('INTERNAL_API_SECRET is not configured.');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const appOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://handtohandloans.in';
    const emailRouteUrl = `${appOrigin}/api/agent-approval`;

    const emailResponse = await fetch(emailRouteUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Token': internalSecret,
      },
      body: JSON.stringify({ agentName, agentEmail, action, reason }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      return NextResponse.json(
        { error: emailData.error || 'Failed to send email' },
        { status: emailResponse.status }
      );
    }

    return NextResponse.json({ success: true, emailId: emailData.emailId });
  } catch (error) {
    console.error('Error in admin/approve-agent route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
