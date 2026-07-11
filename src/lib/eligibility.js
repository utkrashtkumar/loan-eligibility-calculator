import { supabase } from '@/lib/supabase';

/**
 * Check loan eligibility based on user profile.
 *
 * Steps:
 * 1. Look up banks that serve the given pincode (+ banks that serve ALL pincodes)
 * 2. Filter bank policies by salary/employment type, CIBIL, and loan category
 * 3. For salaried loans: calculate FOIR and filter by FOIR max
 * 4. For business loans: validate CIBIL, age, and sector criteria
 * 5. Score each bank on relevant margins
 * 6. Sort by match score descending
 *
 * @param {Object} params
 * @param {string} params.pincode - 6-digit pincode
 * @param {number} params.salary - Monthly salary (salaried loans only)
 * @param {number} params.creditScore - CIBIL score (300-900; -1 means no CIBIL)
 * @param {number} params.existingEmi - Total existing monthly EMI
 * @param {string} params.loanType - 'PL', 'BL', or 'ALL'
 * @param {string} params.employmentType - 'salaried' or 'self_employed'
 * @param {number} params.age - Applicant age in years
 * @param {string} params.pfDeduction - 'yes' or 'no'
 * @param {number} params.annualTurnover - Annual business turnover in INR (business loans)
 * @param {number} params.monthlyProfit - Monthly profit margin 0-1 fraction (business loans)
 * @param {string} params.businessVintage - e.g. '1 year', '2 years' (business loans)
 * @param {string} params.businessType - Sector: 'Manufacturing', 'Trading', 'Retail', or 'Service'
 * @returns {Promise<Array>} Eligible banks sorted by match score
 */
