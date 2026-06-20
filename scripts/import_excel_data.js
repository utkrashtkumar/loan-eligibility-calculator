const XLSX = require('xlsx');
const path = require('path');
const ws = require('ws');
global.WebSocket = ws;
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://tyysljzwakrxweanhvvr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eXNsanp3YWtyeHdlYW5odnZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjUyNTUsImV4cCI6MjA5NjYwMTI1NX0.88mkOUPqZZBpXvaYSrKirzMD_2ldreUmCzFZlpfmCt0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const basePath = path.join(__dirname, '..', '..');

// Helper to normalize bank names
function normalizeBankName(name) {
  if (!name) return '';
  let n = name.trim().toUpperCase();
  if (n.includes('MUTHOOT')) return 'MUTHOOT';
  if (n.includes('POONAWALLA') || n.includes('POONWALA')) return 'POONAWALLA';
  if (n.includes('HERO')) return 'HERO';
  if (n.includes('UNITY')) return 'UNITY';
  if (n.includes('L&T') || n.includes('L & T')) return 'L&T';
  if (n.includes('PREFR') || n.includes('PREFER')) return 'PREFR';
  if (n.includes('DMI')) return 'DMI';
  if (n.includes('INDUSIND')) return 'INDUSIND';
  if (n.includes('BHARATPE') || n.includes('BHARAT PE')) return 'BHARATPE';
  if (n.includes('CREDIT SEA') || n.includes('CREDITSEA')) return 'CREDIT SEA';
  if (n.includes('FIBE')) return 'FIBE';
  if (n.includes('INCRED')) return 'INCRED';
  if (n.includes('FINNABLE')) return 'FINNABLE';
  if (n.includes('IDFC')) return 'IDFC';
  if (n.includes('SMFG')) return 'SMFG';
  if (n.includes('PROTIUM')) return 'PROTIUM';
  if (n.includes('FLEXI')) return 'FLEXI';
  if (n.includes('FAIRCENT')) return 'FAIRCENT';
  if (n.includes('ADITYA BIRLA') || n.includes('ADITIYA BIRLA')) return 'ADITYA BIRLA';
  if (n.includes('HDFC')) return 'HDFC';
  if (n.includes('AXIS')) return 'AXIS';
  if (n.includes('ICICI')) return 'ICICI';
  if (n.includes('TATA CAPITAL')) return 'TATA CAPITAL';
  if (n.includes('BAJAJ')) return 'BAJAJ';
  if (n.includes('KOTAK')) return 'KOTAK';
  if (n.includes('YES BANK')) return 'YES BANK';
  if (n.includes('PIRAMAL')) return 'PIRAMAL';
  if (n.includes('FULLERTON')) return 'FULLERTON';
  return n;
}

function parseCibil(str) {
  if (!str) return 650;
  if (str.toString().toLowerCase().includes('no cibil')) return 300;
  return parseInt(str.toString().replace(/[^0-9]/g, ''), 10) || 650;
}

function parseSalary(str) {
  if (!str) return 0;
  if (str.toString().toLowerCase().includes('not required')) return 0;
  return parseInt(str.toString().replace(/[^0-9]/g, ''), 10) || 0;
}

function parseFoir(str) {
  if (!str) return 55;
  if (str.toString().toLowerCase().includes('not required')) return 100;
  const matches = str.toString().match(/(\d+)/g);
  if (!matches) return 55;
  return Math.max(...matches.map(Number));
}

function parseAge(str) {
  if (!str) return { min: 21, max: 60 };
  const parts = str.toString().split('-').map(s => parseInt(s.trim(), 10));
  return { min: parts[0] || 21, max: parts[1] || 60 };
}

