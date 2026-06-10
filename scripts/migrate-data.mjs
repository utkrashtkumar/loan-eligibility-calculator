/**
 * Data Migration Script
 * Reads Excel files and uploads bank policy + pincode data to Supabase
 * 
 * Usage: node scripts/migrate-data.mjs
 */

import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import ws from 'ws';

// Polyfill WebSocket for Node.js < 22
global.WebSocket = ws;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Supabase config
const SUPABASE_URL = 'https://tyysljzwakrxweanhvvr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eXNsanp3YWtyeHdlYW5odnZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjUyNTUsImV4cCI6MjA5NjYwMTI1NX0.88mkOUPqZZBpXvaYSrKirzMD_2ldreUmCzFZlpfmCt0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// File paths
const POLICY_FILE = path.join(__dirname, '..', '..', 'BANK POLICY.xlsx');
const PINCODE_FILE = path.join(__dirname, '..', '..', 'PINCODE LIST FOR ALL  INSTANT PL BL.xlsx');

// Map sheet names to bank policy names and pincode columns
const SHEET_TO_BANK = {
  'FIBE': { bank: 'FIBE', loan_type: 'PL', pincodeCol: 'pincode' },
  'INCRED': { bank: 'INCRED', loan_type: 'PL', pincodeCol: 'Pincode' },
  'FINNABLE': { bank: 'FINNABLE', loan_type: 'PL', pincodeCol: 'pincode' },
  'IDFC': { bank: 'IDFC', loan_type: 'PL', pincodeCol: 'PINCODE', headerRow: 1 },
  'poonwala': { bank: 'POONAWALLA', loan_type: 'PL', pincodeCol: 'Pincode' },
  'unity': { bank: 'UNITY', loan_type: 'PL', pincodeCol: 'PIN' },
  'hero': { bank: 'HERO', loan_type: 'PL', pincodeCol: 'ZIPCODE' },
  'muthoot': { bank: 'MUTHOOT', loan_type: 'PL', pincodeCol: 'cust_present_address_pincode' },
  'prefer': { bank: 'PREFER', loan_type: 'PL', pincodeCol: 'pincode' },
  'protium': { bank: 'PROTIUM', loan_type: 'PL', pincodeCol: 'Pin_Code,non_so', csvStyle: true },
  'flexi': { bank: 'FLEXI', loan_type: 'PL', pincodeCol: 'pincode' },
  'faircent': { bank: 'FAIRCENT', loan_type: 'PL', pincodeCol: 'Pin Code' },
  // BL (Business Loan) sheets
  'aditya bl': { bank: 'ADITYA BIRLA', loan_type: 'BL', pincodeCol: '0' },
  'incred_bl': { bank: 'INCRED', loan_type: 'BL', pincodeCol: 'Pincode' },
};

// City column mapping per sheet
const SHEET_CITY_COL = {
  'FIBE': 'city', 'INCRED': 'City', 'FINNABLE': 'city', 'IDFC': 'CITY C',
  'poonwala': 'District', 'unity': 'City', 'hero': 'CITY', 'muthoot': null,
  'aditya bl': 'City', 'incred_bl': 'City', 'prefer': 'city',
  'protium': null, 'flexi': 'district', 'faircent': 'District',
};

// State column mapping per sheet
const SHEET_STATE_COL = {
  'FIBE': 'state', 'INCRED': 'State', 'FINNABLE': 'state', 'IDFC': 'STATE C',
  'poonwala': 'StateName', 'unity': 'State', 'hero': 'STATE', 'muthoot': null,
  'aditya bl': 'State', 'incred_bl': 'State', 'prefer': null,
  'protium': null, 'flexi': 'state', 'faircent': 'StateName',
};

// Default policy values for extra banks not in the Excel policy sheet
const DEFAULT_EXTRA_BANKS = {
  'PROTIUM': {
    min_cibil: 700, min_salary: 20000, company_category: 'ALL TYPES',
    foir_max: 60, special_notes: 'Digital lending platform', all_pincodes: false,
  },
  'FLEXI': {
    min_cibil: 700, min_salary: 20000, company_category: 'ALL TYPES',
    foir_max: 65, special_notes: 'Flexible personal loans', all_pincodes: false,
  },
  'FAIRCENT': {
    min_cibil: 680, min_salary: 15000, company_category: 'ALL TYPES',
    foir_max: 65, special_notes: 'P2P lending platform', all_pincodes: false,
  },
  'PREFER': {
    min_cibil: 700, min_salary: 20000, company_category: 'ALL TYPES',
    foir_max: 60, special_notes: 'Digital lending', all_pincodes: false,
  },
};

/**
 * Parse CIBIL score string like "750+" to number 750
 */
function parseCibil(str) {
  if (!str) return 0;
  return parseInt(str.toString().replace(/[^0-9]/g, ''), 10) || 0;
}

/**
 * Parse salary string to number
 */