export async function checkEligibility({
  pincode, salary, creditScore, existingEmi,
  loanType = 'ALL', employmentType = 'salaried',
  age, pfDeduction = 'yes',
  annualTurnover = 0, monthlyProfit = 0, businessVintage = '', businessType = ''
}) {
  // Step 1a: Find banks serving this pincode
  const { data: pincodeData, error: pincodeError } = await supabase
    .from('bank_pincodes')
    .select('bank_name')
    .eq('pincode', pincode)
    .eq('is_active', true);

  if (pincodeError) {
    // Security (F11): Don't log Supabase error objects — they expose table names and schema.
    console.error('Pincode lookup failed. Check RLS and connectivity.');
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
    // Security (F11): Suppress detailed error in production.
    console.error('All-pincodes lookup failed.');
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
    // Security (F11): Suppress detailed error in production.
    console.error('Policy lookup failed. Check RLS and connectivity.');
    return [];
  }

  // Filter policies by employmentType in JS.
  // For BL (loanType === 'BL'): include only policy_category === 'business' (self_employed employment_type).
  // For salaried: include only policy_category === 'salary'.
  // For instant self_employed (PL): include only policy_category === 'instant'.
  const filteredPolicies = policies ? policies.filter(policy => {
    const policyEmpType = policy.employment_type || 'salaried';
    const policyCategory = policy.policy_category || '';

    if (loanType === 'BL') {
      // Business loan search: include only business policies
      return policyCategory === 'business';
    } else if (employmentType === 'salaried') {
      // Salary loan: only salary-type policies
      return policyEmpType === 'salaried' && policyCategory !== 'business';
    } else {
      // Instant loan (self_employed, PL): self_employed or both but NOT business
      return (policyEmpType === 'self_employed' || policyEmpType === 'both') && policyCategory !== 'business';
    }
  }) : [];

  const userFoir = salary > 0 ? (existingEmi / salary) * 100 : 0;

  // For business loans: compute FOIR using monthly profit amount as the income base
  const monthlyProfitAmount = (annualTurnover > 0 && monthlyProfit > 0)
    ? (annualTurnover / 12) * monthlyProfit
    : 0;
  const businessFoir = monthlyProfitAmount > 0 ? (existingEmi / monthlyProfitAmount) * 100 : 0;

  const eligibleBanks = [];

  // Step 3: Process each pincode-serving bank
  for (const bankName of combinedBankNames) {
    const hasAnyDbPolicy = policies ? policies.some((p) => p.bank_name === bankName) : false;
    const policy = filteredPolicies.find((p) => p.bank_name === bankName);

    if (policy) {
      // If policy is available, perform strict policy checks
      
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

      // 2. CIBIL check
      // PROTIUM waives CIBIL (min_cibil = 300 = any), all others need 700+.
      const isCibilOk = creditScore === -1
        ? policy.min_cibil <= 300
        : creditScore >= policy.min_cibil;

      if (!isCibilOk) continue;

      if (loanType === 'BL') {
        // --- Business Loan specific checks ---

        // 1. Annual Turnover: must be >= 50 Lac/yr
        const minTurnover = 5000000;
        if (annualTurnover > 0 && annualTurnover < minTurnover) continue;

        // 2. Monthly Profit margin: must be >= 10%
        const minProfit = 0.10;
        if (monthlyProfit > 0 && monthlyProfit < minProfit) continue;

        // 3. Business vintage: must be at least 1 year
        if (businessVintage) {
          const vintageYears = parseFloat(businessVintage) || 0;
          if (vintageYears < 1) continue;
        }

        // 4. Business Sector check: bank's company_category must include the applicant's sector
        if (businessType && policy.company_category) {
          const cat = policy.company_category.toLowerCase();
          // All 6 BL banks accept: Manufacturing, Trading, Retail, Service
          // If for some reason a bank's category doesn't include the user's sector, skip
          if (!cat.includes('all') && !cat.includes(businessType.toLowerCase())) continue;
        }

        // 5. Business FOIR check using monthly profit amount as income base
        // Policy foir_max is 60% for all BL banks
        const blFoirMax = policy.foir_max || 60;
        if (monthlyProfitAmount > 0 && businessFoir > blFoirMax) continue;

      } else if (employmentType === 'salaried') {
        // --- Salary Loan checks ---
        if (salary < policy.min_salary) continue;

        // FOIR check
        if (userFoir > (policy.foir_max || 100)) continue;
      }
      // self_employed instant: CIBIL already checked above, no salary/turnover constraint

      // 4. Check PF Deduction
      // If bank requires PF and user does NOT have PF deduction, skip this bank
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

      // Calculate match score
      let primaryScore, secondaryScore;

      if (loanType === 'BL') {
        // Business Loan scoring (100 pts total):
        // - CIBIL margin   (0-35): how far above minimum CIBIL
        // - Turnover score (0-25): higher turnover = better score
        // - FOIR score     (0-25): lower FOIR against turnover = better score
        // - Vintage score  (0-15): longer running business = better score
        const effectiveCibil = creditScore === -1 ? 300 : creditScore;
        const minCibil = policy.min_cibil > 0 ? policy.min_cibil : 300;
        const cibilMargin = Math.min(((effectiveCibil - minCibil) / (900 - minCibil)) * 35, 35);

        const turnoverScore = annualTurnover >= 10000000 ? 25
          : annualTurnover >= 7500000 ? 20
          : annualTurnover >= 5000000 ? 14 : 10;

        // FOIR score: 0 EMI => full 25pts; at foir_max (60%) => 0pts
        const blFoirMax = policy.foir_max || 60;
        const foirScore = monthlyProfitAmount > 0
          ? Math.max(0, Math.min(25, ((blFoirMax - businessFoir) / blFoirMax) * 25))
          : 20; // If no turnover entered, assume average

        const vintageYears = parseFloat(businessVintage) || 1;
        const vintageScore = vintageYears >= 5 ? 15 : vintageYears >= 3 ? 12 : vintageYears >= 2 ? 9 : 5;

        let totalScore = Math.round(cibilMargin + turnoverScore + foirScore + vintageScore);
        totalScore = Math.max(60, Math.min(99, totalScore));

        // Bonus for PROTIUM (no CIBIL requirement = easier approval for borderline scores)
        if (policy.bank_name && policy.bank_name.includes('PROTIUM') && effectiveCibil >= 300) {
          totalScore = Math.min(99, totalScore + 5);
        }

        eligibleBanks.push({
          ...policy,
          match_score: totalScore,
          user_foir: Math.round(businessFoir * 10) / 10,
          annual_turnover: annualTurnover,
          monthly_profit: monthlyProfit,
          business_vintage: businessVintage,
          business_type: businessType,
        });
      } else if (employmentType === 'salaried') {
        primaryScore =
          policy.min_salary > 0
            ? Math.min(((salary - policy.min_salary) / policy.min_salary) * 50, 50)
            : 50;

        const foirMax = policy.foir_max || 100;
        secondaryScore =
          foirMax > 0
            ? Math.min(((foirMax - userFoir) / foirMax) * 20, 20)
            : 20;

        const effectiveCreditScore = creditScore === -1 ? 300 : creditScore;
        const cibilScore =
          policy.min_cibil > 0
            ? Math.min(((effectiveCreditScore - policy.min_cibil) / policy.min_cibil) * 30, 30)
            : 30;

        let totalScore = Math.round(primaryScore + cibilScore + secondaryScore);
        totalScore = Math.max(60, Math.min(99, totalScore));

        eligibleBanks.push({
          ...policy,
          match_score: totalScore,
          user_foir: Math.round(userFoir * 10) / 10,
        });
      } else {
        // Instant self_employed scoring
        const effectiveCreditScore = creditScore === -1 ? 300 : creditScore;
        const cibilScore =
          policy.min_cibil > 0
            ? Math.min(((effectiveCreditScore - policy.min_cibil) / policy.min_cibil) * 30, 30)
            : 30;
        let totalScore = Math.round(40 + cibilScore + 15);
        totalScore = Math.max(60, Math.min(99, totalScore));

        eligibleBanks.push({
          ...policy,
          match_score: totalScore,
          user_foir: 0,
        });
      }
    } else if (!hasAnyDbPolicy) {
      // If no policy is available in the database, match purely on the basis of pincode (ignore policy requirements)
      
      // 1. Infer Loan Type
      const isInferredBl = bankName.toLowerCase().includes('(bl)') || bankName.toLowerCase().includes(' bl');
      const inferredLoanType = isInferredBl ? 'BL' : 'PL';
      const inferredCategory = inferredLoanType === 'BL' ? 'business' : (employmentType === 'salaried' ? 'salary' : 'instant');

      const expectedCategory = loanType === 'BL' ? 'business' : (employmentType === 'salaried' ? 'salary' : 'instant');
      if (inferredCategory !== expectedCategory) {
        continue;
      }

      // 2. Check Age Range (default 21-60 for inferred policy)
      if (age !== undefined && age !== null) {
        const userAge = Number(age);
        if (userAge < 21 || userAge > 60) {
          continue;
        }
      }

      eligibleBanks.push({
        id: `temp-${bankName}`,
        bank_name: bankName,
        min_age: 21,
        max_age: 60,
        min_cibil: 300, // No requirement
        min_salary: 0,   // No requirement
        company_category: 'ALL TYPES',
        pf_required: 'No',
        foir_max: 100,
        min_experience: 'N/A',
        min_residence_stability: 'N/A',
        loan_type: inferredLoanType,
        policy_category: inferredCategory,
        all_pincodes: false,
        special_notes: 'Matched based on pincode serviceability',
        logo_url: null,
        match_score: 75, // Default neutral matching score for pincode match
        user_foir: employmentType === 'salaried' ? Math.round(userFoir * 10) / 10 : 0,
      });
    }
  }

  // Step 4: Sort by match score descending
  eligibleBanks.sort((a, b) => b.match_score - a.match_score);

  return eligibleBanks;
}

/**
 * Save user inquiry along with eligible bank results for lead tracking.
 */
export async function saveInquiry(data) {
  // Security (F4): Scope delete to this user's own previous inquiry for the phone number.
  // Without user_id scoping, any agent could wipe all leads for any phone number.
  try {
    const deleteQuery = supabase.from('user_inquiries').delete().eq('mobile', data.mobile);
    if (data.userId) {
      await deleteQuery.eq('user_id', data.userId);
    }
    // If no userId (unauthenticated check), skip deletion to prevent anonymous wiping
  } catch (err) {
    console.error('Error deduplicating inquiries.');
  }

  const { error } = await supabase.from('user_inquiries').insert([
    {
      name: data.name,
      mobile: data.mobile,
      current_address: data.currentAddress,
      permanent_address: data.permanentAddress,
      pincode: data.pincode,
      salary: data.salary,
      existing_emi: data.existingEmi,
      credit_score: data.creditScore,
      eligible_banks: data.eligibleBanks || [],
      user_id: data.userId || null,
      employment_type: data.employmentType || 'salaried',
      dob: data.dob || null,
      created_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    console.error('Error saving inquiry:', error);
    return { success: false, error };
  }

  return { success: true };
}