async function importPolicies() {
  console.log('\n--- Importing Policies ---');
  const policies = [];

  // 1. BANK POLICY.xlsx -> Banks Policy
  try {
    const wb = XLSX.readFile(path.join(basePath, 'BANK POLICY.xlsx'));
    const data = XLSX.utils.sheet_to_json(wb.Sheets['Banks Policy']);
    data.forEach(row => {
      if (!row['Bank']) return;
      const bank = normalizeBankName(row['Bank']);
      const age = parseAge(row['Age']);
      policies.push({
        bank_name: bank,
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
        all_pincodes: bank === 'INDUSIND',
        special_notes: row['Special Notes'] || null,
        employment_type: 'salaried'
      });
    });
  } catch (e) {
    console.error('Error reading BANK POLICY.xlsx:', e.message);
  }

  // 2. bank policy 2.xlsx -> SALARY sheet
  try {
    const wb = XLSX.readFile(path.join(basePath, 'bank policy 2.xlsx'));
    const data = XLSX.utils.sheet_to_json(wb.Sheets['SALARY']);
    data.forEach(row => {
      if (!row['NBFC']) return;
      const bank = normalizeBankName(row['NBFC']);
      const age = parseAge(row['Age Criteria']);
      // If already exists, we will update it or skip
      const existing = policies.find(p => p.bank_name === bank && p.loan_type === 'PL');
      if (existing) {
        // Update details with values from this sheet if they are more specific
        existing.min_salary = parseSalary(row['Minimum Salary']);
        existing.min_cibil = parseCibil(row['CIBIL']);
        existing.foir_max = parseFoir(row['FOIR']);
        existing.pf_required = row['PF Requirement'] || 'No';
      } else {
        policies.push({
          bank_name: bank,
          min_age: age.min,
          max_age: age.max,
          min_cibil: parseCibil(row['CIBIL']),
          min_salary: parseSalary(row['Minimum Salary']),
          company_category: 'ALL TYPES',
          pf_required: row['PF Requirement'] || 'No',
          foir_max: parseFoir(row['FOIR']),
          min_experience: '1 Year',
          min_residence_stability: '1+ Year',
          loan_type: 'PL',
          all_pincodes: row['Pincode Rule'] && row['Pincode Rule'].toString().toLowerCase().includes('pan india'),
          special_notes: null,
          employment_type: 'salaried'
        });
      }
    });
  } catch (e) {
    console.error('Error reading bank policy 2.xlsx SALARY:', e.message);
  }

  // 3. bank policy 2.xlsx -> INSTANT sheet
  try {
    const wb = XLSX.readFile(path.join(basePath, 'bank policy 2.xlsx'));
    const data = XLSX.utils.sheet_to_json(wb.Sheets['INSTANT']);
    data.forEach(row => {
      if (!row['NBFC']) return;
      const bankBase = normalizeBankName(row['NBFC']);
      const bank = `${bankBase} (Instant)`;
      const age = parseAge(row['Age Criteria']);
      
      policies.push({
        bank_name: bank,
        min_age: age.min,
        max_age: age.max,
        min_cibil: parseCibil(row['CIBIL']),
        min_salary: parseSalary(row['Minimum Salary']),
        company_category: 'ALL TYPES',
        pf_required: row['PF Requirement'] || 'No',
        foir_max: parseFoir(row['FOIR']),
        min_experience: '1 Year',
        min_residence_stability: '1+ Year',
        loan_type: 'PL',
        all_pincodes: row['Pincode Rule'] && row['Pincode Rule'].toString().toLowerCase().includes('pan india'),
        special_notes: `Instant loan matching on pincode + CIBIL`,
        employment_type: 'both' // As per request (separate rows, employment_type = 'both')
      });
    });
  } catch (e) {
    console.error('Error reading bank policy 2.xlsx INSTANT:', e.message);
  }

  // 4. Add Business Loan (BL) variants
  const blBanks = ['INCRED', 'ADITYA BIRLA'];
  blBanks.forEach(b => {
    const plPolicy = policies.find(p => p.bank_name === b && p.loan_type === 'PL');
    if (plPolicy) {
      policies.push({
        ...plPolicy,
        bank_name: `${b} (BL)`,
        loan_type: 'BL',
        employment_type: 'self_employed'
      });
    }
  });

  // 5. Add default policies for other banks in pincode list
  const extraBanks = [
    { name: 'PROTIUM (Instant)', cibil: 700, foir: 60 },
    { name: 'FLEXI (Instant)', cibil: 700, foir: 65 },
    { name: 'FAIRCENT (Instant)', cibil: 680, foir: 65 }
  ];
  extraBanks.forEach(eb => {
    if (!policies.find(p => p.bank_name === eb.name)) {
      policies.push({
        bank_name: eb.name,
        min_age: 21,
        max_age: 60,
        min_cibil: eb.cibil,
        min_salary: 0,
        company_category: 'ALL TYPES',
        pf_required: 'No',
        foir_max: eb.foir,
        min_experience: '1 Year',
        min_residence_stability: '1+ Year',
        loan_type: 'PL',
        all_pincodes: false,
        special_notes: 'Default policy',
        employment_type: 'both'
      });
    }
  });

  console.log(`Prepared ${policies.length} bank policies to upsert.`);

  // Delete existing policies first
  const { error: delErr } = await supabase.from('bank_policies').delete().neq('id', 0);
  if (delErr) {
    console.log('Note during policy deletion:', delErr.message);
  }

  const { data: inserted, error: insErr } = await supabase
    .from('bank_policies')
    .insert(policies)
    .select();

  if (insErr) {
    console.error('Error inserting policies:', insErr.message);
  } else {
    console.log(`Successfully inserted ${inserted.length} policies.`);
  }
}