function parseSalary(str) {
  if (!str) return 0;
  return parseInt(str.toString().replace(/[^0-9]/g, ''), 10) || 0;
}

/**
 * Parse FOIR string like "60-65%" to max value (65)
 */
function parseFoir(str) {
  if (!str) return 60;
  const matches = str.toString().match(/(\d+)/g);
  if (!matches) return 60;
  return Math.max(...matches.map(Number));
}

/**
 * Parse age range like "21-60" to { min, max }
 */
function parseAge(str) {
  if (!str) return { min: 21, max: 60 };
  const parts = str.toString().split('-').map(s => parseInt(s.trim(), 10));
  return { min: parts[0] || 21, max: parts[1] || 60 };
}

async function migratePolicies() {
  console.log('\n📋 Migrating Bank Policies...');

  const workbook = XLSX.readFile(POLICY_FILE);
  const sheet = workbook.Sheets['Banks Policy'];
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log(`   Found ${data.length} banks in policy sheet`);

  const policies = [];

  // Process banks from Excel
  for (const row of data) {
    const age = parseAge(row['Age']);
    const bankName = row['Bank'].trim().toUpperCase();

    // INDUSIND serves all pincodes
    const isAllPincodes = bankName === 'INDUSIND';

    policies.push({
      bank_name: bankName,
      min_age: age.min,
      max_age: age.max,
      min_cibil: parseCibil(row['Min CIBIL']),
      min_salary: parseSalary(row['Min Salary']),
      company_category: row['Company Category'] || 'ALL TYPES',
      pf_required: row['PF Required'] || 'No',
      foir_max: parseFoir(row['FOIR']),
      min_experience: row['Min Experience'] || '1 Year',
      min_residence_stability: row['Residence Stability'] || '1+ Year',
      loan_type: 'PL',
      all_pincodes: isAllPincodes,
      special_notes: row['Special Notes'] || null,
    });
  }

  // Add BL variants for banks that have BL pincode sheets
  const blBanks = ['ADITYA BIRLA', 'INCRED'];
  for (const blBank of blBanks) {
    const plPolicy = policies.find(p => p.bank_name === blBank);
    if (plPolicy) {
      policies.push({
        ...plPolicy,
        bank_name: `${blBank} (BL)`,
        loan_type: 'BL',
      });
    }
  }

  // Add extra banks with default values
  for (const [bankName, defaults] of Object.entries(DEFAULT_EXTRA_BANKS)) {
    policies.push({
      bank_name: bankName,
      min_age: 21,
      max_age: 60,
      min_cibil: defaults.min_cibil,
      min_salary: defaults.min_salary,
      company_category: defaults.company_category,
      pf_required: 'No',
      foir_max: defaults.foir_max,
      min_experience: '1 Year',
      min_residence_stability: '1+ Year',
      loan_type: 'PL',
      all_pincodes: defaults.all_pincodes,
      special_notes: defaults.special_notes,
    });
  }

  console.log(`   Inserting ${policies.length} policy records...`);

  // Delete existing data first
  const { error: deleteErr } = await supabase.from('bank_policies').delete().neq('id', 0);
  if (deleteErr) console.log('   (Delete note:', deleteErr.message, ')');

  const { data: inserted, error } = await supabase
    .from('bank_policies')
    .upsert(policies, { onConflict: 'bank_name' })
    .select();

  if (error) {
    console.error('   ❌ Error inserting policies:', error.message);
    return false;
  }

  console.log(`   ✅ Inserted ${inserted.length} bank policies`);
  
  // Log all banks
  for (const p of inserted) {
    const flag = p.all_pincodes ? ' [ALL PINCODES]' : '';
    console.log(`      → ${p.bank_name} (${p.loan_type}) | CIBIL: ${p.min_cibil}+ | Salary: ₹${p.min_salary}+ | FOIR: ${p.foir_max}%${flag}`);
  }
  
  return true;
}

