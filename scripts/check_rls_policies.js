const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const SUPABASE_URL = 'https://tyysljzwakrxweanhvvr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eXNsanp3YWtyeHdlYW5odnZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjUyNTUsImV4cCI6MjA5NjYwMTI1NX0.88mkOUPqZZBpXvaYSrKirzMD_2ldreUmCzFZlpfmCt0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

async function checkRLS() {
  console.log('Querying pg_policies...');
  // We can query pg_policies view using a sql RPC if available, or try to run an insert/update/delete test on bank_pincodes to see if we get a permission denied error.
  
  // Let's test if we can update bank_pincodes using the anon key.
  console.log('Testing UPDATE on bank_pincodes using anon key...');
  const { data, error } = await supabase
    .from('bank_pincodes')
    .update({ is_active: true })
    .eq('pincode', '999999'); // doesn't matter if it exists
    
  if (error) {
    console.error('UPDATE test failed:', error.message, error.code);
  } else {
    console.log('UPDATE test succeeded (no error)!');
  }
  
  // Let's test if we can select policy details.
  console.log('Testing SELECT on bank_policies...');
  const { data: policies, error: polError } = await supabase
    .from('bank_policies')
    .select('bank_name')
    .limit(1);
    
  if (polError) {
    console.error('SELECT test failed:', polError.message);
  } else {
    console.log('SELECT test succeeded! First policy name:', policies[0]?.bank_name);
  }
}

checkRLS();