async function importPincodes() {
  console.log('\n--- Importing Pincodes ---');
  
  // Clear existing pincodes first
  console.log('Clearing existing bank pincodes...');
  const { error: delErr } = await supabase.from('bank_pincodes').delete().neq('id', 0);
  if (delErr) {
    console.log('Note during pincode deletion:', delErr.message);
  } else {
    console.log('Existing pincodes cleared.');
  }

  const pincodesToInsert = [];
  const seenKeys = new Set();

  function addPincode(bank, pincodeStr, city = null, state = null) {
    if (!pincodeStr) return;
    const pin = pincodeStr.toString().trim();
    if (!/^\d{5,6}$/.test(pin)) return;
    const paddedPin = pin.padStart(6, '0');
    
    const key = `${bank}-${paddedPin}`;
    if (seenKeys.has(key)) return;
    seenKeys.add(key);

    pincodesToInsert.push({
      bank_name: bank,
      pincode: paddedPin,
      city: city ? city.toString().trim() : null,
      state: state ? state.toString().trim() : null,
      is_active: true
    });
  }

  // File 1: SALARY LOAN PINCODE LIST.xlsx
  console.log('Reading SALARY LOAN PINCODE LIST.xlsx...');
  try {
    const wb = XLSX.readFile(path.join(basePath, 'SALARY LOAN PINCODE LIST.xlsx'));
    const mapping = {
      'FIBE': { bank: 'FIBE', col: 'pincode' },
      'FINNABLE': { bank: 'FINNABLE', col: 'pincode' },
      'INDUSIND': { bank: 'INDUSIND', col: 'Pincode' },
      'INCRED': { bank: 'INCRED', col: 'Pincode' },
      'IDFC': { bank: 'IDFC', col: 'PINCODE' },
      'MUTHOOT': { bank: 'MUTHOOT', col: 'Pincode' }
    };
    Object.keys(mapping).forEach(sheetName => {
      const sheet = wb.Sheets[sheetName];
      if (!sheet) return;
      const data = XLSX.utils.sheet_to_json(sheet);
      const conf = mapping[sheetName];
      data.forEach(row => {
        addPincode(conf.bank, row[conf.col]);
      });
      console.log(`  Read ${data.length} rows from SALARY LOAN PINCODE LIST.xlsx [${sheetName}]`);
    });
  } catch (e) {
    console.error('Error reading SALARY LOAN PINCODE LIST.xlsx:', e.message);
  }

  // File 2: INSTANT PINCODE LIST.xlsx
  console.log('Reading INSTANT PINCODE LIST.xlsx...');
  try {
    const wb = XLSX.readFile(path.join(basePath, 'INSTANT PINCODE LIST.xlsx'));
    const mapping = {
      'POONAWLLA': { bank: 'POONAWALLA (Instant)', col: 'Pincode' },
      'PREFR': { bank: 'PREFR (Instant)', col: 'pincode' },
      'UNITY': { bank: 'UNITY (Instant)', col: 'PIN' },
      'MUTHOOT': { bank: 'MUTHOOT (Instant)', col: 'Pincode' },
      'L&T': { bank: 'L&T (Instant)', col: 'PinCode' },
      'HERO': { bank: 'HERO (Instant)', col: 'ZIPCODE' },
      'INDUSIND': { bank: 'INDUSIND (Instant)', col: 'Pincode' },
      'BHARATPE': { bank: 'BHARATPE (Instant)', col: 'pincode' }
    };
    Object.keys(mapping).forEach(sheetName => {
      const sheet = wb.Sheets[sheetName];
      if (!sheet) return;
      const data = XLSX.utils.sheet_to_json(sheet);
      const conf = mapping[sheetName];
      data.forEach(row => {
        addPincode(conf.bank, row[conf.col]);
      });
      console.log(`  Read ${data.length} rows from INSTANT PINCODE LIST.xlsx [${sheetName}]`);
    });
  } catch (e) {
    console.error('Error reading INSTANT PINCODE LIST.xlsx:', e.message);
  }

  // File 3: PINCODE LIST FOR ALL  INSTANT PL BL.xlsx
  console.log('Reading PINCODE LIST FOR ALL  INSTANT PL BL.xlsx...');
  try {
    const wb = XLSX.readFile(path.join(basePath, 'PINCODE LIST FOR ALL  INSTANT PL BL.xlsx'));
    const mapping = {
      'FIBE': { bank: 'FIBE', col: 'pincode', cityCol: 'city', stateCol: 'state' },
      'INCRED': { bank: 'INCRED (Instant)', col: 'Pincode', cityCol: 'City', stateCol: 'State' },
      'FINNABLE': { bank: 'FINNABLE', col: 'pincode', cityCol: 'city', stateCol: 'state' },
      'IDFC': { bank: 'IDFC', col: '__EMPTY', cityCol: '__EMPTY_1', stateCol: '__EMPTY_2', headerRow: 1 },
      'poonwala': { bank: 'POONAWALLA (Instant)', col: 'Pincode', cityCol: 'District', stateCol: 'StateName' },
      'unity': { bank: 'UNITY (Instant)', col: 'PIN', cityCol: 'City', stateCol: 'State' },
      'prefer': { bank: 'PREFR (Instant)', col: 'pincode', cityCol: 'city' },
      'hero': { bank: 'HERO (Instant)', col: 'ZIPCODE', cityCol: 'CITY', stateCol: 'STATE' },
      'protium': { bank: 'PROTIUM (Instant)', col: 'Pin_Code,non_so', csvStyle: true },
      'flexi': { bank: 'FLEXI (Instant)', col: 'pincode', cityCol: 'district', stateCol: 'state' },
      'muthoot': { bank: 'MUTHOOT (Instant)', col: 'cust_present_address_pincode' },
      'incred_bl': { bank: 'INCRED (BL)', col: 'Pincode', cityCol: 'City', stateCol: 'State' },
      'aditya bl': { bank: 'ADITYA BIRLA (BL)', col: '0', cityCol: 'City', stateCol: 'State' },
      'faircent': { bank: 'FAIRCENT (Instant)', col: 'Pin Code', cityCol: 'District', stateCol: 'StateName' }
    };
    Object.keys(mapping).forEach(sheetName => {
      const sheet = wb.Sheets[sheetName];
      if (!sheet) return;
      const conf = mapping[sheetName];
      let data;
      if (conf.headerRow !== undefined) {
        data = XLSX.utils.sheet_to_json(sheet, { range: conf.headerRow });
      } else {
        data = XLSX.utils.sheet_to_json(sheet);
      }
      data.forEach(row => {
        let pinVal;
        if (conf.csvStyle) {
          const val = row[conf.col];
          if (val) {
            pinVal = val.toString().split(',')[0].trim();
          }
        } else {
          pinVal = row[conf.col];
        }
        
        if (!pinVal) return;
        
        // Skip header indicator rows
        if (pinVal === 'PINCODE' || pinVal === 'pincode' || pinVal === 'PIN') return;

        const city = conf.cityCol ? row[conf.cityCol] : null;
        const state = conf.stateCol ? row[conf.stateCol] : null;

        addPincode(conf.bank, pinVal, city, state);
      });
      console.log(`  Read ${data.length} rows from PINCODE LIST FOR ALL  INSTANT PL BL.xlsx [${sheetName}]`);
    });
  } catch (e) {
    console.error('Error reading PINCODE LIST FOR ALL  INSTANT PL BL.xlsx:', e.message);
  }

  console.log(`Total unique pincode records prepared: ${pincodesToInsert.length}`);

  // Batch insert
  const BATCH_SIZE = 1000;
  console.log(`Inserting pincodes in batches of ${BATCH_SIZE}...`);
  
  let insertedCount = 0;
  for (let i = 0; i < pincodesToInsert.length; i += BATCH_SIZE) {
    const batch = pincodesToInsert.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('bank_pincodes').insert(batch);
    if (error) {
      console.error(`Error inserting batch at ${i}:`, error.message);
    } else {
      insertedCount += batch.length;
      if (insertedCount % 10000 === 0 || insertedCount === pincodesToInsert.length) {
        console.log(`  Progress: ${insertedCount}/${pincodesToInsert.length} pincodes inserted.`);
      }
    }
  }

  console.log(`Pincode import finished. Total inserted: ${insertedCount}`);
}

async function run() {
  await importPolicies();
  await importPincodes();
  console.log('\nImport Process Completed successfully.');
}

run().catch(console.error);