async function migratePincodes() {
  console.log('\n📍 Migrating Pincode Data...');

  const workbook = XLSX.readFile(PINCODE_FILE);

  let totalInserted = 0;

  for (const [sheetName, config] of Object.entries(SHEET_TO_BANK)) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) {
      console.log(`   ⚠️  Sheet "${sheetName}" not found, skipping`);
      continue;
    }

    let data;
    if (config.headerRow !== undefined) {
      data = XLSX.utils.sheet_to_json(sheet, { range: config.headerRow });
    } else {
      data = XLSX.utils.sheet_to_json(sheet);
    }

    // For BL sheets, use the BL policy name
    const policyBankName = config.loan_type === 'BL' ? `${config.bank} (BL)` : config.bank;

    const cityCol = SHEET_CITY_COL[sheetName];
    const stateCol = SHEET_STATE_COL[sheetName];

    const pincodes = [];
    const seenPincodes = new Set();

    for (const row of data) {
      let pincode;
      
      // Handle protium's CSV-style header
      if (config.csvStyle) {
        // The header might be "Pin_Code,non_so" — try extracting first column
        const val = row[config.pincodeCol];
        if (val) {
          pincode = val.toString().split(',')[0].trim();
        }
      } else {
        pincode = row[config.pincodeCol];
      }
      
      if (!pincode) continue;

      pincode = pincode.toString().trim();
      // Validate: must be 5-6 digits
      if (!/^\d{5,6}$/.test(pincode)) continue;
      // Pad to 6 digits if needed
      pincode = pincode.padStart(6, '0');

      // Deduplicate per bank
      const key = `${policyBankName}-${pincode}`;
      if (seenPincodes.has(key)) continue;
      seenPincodes.add(key);

      // Check if active (FIBE has 'is active' column)
      if (sheetName === 'FIBE' && row['is active'] && row['is active'] !== 'Y') continue;

      pincodes.push({
        bank_name: policyBankName,
        pincode: pincode,
        city: cityCol ? (row[cityCol] || '').toString().trim() : null,
        state: stateCol ? (row[stateCol] || '').toString().trim() : null,
        is_active: true,
      });
    }

    console.log(`   📦 ${sheetName} → ${policyBankName}: ${pincodes.length} pincodes`);

    // Batch insert (Supabase has limits per request)
    const BATCH_SIZE = 500;
    let batchErrors = 0;
    for (let i = 0; i < pincodes.length; i += BATCH_SIZE) {
      const batch = pincodes.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from('bank_pincodes')
        .insert(batch);

      if (error) {
        console.error(`   ❌ Error inserting batch ${Math.floor(i/BATCH_SIZE)+1} for ${policyBankName}: ${error.message}`);
        batchErrors++;
      }
    }
    
    if (batchErrors === 0) {
      totalInserted += pincodes.length;
    }
  }

  console.log(`\n   ✅ Total pincodes inserted: ${totalInserted}`);
  return true;
}

async function verifyData() {
  console.log('\n🔍 Verifying migrated data...');
  
  // Count policies
  const { data: policies, error: pErr } = await supabase
    .from('bank_policies')
    .select('bank_name, loan_type, all_pincodes');
  
  if (pErr) {
    console.error('   ❌ Error reading policies:', pErr.message);
  } else {
    console.log(`   📋 Total bank policies: ${policies.length}`);
    const plCount = policies.filter(p => p.loan_type === 'PL').length;
    const blCount = policies.filter(p => p.loan_type === 'BL').length;
    const allPinCount = policies.filter(p => p.all_pincodes).length;
    console.log(`      PL: ${plCount} | BL: ${blCount} | All-Pincodes: ${allPinCount}`);
  }

  // Count pincodes per bank
  const { data: pincodeCounts, error: pcErr } = await supabase
    .from('bank_pincodes')
    .select('bank_name');
  
  if (pcErr) {
    console.error('   ❌ Error reading pincodes:', pcErr.message);
  } else {
    const counts = {};
    for (const row of pincodeCounts) {
      counts[row.bank_name] = (counts[row.bank_name] || 0) + 1;
    }
    console.log(`   📍 Total pincode records: ${pincodeCounts.length}`);
    for (const [bank, count] of Object.entries(counts).sort((a,b) => b[1] - a[1])) {
      console.log(`      → ${bank}: ${count} pincodes`);
    }
  }
  
  // Test a sample pincode
  console.log('\n   🧪 Testing pincode 110001 (Delhi)...');
  const { data: testResult } = await supabase
    .from('bank_pincodes')
    .select('bank_name')
    .eq('pincode', '110001');
  
  if (testResult) {
    console.log(`      Found ${testResult.length} banks serving 110001: ${testResult.map(r => r.bank_name).join(', ')}`);
  }
}

async function main() {
  console.log('🚀 Starting Data Migration');
  console.log('='.repeat(50));

  // Test Supabase connection
  console.log('\n🔌 Testing Supabase connection...');
  const { data, error } = await supabase.from('bank_policies').select('count').limit(1);
  if (error) {
    console.error('❌ Cannot connect to Supabase or table does not exist.');
    console.error('   Error:', error.message);
    console.log('\n⚠️  Please create the tables first!');
    console.log('   Go to Supabase Dashboard → SQL Editor');
    console.log('   Copy and run: scripts/setup-database.sql');
    return;
  }
  console.log('   ✅ Connected to Supabase');

  // Clear existing pincode data
  console.log('\n🗑️  Clearing existing pincode data...');
  const { error: clearErr } = await supabase.from('bank_pincodes').delete().neq('id', 0);
  if (clearErr) console.log('   (Note:', clearErr.message, ')');
  else console.log('   ✅ Cleared');

  // Migrate policies first
  const policiesOk = await migratePolicies();
  if (!policiesOk) {
    console.error('\n❌ Policy migration failed. Fix errors and retry.');
    return;
  }

  // Then migrate pincodes
  await migratePincodes();
  
  // Verify
  await verifyData();

  console.log('\n' + '='.repeat(50));
  console.log('✅ Migration complete!');
}

main().catch(console.error);
