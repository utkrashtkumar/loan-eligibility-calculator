const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const SUPABASE_URL = 'https://tyysljzwakrxweanhvvr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eXNsanp3YWtyeHdlYW5odnZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjUyNTUsImV4cCI6MjA5NjYwMTI1NX0.88mkOUPqZZBpXvaYSrKirzMD_2ldreUmCzFZlpfmCt0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

async function checkPincodes() {
  console.log('Querying bank_pincodes table...');
  const { data, error } = await supabase
    .from('bank_pincodes')
    .select('bank_name');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Total rows in bank_pincodes: ${data.length}`);
  const uniqueNames = [...new Set(data.map(r => r.bank_name))];
  console.log('Unique bank names in bank_pincodes:', uniqueNames);
}

checkPincodes();
