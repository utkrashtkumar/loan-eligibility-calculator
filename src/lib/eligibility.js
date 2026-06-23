import { supabase } from '@/lib/supabase';

/**
 * Check loan eligibility based on user profile.
 *
 * Steps:
 * 1. Look up banks that serve the given pincode (+ banks that serve ALL pincodes)
 * 2. Filter bank policies by salary, CIBIL, and loan type
 * 3. Calculate FOIR and filter by FOIR max
 * 4. Score each bank on salary, CIBIL, and FOIR margins
 * 5. Sort by match score descending
 *
 * @param {Object} params
 * @param {string} params.pincode - 6-digit pincode
 * @param {number} params.salary - Monthly salary
 * @param {number} params.creditScore - CIBIL score (300-900)
 * @param {number} params.existingEmi - Total existing monthly EMI
 * @param {string} params.loanType - 'PL' or 'BL' or 'ALL'
 * @returns {Promise<Array>} Eligible banks sorted by match score
 */
export async function checkEligibility({ pincode, salary, creditScore, existingEmi, loanType = 'ALL', employmentType = 'salaried', age, pfDeduction = 'yes' }) {
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
  // Salaried users ONLY see salary-based loans (employment_type = 'salaried')
  // Self-employed/instant users ONLY see instant loans (employment_type = 'self_employed' or 'both')
  const filteredPolicies = policies ? policies.filter(policy => {
    const policyEmpType = policy.employment_type || 'salaried';
    if (employmentType === 'salaried') {
      // Strict: only salary-based policies, never instant/both
      return policyEmpType === 'salaried';
    } else {
      // Instant loans: self_employed or both (never salaried)
      return policyEmpType === 'self_employed' || policyEmpType === 'both';
    }
  }) : [];

  const userFoir = salary > 0 ? (existingEmi / salary) * 100 : 0;
  const eligibleBanks = [];

  // Step 3: Process each pincode-serving bank
  for (const bankName of combinedBankNames) {
    const policy = filteredPolicies.find((p) => p.bank_name === bankName);

    if (policy) {
      // If policy is available, perform strict policy checks
      
      // 1. Check Loan Type
      if (loanType && loanType !== 'ALL' && policy.loan_type !== loanType) {
        continue;
      }

      // 2. Check Salary & CIBIL
      if (employmentType === 'salaried') {
        if (salary < policy.min_salary || creditScore < policy.min_cibil) {
          continue;
        }
      } else {
        // self_employed: match on CIBIL only, skip salary/turnover check
        if (creditScore < policy.min_cibil) {
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
      let salaryScore, foirScore;
      if (employmentType === 'salaried') {
        salaryScore =
          policy.min_salary > 0
            ? Math.min(((salary - policy.min_salary) / policy.min_salary) * 50, 50)
            : 50;

        const foirMax = policy.foir_max || 100;
        foirScore =
          foirMax > 0
            ? Math.min(((foirMax - userFoir) / foirMax) * 20, 20)
            : 20;
      } else {
        // self_employed defaults
        salaryScore = 40;
        foirScore = 15;
      }

      const cibilScore =
        policy.min_cibil > 0
          ? Math.min(((creditScore - policy.min_cibil) / policy.min_cibil) * 30, 30)
          : 30;

      let totalScore = Math.round(salaryScore + cibilScore + foirScore);
      totalScore = Math.max(60, Math.min(99, totalScore));

      eligibleBanks.push({
        ...policy,
        match_score: totalScore,
        user_foir: employmentType === 'salaried' ? Math.round(userFoir * 10) / 10 : 0,
      });
    } else {
      // If no policy is available, match purely on the basis of pincode (ignore policy requirements)
      
      // 1. Infer Loan Type
      const isInferredBl = bankName.toLowerCase().includes('(bl)') || bankName.toLowerCase().includes(' bl');
      const inferredLoanType = isInferredBl ? 'BL' : 'PL';

      if (loanType && loanType !== 'ALL' && inferredLoanType !== loanType) {
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
  // Deduplicate: remove any previous inquiries matching the same mobile number
  try {
    await supabase.from('user_inquiries').delete().eq('mobile', data.mobile);
  } catch (err) {
    console.error('Error deduplicating inquiries:', err);
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
