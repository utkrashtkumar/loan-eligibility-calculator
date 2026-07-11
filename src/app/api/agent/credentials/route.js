import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request) {
  try {
    // Extract caller's Supabase access token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const accessToken = authHeader.slice(7);

    // Verify token and check user role via Supabase service role
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

    // Fetch profile to verify agent or admin role
    const { data: profile, error: profileError } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'agent')) {
      return NextResponse.json({ error: 'Forbidden: agent or admin access required' }, { status: 403 });
    }

    // Fetch credentials securely using the service role client
    const { data: policies, error: policiesError } = await adminSupabase
      .from('bank_policies')
      .select('id, bank_name, portal_username, portal_password, apply_url');

    if (policiesError) {
      console.error('Error fetching bank policies:', policiesError);
      return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
    }

    const credentialsMap = {};
    if (policies) {
      policies.forEach(p => {
        credentialsMap[p.id] = {
          portal_username: p.portal_username || '',
          portal_password: p.portal_password || '',
          apply_url: p.apply_url || ''
        };
      });
    }

    return NextResponse.json({ credentials: credentialsMap });
  } catch (error) {
    console.error('Error in agent/credentials route:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
