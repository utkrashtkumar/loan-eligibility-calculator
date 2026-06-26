const fs = require('fs');
const ws = require('ws');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing env keys!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

const updates = [
  { name: 'HDFC', url: 'https://upload.wikimedia.org/wikipedia/commons/2/28/HDFC_Bank_Logo.svg' },
  { name: 'AXIS', url: 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Axis_Bank_logo.svg' },
  { name: 'ICICI', url: 'https://upload.wikimedia.org/wikipedia/commons/1/12/ICICI_Bank_Logo.svg' },
  { name: 'KOTAK', url: 'https://upload.wikimedia.org/wikipedia/commons/8/82/Kotak_Mahindra_Bank_logo.svg' },
  { name: 'YES BANK', url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Yes_Bank_logo.svg' },
  { name: 'Tata Capital', url: 'https://upload.wikimedia.org/wikipedia/commons/e/ec/Tata_Capital_Logo.svg' },
  { name: 'Bajaj Finance', url: 'https://upload.wikimedia.org/wikipedia/commons/d/de/Bajaj_Finserv_Logo.svg' },
  { name: 'SMFG India Credit', url: 'https://upload.wikimedia.org/wikipedia/commons/b/ba/SMFG_India_Credit_logo.svg' },
  { names: ['Poonawalla Fincorp', 'Poonawalla Fincorp (Instant)', 'POONAWALLA (BL)'], url: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Poonawalla_Fincorp_Logo.svg' },
  { name: 'Hero Fincorp (Instant)', url: 'https://upload.wikimedia.org/wikipedia/commons/2/25/Hero_FinCorp_Logo_New_Final_2013_Vertical_Wiki.png' },
  { name: 'IDFC', url: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/IDFC_First_Bank_logo.svg' },
  { name: 'L&T (Instant)', url: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/L%26T_Finance_logo.svg' },
  { names: ['INDUSIND', 'IndusInd (Instant)'], url: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/IndusInd_Bank_logo.svg' },
  { names: ['Aditya Birla Capital', 'ADITYA BIRLA (BL)'], url: 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Aditya_Birla_Group_Logo.svg' },
  { names: ['Muthoot Finance SALARY (Instant)', 'Muthoot Finance', 'Muthoot Finance DAILY BUSINESS', 'Muthoot Finance MONTLY BUSINESS'], url: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Muthoot_Group_Logo.svg' },
  { name: 'FIBE', url: 'https://upload.wikimedia.org/wikipedia/commons/e/ea/Fibe_Logo.png' },
  { names: ['Incred', 'INCRED (BL)'], url: 'https://upload.wikimedia.org/wikipedia/commons/d/db/InCred_Logo.png' }
];

async function runUpdates() {
  console.log('Starting logo URL updates in bank_policies table...');
  let totalUpdated = 0;
  
  for (const item of updates) {
    try {
      let query = supabase.from('bank_policies').update({ logo_url: item.url });
      
      if (item.names) {
        query = query.in('bank_name', item.names);
        console.log(`Updating names [${item.names.join(', ')}] with ${item.url}...`);
      } else {
        query = query.eq('bank_name', item.name);
        console.log(`Updating name ${item.name} with ${item.url}...`);
      }
      
      const { data, error, status } = await query;
      if (error) {
        console.error(`Error updating bank:`, error.message);
      } else {
        totalUpdated++;
        console.log(`Updated successfully (status ${status})`);
      }
    } catch (e) {
      console.error('Exception updating bank:', e);
    }
  }
  
  console.log(`Finished updating. Total batches successful: ${totalUpdated}/${updates.length}`);
}

runUpdates();
