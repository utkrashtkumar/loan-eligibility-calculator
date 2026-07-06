const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const WebSocket = require('ws');

const envContent = fs.readFileSync('S:/calculator/loan-checker/.env.local', 'utf8');
const envVars = {};
envContent.split(/\r?\n/).forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  realtime: {
    transport: WebSocket,
  }
});

async function run() {
  console.log("Testing anonymous query...");

  const { data: agree, error: agreeErr } = await supabase
    .from('agent_agreements')
    .select('*')
    .limit(1);

  if (agreeErr) {
    console.error("agent_agreements select error:", agreeErr.message);
  } else {
    console.log("agent_agreements select success, rows count:", agree ? agree.length : 0);
  }

  const { data: prof, error: profErr } = await supabase
    .from('profiles')
    .select('id, full_name')
    .limit(1);

  if (profErr) {
    console.error("profiles select error:", profErr.message);
  } else {
    console.log("profiles select success, rows count:", prof ? prof.length : 0);
  }
}
run();
