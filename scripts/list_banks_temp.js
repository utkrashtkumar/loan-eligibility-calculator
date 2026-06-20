const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const SUPABASE_URL = 'https://tyysljzwakrxweanhvvr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eXNsanp3YWtyeHdlYW5odnZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjUyNTUsImV4cCI6MjA5NjYwMTI1NX0.88mkOUPqZZBpXvaYSrKirzMD_2ldreUmCzFZlpfmCt0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  realtime: {
    transport: ws
  }
});

async function listBanks() {
  console.log('Querying unique bank names in database policies...');
  const { data, error } = await supabase
    .from('bank_policies')
    .select('bank_name, loan_type');

  if (error) {
    console.error('FAIL: Error details:', error);
  } else {
    const unique = [...new Set(data.map(p => `${p.bank_name} (${p.loan_type})`))];
    console.log('SUCCESS: Bank names found:', unique);
  }
}

listBanks();
