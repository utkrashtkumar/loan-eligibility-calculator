const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

// 1. Load .env.local variables
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/(^"|"$)/g, '');
      process.env[key] = val;
    }
  });
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Supabase environment variables not found in .env.local!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

const folder = 's:\\calculator\\bank policy';

// 2. Define exact database mappings
const mappings = {
  // Business Loans
  'BUSINESS LOAN POLICY.xlsx': {
    'INCRED': 'INCRED (BL)',
    'INDIFI': 'INDIFI (BL)',
    'FLEXI': 'FLEXI (BL)',
    'POONAWALLA': 'POONAWALLA (BL)',
    'PROTIUM': 'PROTIUM (BL)',
    'ADITIYA BIRLA': 'ADITYA BIRLA (BL)'
  },
  // Instant Loans
  'INSTANT LOAN POLICY.xlsx': {
    'Muthoot Finance DAILY BUSINESS': 'Muthoot Finance DAILY BUSINESS',
    'Muthoot Finance MONTLY BUSINESS': 'Muthoot Finance MONTLY BUSINESS',
    'Muthoot Finance SALARY': 'Muthoot Finance SALARY (Instant)',
    'Poonawalla Fincorp': 'Poonawalla Fincorp (Instant)',
    'Hero Fincorp': 'Hero Fincorp (Instant)',
    'Unity Small Finance Bank': 'Unity Small Finance Bank (Instant)',
    'L&T': 'L&T (Instant)',
    'Prefr': 'Prefr (Instant)',
    'DMI': 'DMI (Instant)',
    'IndusInd': 'IndusInd (Instant)',
    'Bharat Pe': 'Bharat Pe (Instant)',
    'Credit Sea': 'Credit Sea (Instant)',
    'Ring': 'Ring (Instant)'
  },
  // Salary Loans
  'SALARY LOAN POLICY_NEW.xlsx': {
    'Incred': 'Incred',
    'Finnable': 'Finnable',
    'INDUSIND': 'INDUSIND',
    'Muthoot Finance': 'Muthoot Finance',
    'FIBE': 'FIBE',
    'HDFC': 'HDFC',
    'AXIS': 'AXIS',
    'ICICI': 'ICICI',
    'SMFG India Credit': 'SMFG India Credit',
    'Poonawalla Fincorp': 'Poonawalla Fincorp',
    'Tata Capital': 'Tata Capital',
    'Bajaj Finance': 'Bajaj Finance',
    'KOTAK': 'KOTAK',
    'YES BANK': 'YES BANK',
    'Piramal': 'Piramal',
    'Aditya Birla Capital': 'Aditya Birla Capital',
    'Fullerton Finance': 'Fullerton Finance',
    'IDFC': 'IDFC'
  }
};

async function syncAll() {
  console.log('Fetching existing database policies list...');
  const { data: dbPolicies, error: dbError } = await supabase
    .from('bank_policies')
    .select('id, bank_name, loan_type, policy_category');

  if (dbError) {
    console.error('Error fetching database policies:', dbError);
    return;
  }
  console.log(`Loaded ${dbPolicies.length} bank policies from Supabase.\n`);

  for (const [fileName, fileMap] of Object.entries(mappings)) {
    const filePath = path.join(folder, fileName);
    console.log(`Processing file: ${fileName}...`);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: File not found at ${filePath}, skipping.`);
      continue;
    }

    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      for (const row of data) {
        // Find keys case-insensitively
        const nbfcKey = Object.keys(row).find(k => k.toLowerCase() === 'nbfc');
        const linkKey = Object.keys(row).find(k => k.toLowerCase().includes('link'));
        const userKey = Object.keys(row).find(k => k.toLowerCase().includes('user id') || k.toLowerCase().includes('username') || k.toLowerCase() === 'user');
        const passKey = Object.keys(row).find(k => k.toLowerCase().includes('password') || k.toLowerCase().includes('otp'));
        
        const rawNbfc = nbfcKey ? String(row[nbfcKey]).trim() : '';
        const rawLink = linkKey ? String(row[linkKey]).trim() : '';
        const rawUser = userKey ? String(row[userKey]).trim() : '';
        const rawPass = passKey ? String(row[passKey]).trim() : '';

        if (!rawNbfc) continue;

        // Map to exact database bank_name
        const dbBankName = fileMap[rawNbfc];
        if (!dbBankName) {
          console.warn(`  [SKIP] Could not match Excel NBFC "${rawNbfc}" to database. Please check naming.`);
          continue;
        }

        // Find match in database
        const dbMatch = dbPolicies.find(p => p.bank_name === dbBankName);
        if (!dbMatch) {
          console.warn(`  [SKIP] DB name "${dbBankName}" matched, but no policy row exists in the database.`);
          continue;
        }

        // Clean & process values
        let directSubmit = false;
        let applyUrl = '';
        let portalUsername = '';
        let portalPassword = '';

        // Determine if direct submit is forced
        if (rawLink.toLowerCase().includes('contact admin') || rawLink === '') {
          directSubmit = true;
        } else {
          applyUrl = rawLink;
        }

        // Clean username
        if (rawUser && !rawUser.toLowerCase().includes('access through link') && !rawUser.toLowerCase().includes('contact admin')) {
          portalUsername = rawUser;
        }

        // Clean password
        if (rawPass && !rawPass.toLowerCase().includes('access through link')) {
          // If the password field contains Contact details but direct submit is true, we keep it as instructions
          portalPassword = rawPass;
        }

        console.log(`  [UPDATE] Matching Excel "${rawNbfc}" -> DB "${dbBankName}" (ID: ${dbMatch.id})`);
        console.log(`    Link: "${applyUrl}" | Direct Submit: ${directSubmit}`);
        console.log(`    User: "${portalUsername}" | Pass/OTP: "${portalPassword}"`);

        // Perform update
        const { error: updateError } = await supabase
          .from('bank_policies')
          .update({
            apply_url: applyUrl || null,
            portal_username: portalUsername || null,
            portal_password: portalPassword || null,
            direct_submit: directSubmit
          })
          .eq('id', dbMatch.id);

        if (updateError) {
          console.error(`    [ERROR] Failed to update ID ${dbMatch.id}:`, updateError.message);
        } else {
          console.log(`    [SUCCESS] Updated policy record successfully!`);
        }
      }
    } catch (err) {
      console.error(`Error processing file ${fileName}:`, err.message);
    }
    console.log();
  }

  console.log('All Excel policy portal details synced to Supabase successfully!');
}

syncAll();
