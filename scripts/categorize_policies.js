/**
 * Categorize all bank_policies records into: salary | instant | business
 * Run AFTER adding policy_category column in Supabase SQL editor.
 *
 * Rules:
 *  salary   = ids 95-112 (from SALARY LOAN POLICY_NEW.xlsx)
 *  business = any with loan_type = 'BL' (ids 113, 114, 116)
 *  instant  = any from INSTANT LOAN POLICY.xlsx with loan_type = 'PL' (ids 115, 117-125)
 */
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const supabase = createClient(
  'https://tyysljzwakrxweanhvvr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eXNsanp3YWtyeHdlYW5odnZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjUyNTUsImV4cCI6MjA5NjYwMTI1NX0.88mkOUPqZZBpXvaYSrKirzMD_2ldreUmCzFZlpfmCt0',
  { auth: { persistSession: false }, realtime: { transport: ws } }
);

async function categorize() {
  console.log('Categorizing bank policies...\n');

  // 1. Salary policies (ids 95-112, all from SALARY LOAN POLICY_NEW.xlsx)
  const salaryIds = [95,96,97,98,99,100,101,102,103,104,105,106,107,108,109,110,111,112];
  const { error: e1 } = await supabase
    .from('bank_policies')
    .update({ policy_category: 'salary' })
    .in('id', salaryIds);
  if (e1) { console.error('Salary update error:', e1.message); return; }
  console.log(`✓ Set ${salaryIds.length} policies → salary`);

  // 2. Business policies (categorized under instant per user request)
  const businessIds = [113, 114, 116]; // Muthoot Daily BL, Muthoot Monthly BL, Poonawalla (BL)
  const { error: e2 } = await supabase
    .from('bank_policies')
    .update({ policy_category: 'instant' })
    .in('id', businessIds);
  if (e2) { console.error('Business update error:', e2.message); return; }
  console.log(`✓ Set ${businessIds.length} policies → instant`);

  // 3. Instant policies (from INSTANT LOAN POLICY.xlsx, loan_type = 'PL')
  const instantIds = [115, 117, 118, 119, 120, 121, 122, 123, 124, 125];
  const { error: e3 } = await supabase
    .from('bank_policies')
    .update({ policy_category: 'instant' })
    .in('id', instantIds);
  if (e3) { console.error('Instant update error:', e3.message); return; }
  console.log(`✓ Set ${instantIds.length} policies → instant`);

  // Verify
  const { data } = await supabase
    .from('bank_policies')
    .select('id, bank_name, loan_type, policy_category')
    .order('policy_category, id');

  console.log('\n=== Final categorization ===');
  let cat = '';
  data.forEach(p => {
    if (p.policy_category !== cat) {
      cat = p.policy_category;
      console.log(`\n--- ${cat.toUpperCase()} ---`);
    }
    console.log(`  [${p.id}] ${p.bank_name} (${p.loan_type})`);
  });
  console.log('\n✅ Done!');
}

categorize().catch(console.error);
