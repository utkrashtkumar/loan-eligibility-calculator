const { createClient } = require('@supabase/supabase-js');
const ws = require('ws');

const SUPABASE_URL = 'https://tyysljzwakrxweanhvvr.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5eXNsanp3YWtyeHdlYW5odnZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMjUyNTUsImV4cCI6MjA5NjYwMTI1NX0.88mkOUPqZZBpXvaYSrKirzMD_2ldreUmCzFZlpfmCt0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws }
});

async function simulateCheckEligibility({ pincode, salary, creditScore, existingEmi, loanType = 'ALL', employmentType = 'salaried', age, pfDeduction = 'yes' }) {
  // Step 1a: Find banks serving this pincode
  const { data: pincodeData, error: pincodeError } = await supabase
    .from('bank_pincodes')
    .select('bank_name')
    .eq('pincode', pincode)
    .eq('is_active', true);

  if (pincodeError) {
    console.error('Pincode lookup error:', pincodeError);
    return [];
  }

  // Extract unique bank names from pincode matches
  const pincodeBanks = pincodeData
    ? [...new Set(pincodeData.map((row) => row.bank_name))]
    : [];

  // Step 1b: Also get banks that serve ALL pincodes (e.g., INDUSIND)
  const { data: allPincodeBanks, error: allPincodeError } = await supabase
    .from('bank_policies')
    .select('bank_name')
    .eq('all_pincodes', true);

  if (allPincodeError) {
    console.error('All-pincodes lookup error:', allPincodeError);
  }

  // Combine both lists
  const allPincodeBankNames = allPincodeBanks
    ? allPincodeBanks.map((row) => row.bank_name)
    : [];
  const combinedBankNames = [...new Set([...pincodeBanks, ...allPincodeBankNames])];

  if (combinedBankNames.length === 0) {
    return [];
  }

  // Step 2: Query all policies for these banks (without filtering salary/cibil in SQL query)
  const { data: policies, error: policyError } = await supabase
    .from('bank_policies')
    .select('*')
    .in('bank_name', combinedBankNames);

  if (policyError) {
    console.error('Policy lookup error:', policyError);
    return [];
  }

  // Filter policies by employmentType in JS
  const filteredPolicies = policies ? policies.filter(policy => {
    const policyEmpType = policy.employment_type || 'salaried';
    if (employmentType === 'salaried') {
      return policyEmpType === 'salaried';
    } else {
      return policyEmpType === 'self_employed' || policyEmpType === 'both';
    }
  }) : [];

  const userFoir = salary > 0 ? (existingEmi / salary) * 100 : 0;
  const eligibleBanks = [];

  // Step 3: Process each pincode-serving bank
  for (const bankName of combinedBankNames) {
    const hasAnyDbPolicy = policies ? policies.some((p) => p.bank_name === bankName) : false;
    const policy = filteredPolicies.find((p) => p.bank_name === bankName);

    if (policy) {
      // 1. Check Loan Category
      const expectedCategory = loanType === 'BL' ? 'business' : (employmentType === 'salaried' ? 'salary' : 'instant');
      if (policy.policy_category) {
        if (policy.policy_category !== expectedCategory) {
          continue;
        }
      } else {
        if (loanType && loanType !== 'ALL' && policy.loan_type !== loanType) {
          continue;
        }
      }

      // 2. Check Salary & CIBIL
      const isCibilOk = creditScore === -1 
        ? policy.min_cibil <= 300 
        : creditScore >= policy.min_cibil;

      if (employmentType === 'salaried') {
        if (salary < policy.min_salary || !isCibilOk) {
          continue;
        }
      } else {
        if (!isCibilOk) {
          continue;
        }
      }

      // 3. Check FOIR
      if (employmentType === 'salaried') {
        if (userFoir > (policy.foir_max || 100)) {
          continue;
        }
      }

      // 4. Check PF Deduction
      const bankRequiresPF = (policy.pf_required || '').toLowerCase() === 'yes';
      if (bankRequiresPF && pfDeduction === 'no') {
        continue;
      }

      // 5. Check Age Range
      if (age !== undefined && age !== null) {
        const userAge = Number(age);
        if (userAge < (policy.min_age || 21) || userAge > (policy.max_age || 60)) {
          continue;
        }
      }

      eligibleBanks.push({
        bank_name: bankName,
        category: policy.policy_category,
        employment_type: policy.employment_type,
        type: 'database'
      });
    } else if (!hasAnyDbPolicy) {
      // Inferred matching
      const isInferredBl = bankName.toLowerCase().includes('(bl)') || bankName.toLowerCase().includes(' bl');
      const inferredLoanType = isInferredBl ? 'BL' : 'PL';
      const inferredCategory = inferredLoanType === 'BL' ? 'business' : (employmentType === 'salaried' ? 'salary' : 'instant');

      const expectedCategory = loanType === 'BL' ? 'business' : (employmentType === 'salaried' ? 'salary' : 'instant');
      if (inferredCategory !== expectedCategory) {
        continue;
      }

      eligibleBanks.push({
        bank_name: bankName,
        category: inferredCategory,
        employment_type: employmentType,
        type: 'inferred'
      });
    }
  }

  return eligibleBanks;
}

async function runTest() {
  const testPin = '800021';
  console.log(`=== Testing eligibility matching for pincode: "${testPin}" ===\n`);

  console.log('--- TEST 1: Salaried (Salary Loans) ---');
  const salariedResults = await simulateCheckEligibility({
    pincode: testPin,
    salary: 50000,
    creditScore: 750,
    existingEmi: 10000,
    loanType: 'ALL',
    employmentType: 'salaried',
    age: 30,
    pfDeduction: 'yes'
  });
  console.log(`Total Salaried matched: ${salariedResults.length}`);
  salariedResults.forEach(r => {
    console.log(`- Bank: ${r.bank_name.padEnd(45)} | Category: ${r.category.padEnd(10)} | EmpType: ${r.employment_type} | Mode: ${r.type}`);
  });

  console.log('\n--- TEST 2: Self-Employed (Instant Loans) ---');
  const selfEmployedResults = await simulateCheckEligibility({
    pincode: testPin,
    salary: 0,
    creditScore: 750,
    existingEmi: 0,
    loanType: 'ALL',
    employmentType: 'self_employed',
    age: 30,
    pfDeduction: 'no'
  });
  console.log(`Total Self-Employed matched: ${selfEmployedResults.length}`);
  selfEmployedResults.forEach(r => {
    console.log(`- Bank: ${r.bank_name.padEnd(45)} | Category: ${r.category.padEnd(10)} | EmpType: ${r.employment_type} | Mode: ${r.type}`);
  });
}

runTest();
