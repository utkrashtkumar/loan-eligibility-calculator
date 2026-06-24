const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');
global.WebSocket = ws;

const supabase = createClient(
  'https://tyysljzwakrxweanhvvr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eXNsanp3YWtyeHdlYW5odnZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjUyNTUsImV4cCI6MjA5NjYwMTI1NX0.88mkOUPqZZBpXvaYSrKirzMD_2ldreUmCzFZlpfmCt0',
  { auth: { persistSession: false }, realtime: { transport: ws } }
);

const pincodeDir = 's:\\calculator\\pincode availability';

const bankMappings = {
  'BharatPe_Serviceable_Pincodes.xlsx': ['Bharat Pe (Instant)'],
  'FIBE_Serviceable_Pincodes.xlsx': ['FIBE'],
  'FINNABLE_Serviceable_Pincodes.xlsx': ['Finnable'],
  'Hero_FinCorp_Serviceable_Pincodes.xlsx': ['Hero Fincorp (Instant)'],
  'IDFC_Serviceable_Pincodes.xlsx': ['IDFC'],
  'INCRED_Serviceable_Pincodes.xlsx': ['Incred'],
  'INDUSIND_Serviceable_Pincodes.xlsx': ['INDUSIND'],
  'IndusInd_Bank_Serviceable_Pincodes.xlsx': ['IndusInd (Instant)'],
  'L&T_Finance_Serviceable_Pincodes.xlsx': ['L&T (Instant)'],
  'Muthoot_Finance_Serviceable_Pincodes.xlsx': [
    'Muthoot Finance',
    'Muthoot Finance SALARY (Instant)',
    'Muthoot Finance DAILY BUSINESS',
    'Muthoot Finance MONTLY BUSINESS'
  ],
  'Poonawalla_Fincorp_Serviceable_Pincodes.xlsx': [
    'Poonawalla Fincorp',
    'Poonawalla Fincorp (BL)'
  ],
  'PreFr_Serviceable_Pincodes.xlsx': ['Prefr (Instant)'],
  'Unity_Small_Finance_Bank_Serviceable_Pincodes.xlsx': ['Unity Small Finance Bank (Instant)']
};

function extractPincodesFromSheet(sheet) {
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const pincodes = [];
  
  // Find which column has the pincode (search first 15 rows for header or first cell with a 6-digit number)
  let pincodeColIdx = -1;
  let startRowIdx = -1;
  
  for (let r = 0; r < Math.min(15, data.length); r++) {
    const row = data[r];
    if (!row) continue;
    for (let c = 0; c < row.length; c++) {
      const val = row[c];
      if (val) {
        const valStr = val.toString().trim();
        // Check if this is a header indicating pincode
        if (['pincode', 'zipcode', 'pin', 'zip', 'zip_code'].includes(valStr.toLowerCase())) {
          pincodeColIdx = c;
          startRowIdx = r + 1;
          break;
        }
        // Fallback: check if it's a 5 or 6 digit number
        if (/^\d{5,6}$/.test(valStr) && pincodeColIdx === -1) {
          pincodeColIdx = c;
          startRowIdx = r;
          break;
        }
      }
    }
    if (startRowIdx !== -1) break;
  }
  
  if (pincodeColIdx === -1) {
    pincodeColIdx = 0;
    startRowIdx = 0;
  }
  
  for (let r = startRowIdx; r < data.length; r++) {
    const row = data[r];
    if (!row) continue;
    const val = row[pincodeColIdx];
    if (val) {
      const pin = val.toString().trim();
      if (/^\d{5,6}$/.test(pin)) {
        pincodes.push(pin.padStart(6, '0'));
      }
    }
  }
  
  return [...new Set(pincodes)];
}

async function run() {
  console.log('=== Pincodes Import Script ===\n');

  console.log('Clearing all existing pincodes in bank_pincodes table...');
  const { error: clearErr } = await supabase.from('bank_pincodes').delete().neq('id', 0);
  if (clearErr) {
    console.warn('Warning during clearing:', clearErr.message);
  } else {
    console.log('Successfully cleared bank_pincodes table.\n');
  }

  const files = Object.keys(bankMappings);
  
  for (const file of files) {
    const filePath = path.join(pincodeDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${file}`);
      continue;
    }
    
    console.log(`Processing file: ${file}...`);
    const targetBanks = bankMappings[file];
    
    // Parse sheet
    const wb = XLSX.readFile(filePath);
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const pincodes = extractPincodesFromSheet(sheet);
    console.log(`  Parsed ${pincodes.length} unique pincodes`);

    if (pincodes.length === 0) {
      console.warn(`  No pincodes found in ${file}`);
      continue;
    }

    // 1. Delete old records for target bank names
    console.log(`  Deleting existing pincodes for: ${targetBanks.join(', ')}...`);
    const { error: delErr } = await supabase
      .from('bank_pincodes')
      .delete()
      .in('bank_name', targetBanks);
      
    if (delErr) {
      console.error(`  Error deleting old records:`, delErr.message);
      continue;
    }

    // 2. Prepare database rows
    const rows = [];
    targetBanks.forEach(bank => {
      pincodes.forEach(pin => {
        rows.push({
          bank_name: bank,
          pincode: pin,
          is_active: true
        });
      });
    });

    // 3. Batch insert (batches of 1000)
    const BATCH_SIZE = 1000;
    console.log(`  Inserting ${rows.length} rows in batches of ${BATCH_SIZE}...`);
    let inserted = 0;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error: insErr } = await supabase
        .from('bank_pincodes')
        .insert(batch);
        
      if (insErr) {
        console.error(`  Error inserting batch at index ${i}:`, insErr.message);
      } else {
        inserted += batch.length;
      }
    }
    console.log(`  Successfully inserted ${inserted} rows.`);

    // 4. Update policy in bank_policies to set all_pincodes = false
    console.log(`  Setting all_pincodes = false in bank_policies for: ${targetBanks.join(', ')}...`);
    const { error: polErr } = await supabase
      .from('bank_policies')
      .update({ all_pincodes: false })
      .in('bank_name', targetBanks);
      
    if (polErr) {
      console.error(`  Error updating policies:`, polErr.message);
    } else {
      console.log(`  Successfully updated policies all_pincodes flag to false.`);
    }
    
    console.log('');
  }

  console.log('=== Pincodes Import Completed! ===');
}

run().catch(console.error);
