const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const SUPABASE_URL = 'https://tyysljzwakrxweanhvvr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eXNsanp3YWtyeHdlYW5odnZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjUyNTUsImV4cCI6MjA5NjYwMTI1NX0.88mkOUPqZZBpXvaYSrKirzMD_2ldreUmCzFZlpfmCt0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

async function countPincodes() {
  console.log('Querying pincode count per bank name...');
  
  // We can query all records, but bank_pincodes can be large (200k rows).
  // Instead, let's do a group-by count query if possible, or fetch all bank names and count them individually.
  const { data: policies, error: polErr } = await supabase
    .from('bank_policies')
    .select('bank_name, all_pincodes');
    
  if (polErr) {
    console.error('Error fetching policies:', polErr);
    return;
  }
  
  console.log('\n--- Policy Pincode Alignment Check ---');
  for (const policy of policies) {
    const { count, error: countErr } = await supabase
      .from('bank_pincodes')
      .select('*', { count: 'exact', head: true })
      .eq('bank_name', policy.bank_name);
      
    if (countErr) {
      console.error(`Error counting for ${policy.bank_name}:`, countErr.message);
    } else {
      console.log(`Bank: ${policy.bank_name.padEnd(50)} | Pincode Count: ${count.toString().padStart(6)} | All Pincodes: ${policy.all_pincodes}`);
    }
  }
}

countPincodes();
