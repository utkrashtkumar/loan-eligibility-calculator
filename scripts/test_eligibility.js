const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const SUPABASE_URL = 'https://tyysljzwakrxweanhvvr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eXNsanp3YWtyeHdlYW5odnZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjUyNTUsImV4cCI6MjA5NjYwMTI1NX0.88mkOUPqZZBpXvaYSrKirzMD_2ldreUmCzFZlpfmCt0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

// Import the eligibility checker functions from src/lib/eligibility.js
// Since it uses ESM imports (import/export), we can write a quick inline simulation of checkEligibility 
// or test directly with the DB query structure used in eligibility.js.

async function testEligibility() {
  console.log('Fetching sample pincode from bank_pincodes...');
  const { data: samples, error: sampleErr } = await supabase
    .from('bank_pincodes')
    .select('bank_name, pincode')
    .eq('bank_name', 'FIBE')
    .limit(5);

  if (sampleErr || !samples || samples.length === 0) {
    console.error('Error fetching samples:', sampleErr);
    return;
  }

  const testPin = samples[0].pincode;
  console.log(`Using test pincode: "${testPin}" (serviceable by ${samples[0].bank_name})`);

  // Step 1: Find banks serving this pincode
  const { data: pincodeData } = await supabase
    .from('bank_pincodes')
    .select('bank_name')
    .eq('pincode', testPin)
    .eq('is_active', true);

  const pincodeBanks = pincodeData ? [...new Set(pincodeData.map(r => r.bank_name))] : [];
  console.log(`\nBanks serving pincode "${testPin}":`, pincodeBanks);

  // Step 2: Also get banks that serve ALL pincodes (all_pincodes = true)
  const { data: allPincodeBanks } = await supabase
    .from('bank_policies')
    .select('bank_name')
    .eq('all_pincodes', true);

  const allPincodeBankNames = allPincodeBanks ? allPincodeBanks.map(r => r.bank_name) : [];
  console.log('Banks serving PAN India (all pincodes):', allPincodeBankNames);

  // Combine
  const combined = [...new Set([...pincodeBanks, ...allPincodeBankNames])];
  console.log('Combined matching banks count:', combined.length);

  // Verify that FIBE is in the combined list
  if (combined.includes('FIBE')) {
    console.log('SUCCESS: FIBE is successfully matched for this pincode!');
  } else {
    console.log('FAIL: FIBE is NOT matched for its own serviceable pincode!');
  }
}

testEligibility();
