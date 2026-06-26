const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

// 1. Load .env.local variables
const envPath = path.join(__dirname, '..', '.env.local');
let envVars = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/(^"|"$)/g, '');
      envVars[key] = val;
    }
  });
}

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Supabase environment variables not found in .env.local!');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

function generateAppId() {
  const randNum = Math.floor(100000 + Math.random() * 900000); // 6 digits
  return `H2H-APP-${randNum}`;
}

async function backfill() {
  console.log('Fetching applications without application_id...');
  
  // Check if column exists by doing a select query on one row
  const { data: testData, error: testError } = await supabase
    .from('applications')
    .select('id, application_id')
    .limit(1);

  if (testError) {
    if (testError.message && testError.message.includes('application_id')) {
      console.error('\nERROR: The column "application_id" does not exist in the "applications" table.');
      console.error('Please run the migration script "scripts/add-application-id.sql" in your Supabase SQL Editor first!\n');
      process.exit(1);
    } else {
      console.error('Database connection error:', testError);
      process.exit(1);
    }
  }

  // Fetch all applications where application_id is null
  const { data: apps, error: fetchError } = await supabase
    .from('applications')
    .select('id, client_name')
    .is('application_id', null);

  if (fetchError) {
    console.error('Error fetching applications:', fetchError);
    process.exit(1);
  }

  if (!apps || apps.length === 0) {
    console.log('No applications need backfilling.');
    return;
  }

  console.log(`Found ${apps.length} applications to backfill. Starting updates...`);

  let successCount = 0;
  for (const app of apps) {
    let uniqueId = generateAppId();
    let isUnique = false;
    let attempts = 0;

    // Retry loop to ensure uniqueness
    while (!isUnique && attempts < 5) {
      const { data: existing, error: checkError } = await supabase
        .from('applications')
        .select('id')
        .eq('application_id', uniqueId)
        .limit(1);

      if (!checkError && (!existing || existing.length === 0)) {
        isUnique = true;
      } else {
        uniqueId = generateAppId();
        attempts++;
      }
    }

    const { error: updateError } = await supabase
      .from('applications')
      .update({ application_id: uniqueId })
      .eq('id', app.id);

    if (updateError) {
      console.error(`Failed to update application ID ${app.id} (${app.client_name}):`, updateError.message);
    } else {
      console.log(`Updated Application ID ${app.id} (${app.client_name}) -> ${uniqueId}`);
      successCount++;
    }
  }

  console.log(`\nBackfill complete! Successfully updated ${successCount}/${apps.length} applications.`);
}

backfill();
