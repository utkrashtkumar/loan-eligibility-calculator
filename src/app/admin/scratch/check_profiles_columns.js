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
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('Fetched profiles row:', data);
    if (data && data.length > 0) {
      console.log('Columns list:', Object.keys(data[0]));
    } else {
      console.log('Table is empty.');
    }
  }
}
run();
