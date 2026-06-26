const fs = require('fs');
const ws = require('ws');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing env keys!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

async function getBanks() {
  const { data, error } = await supabase
    .from('bank_policies')
    .select('bank_name, logo_url');
  
  if (error) {
    console.error('Error fetching banks:', error);
    return;
  }
  
  console.log('Total bank policy rows:', data.length);
  const uniqueBanks = {};
  data.forEach(row => {
    uniqueBanks[row.bank_name] = row.logo_url || null;
  });
  console.log('Unique banks in DB:');
  console.log(JSON.stringify(uniqueBanks, null, 2));
}

getBanks();
