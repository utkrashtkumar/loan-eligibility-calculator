'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { checkEligibility, saveInquiry } from '@/lib/eligibility';
import BankLogo from '@/components/BankLogo';

const calculateAge = (dobString) => {
  if (!dobString) return null;
  const today = new Date();
  const birthDate = new Date(dobString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const BANK_AFFILIATE_LINKS = {
  'POONAWALLA': 'https://instant-pocket-loan.poonawallafincorp.com/?utm_DSA_Code=PKA00192&UTM_Partner_Name=BuddyLoan&UTM_Partner_Medium=hand2handloans_bl_dsa',
  'UNITY BANK': 'https://loans.theunitybank.com/unity-pl-ui/page/exclusion/login/logindetails?utm_source=buddyloan&utm_medium=hand2handloans_bl_dsa&utm_campaign=DSA',
  'PREFR': 'https://marketplace.prefr.com/buddyloan/GetStarted?startPage=base',
  'HERO': 'https://loans.apps.herofincorp.com/en/personal-loan?utm_campaign=buddyloan_rdf_26&utm_content=hand2handloans_bl_dsa&af_xp=custom&pid=partnership_bdl&is_retargeting=true&af_reengagement_window=30d&c=buddyloan_rdf_26&utm_source=partnership_bdl',
  'BHARATPE': 'https://consumer-credit.bharatpe.in/creditHome.html?utm_campaign=trillionloan&utm_campaign=trillionloans&utm_partner=BLTL&utm_content=DSA&utm_medium=swiftloans_dsa_Hand2Handloans',
  'CREDIT SEA': 'https://www.creditsea.com/onboarding/sign-up/enter-mobile?source=31697402&medium=DSA&campaign=ELDSA_dsa_Hand2Handloans',
  'DMI': 'https://play.google.com/store/apps/details?id=in.dmifinance.app&referrer=utm_source%3DMymoneymantra%26utm_medium%3DHandtohandloan%26utm_term%3D1100110011%26utm_campaign%3DEARNTRA',
  'L&T': 'https://www.moneycontrolpay.com/?utm_source=ILB&utm_campaign=RohanGupta',
  'FIBE': 'https://portal.fibe.in/easy-loan?utm_medium=hand2handloans_bl_dsa&campaignid=dsa&utm_source=BUDDYLOANPA',
  'MUTHOOT DAILY BL': 'https://creditlink.finbox.in/?partnerCode=LS_NUSHZC&agentCode=sc113356&productType=business_loan_edi&agentId=hand2handloans_bl_dsa',
  'MUTHOOT MONTHLY BL': 'https://creditlink.finbox.in/?partnerCode=LS_POIOUY&agentCode=sc113356&productType=business_loan_emi&agentId=hand2handloans_bl_dsa',
  'MUTHOOT MONTHLY PL': 'https://creditlink.finbox.in/?partnerCode=LS_POIOUY&agentCode=sc113356&productType=business_loan_emi&agentId=hand2handloans_bl_dsa',
  'INCRED PL': 'https://pl.incred.com/open-market-sales/login',
  'FINNABLE': 'https://partner.finnable.com/auth/login'
};

const getAffiliateLink = (bankName, loanType = 'PL', muthootSubType = 'daily') => {
  if (!bankName) return null;
  const normalized = bankName.toUpperCase();
  
  if (normalized.includes('MUTHOOT')) {
    if (loanType === 'BL') {
      if (muthootSubType === 'monthly') {
        return BANK_AFFILIATE_LINKS['MUTHOOT MONTHLY BL'];
      }
      return BANK_AFFILIATE_LINKS['MUTHOOT DAILY BL'];
    }
    return BANK_AFFILIATE_LINKS['MUTHOOT MONTHLY PL'];
  }
  
  if (normalized.includes('INCRED')) {
    return BANK_AFFILIATE_LINKS['INCRED PL'];
  }
  
  if (normalized.includes('FINNABLE')) {
    return BANK_AFFILIATE_LINKS['FINNABLE'];
  }

  if (normalized.includes('POONAWALLA') || normalized.includes('POONWALA')) return BANK_AFFILIATE_LINKS['POONAWALLA'];
  if (normalized.includes('UNITY')) return BANK_AFFILIATE_LINKS['UNITY BANK'];
  if (normalized.includes('PREFR')) return BANK_AFFILIATE_LINKS['PREFR'];
  if (normalized.includes('HERO')) return BANK_AFFILIATE_LINKS['HERO'];
  if (normalized.includes('BHARATPE') || normalized.includes('BHARAT PE')) return BANK_AFFILIATE_LINKS['BHARATPE'];
  if (normalized.includes('CREDIT SEA') || normalized.includes('CREDITSEA')) return BANK_AFFILIATE_LINKS['CREDIT SEA'];
  if (normalized.includes('DMI')) return BANK_AFFILIATE_LINKS['DMI'];
  if (normalized.includes('L&T') || normalized.includes('L & T') || normalized.includes('LANDT')) return BANK_AFFILIATE_LINKS['L&T'];
  if (normalized.includes('FIBE')) return BANK_AFFILIATE_LINKS['FIBE'];
  return null;
};

const INITIAL_FORM = {
  name: '',
  mobile: '',
  dob: '',
  currentAddress: '',
  permanentAddress: '',
  sameAddress: false,
  pincode: '',
  salary: '',
  existingEmi: '',
  creditScore: '',
  loanType: 'ALL',
  employmentType: 'salaried',
};

export default function CheckPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [errors, setErrors] = useState({});

  const [userProfile, setUserProfile] = useState(null);

  // Modal states for Agent client applications
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState(null);
  const [clientName, setClientName] = useState('');
  const [clientMobile, setClientMobile] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [applying, setApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState('');
  const [applyError, setApplyError] = useState('');
  const [muthootSubType, setMuthootSubType] = useState('daily');

  // Ensure user is authenticated
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?redirect=/check');
      } else {
        setUser(session.user);

        // Retrieve role/agent status
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        if (profile) {
          setUserProfile(profile);
        }
        
        // Pre-fill user name from metadata if available
        if (session.user?.user_metadata?.full_name) {
          setFormData(prev => ({
            ...prev,
            name: session.user.user_metadata.full_name
          }));
        }
        setCheckingAuth(false);
      }
    }
    checkAuth();
  }, [router]);

  /* ---------- helpers ---------- */
  const updateField = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Sync permanent address when checkbox is on
      if (field === 'sameAddress' && value) {
        next.permanentAddress = next.currentAddress;
      }
      if (field === 'currentAddress' && prev.sameAddress) {
        next.permanentAddress = value;
      }
      return next;
    });
    // Clear error for that field
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const inputClass = (field) => {
    if (errors[field]) return 'input-field error';
    if (formData[field] && !errors[field]) return 'input-field valid';
    return 'input-field';
  };

  /* ---------- validation ---------- */
  const validateForm = () => {
    const newErrors = {};

    // Personal Validation
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile.trim())) {
      newErrors.mobile = 'Enter a valid 10-digit mobile number';
    }
    if (!formData.dob) {
      newErrors.dob = 'Date of birth is required';
    } else {
      const age = calculateAge(formData.dob);
      if (age === null || age < 18) {
        newErrors.dob = 'You must be at least 18 years old';
      }
    }

    // Address Validation
    if (!formData.currentAddress.trim())
      newErrors.currentAddress = 'Current address is required';
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Enter a valid 6-digit pincode';
    }

    // Financial Validation
    if (formData.employmentType === 'salaried' && (!formData.salary || Number(formData.salary) <= 0))
      newErrors.salary = 'Monthly salary is required';
    // Self-employed/instant loans: no salary required
    if (!formData.creditScore) {
      newErrors.creditScore = 'Credit score is required';
    } else if (
      Number(formData.creditScore) < 300 ||
      Number(formData.creditScore) > 900
    ) {
      newErrors.creditScore = 'Credit score must be between 300 and 900';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Agent Application handlers
  const handleOpenApplyModal = (bank) => {
    setSelectedBank(bank);
    setClientName(formData.name || '');
    setClientMobile(formData.mobile || '');
    setLoanAmount('');
    setApplySuccess('');
    setApplyError('');
    setApplyModalOpen(true);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!clientName.trim() || !clientMobile.trim() || !loanAmount) {
      setApplyError('Please fill in all fields.');
      return;
    }
    if (!/^\d{10}$/.test(clientMobile.trim())) {
      setApplyError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (Number(loanAmount) <= 0) {
      setApplyError('Please enter a valid loan amount.');
      return;
    }

    setApplying(true);
    setApplyError('');
    setApplySuccess('');

    try {
      const affiliateLink = getAffiliateLink(selectedBank.bank_name, selectedBank.loan_type, muthootSubType);

      const { data: insertData, error } = await supabase.from('applications').insert({
        agent_id: user.id,
        client_name: clientName.trim(),
        client_mobile: clientMobile.trim(),
        bank_name: selectedBank.bank_name,
        loan_amount: Number(loanAmount),
        loan_type: selectedBank.loan_type,
        commission_rate: 2.00,
        commission_amount: Number(loanAmount) * 0.02,
        status: affiliateLink ? 'applied' : 'Applied'
      }).select('id');

      if (error) {
        setApplyError(error.message);
      } else {
        if (affiliateLink) {
          const insertedId = insertData && insertData[0]?.id;
          if (insertedId) {
            localStorage.setItem('pending_status_update', JSON.stringify({
              appId: insertedId,
              bankName: selectedBank.bank_name,
              clientName: clientName.trim()
            }));
          }
          setApplySuccess(`Application recorded! Opening affiliate link in a new tab...`);
          window.open(affiliateLink, '_blank');
        } else {
          setApplySuccess(`Successfully applied to ${selectedBank.bank_name} for ${clientName}!`);
        }
        setTimeout(() => {
          setApplyModalOpen(false);
        }, 2000);
      }
    } catch (err) {
      setApplyError('An unexpected error occurred.');
      console.error(err);
    } finally {
      setApplying(false);
    }
  };

  /* ---------- submit ---------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      // Scroll to the first error
      const firstErrorKey = Object.keys(errors)[0];
      if (firstErrorKey) {
        const element = document.getElementsByName(firstErrorKey)[0];
        if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setLoading(true);

    try {
      const salary = Number(formData.salary);
      const existingEmi = Number(formData.existingEmi) || 0;
      const creditScore = Number(formData.creditScore);
      const age = calculateAge(formData.dob);

      const eligible = await checkEligibility({
        pincode: formData.pincode.trim(),
        salary,
        creditScore,
        existingEmi,
        loanType: formData.loanType,
        employmentType: formData.employmentType,
        age,
      });

      setResults(eligible);
      setShowResults(true);

      // Save inquiry with userId linked
      await saveInquiry({
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        dob: formData.dob || null,
        currentAddress: formData.currentAddress.trim(),
        permanentAddress: formData.permanentAddress.trim() || formData.currentAddress.trim(),
        pincode: formData.pincode.trim(),
        salary,
        existingEmi,
        creditScore,
        eligibleBanks: eligible.map((b) => b.bank_name),
        userId: user?.id || null,
        employmentType: formData.employmentType,
      });
    } catch (err) {
      console.error('Eligibility check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- reset ---------- */
  const handleReset = () => {
    setFormData({
      ...INITIAL_FORM,
      name: user?.user_metadata?.full_name || ''
    });
    setResults([]);
    setShowResults(false);
    setErrors({});
  };

  /* ---------- computed values ---------- */
  const userFoir =
    formData.employmentType === 'salaried' && formData.salary && Number(formData.salary) > 0
      ? (((Number(formData.existingEmi) || 0) / Number(formData.salary)) * 100).toFixed(1)
      : formData.employmentType === 'self_employed' ? 'N/A' : '0';

  if (checkingAuth) {
    return (
      <>
        <Header />
        <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
          <div className="text-center">
            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '16px', color: 'var(--color-text-secondary)' }}>Verifying Account...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="main-content">
        <section className="form-page" style={{ padding: '48px 24px' }}>
          <div className="form-container" style={{ maxWidth: showResults ? '1200px' : '1100px' }}>
            
            {/* -------- LOADING STATE -------- */}
            {loading && (
              <div className="loading-overlay" style={{ backdropFilter: 'blur(24px)' }}>
                <div className="loading-spinner"></div>
                <p className="loading-text" style={{ background: 'var(--gradient-text)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Analyzing Your Profile...
                </p>
                <p className="loading-subtext">
                  Matching your data against bank policies and pincode coverage
                </p>
              </div>
            )}

            {/* -------- RESULTS VIEW -------- */}
            {!loading && showResults && (
              <div className="results-section">
                <div className="results-header text-center" style={{ marginBottom: '40px' }}>
                  <div className="results-count" style={{ background: 'var(--gradient-primary)' }}>
                    {results.length}
                  </div>
                  <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 700, marginTop: '16px' }}>
                    {results.length > 0
                      ? `Bank${results.length > 1 ? 's' : ''} Eligible for You`
                      : 'No Matching Banks Found'}
                  </h2>
                  <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                    {formData.employmentType === 'salaried'
                      ? 'Based on pincode availability, minimum salary, CIBIL, and FOIR ratio.'
                      : 'Based on pincode availability and CIBIL score (Instant Loans).'}
                  </p>
                </div>

                {/* User Profile Summary */}
                <div className="profile-summary" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '16px',
                  background: 'var(--color-bg-card)',
                  border: 'var(--border-light)',
                  borderRadius: 'var(--border-radius-lg)',
                  padding: '24px',
                  marginBottom: '32px',
                  backdropFilter: 'blur(20px)'
                }}>
                  {formData.employmentType === 'salaried' && (
                  <div className="profile-item">
                    <div className="profile-item-label">
                      Monthly Salary
                    </div>
                    <div className="profile-item-value">
                      ₹{Number(formData.salary).toLocaleString('en-IN')}
                    </div>
                  </div>
                  )}
                  <div className="profile-item">
                    <div className="profile-item-label">CIBIL Score</div>
                    <div className="profile-item-value" style={{ color: 'var(--color-success)' }}>
                      {formData.creditScore}
                    </div>
                  </div>
                  <div className="profile-item">
                    <div className="profile-item-label">Input Pincode</div>
                    <div className="profile-item-value">{formData.pincode}</div>
                  </div>
                  {formData.employmentType === 'salaried' && (
                  <div className="profile-item">
                    <div className="profile-item-label">Calculated FOIR</div>
                    <div className="profile-item-value" style={{ color: Number(userFoir) > 50 ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>
                      {userFoir}%
                    </div>
                  </div>
                  )}
                  <div className="profile-item">
                    <div className="profile-item-label">Loan Category</div>
                    <div className="profile-item-value" style={{ color: formData.employmentType === 'salaried' ? 'var(--color-primary)' : 'var(--color-accent)' }}>
                      {formData.employmentType === 'salaried' ? '💼 Salary Loan' : '⚡ Instant Loan'}
                    </div>
                  </div>
                </div>

                {/* Bank Grid */}
                {results.length > 0 ? (
                  <div className="results-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(320px, 100%), 1fr))', gap: '24px' }}>
                    {results.map((bank) => (
                      <ResultCard 
                        key={bank.id} 
                        bank={bank} 
                        isAgent={userProfile?.role === 'agent' || userProfile?.role === 'admin'}
                        onApply={handleOpenApplyModal}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="no-results" style={{
                    background: 'var(--color-bg-card)',
                    border: 'var(--border-error)',
                    borderRadius: 'var(--border-radius-lg)',
                    padding: '48px 32px',
                    textAlign: 'center',
                    backdropFilter: 'blur(20px)'
                  }}>
                    <div className="no-results-icon" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-error)' }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <h3 className="no-results-title" style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--color-error)' }}>
                      No Matching Lenders Found
                    </h3>
                    <p className="no-results-text" style={{ color: 'var(--color-text-secondary)', maxWidth: '500px', margin: '8px auto 24px' }}>
                      Based on your input details, we couldn&apos;t find any banks or NBFCs serving your pincode that match your credit and FOIR profiles.
                    </p>
                    <ul className="tips-list" style={{ textAlign: 'left', maxWidth: '450px', margin: '0 auto', color: 'var(--color-text-secondary)', display: 'grid', gap: '8px' }}>
                      <li>Ensure your pincode is typed correctly.</li>
                      <li>Try reducing your running EMIs to lower your FOIR ratio.</li>
                      <li>Double check if you are eligible for the other loan type (PL vs BL).</li>
                    </ul>
                  </div>
                )}

                {/* Reset Action */}
                <div style={{ textAlign: 'center', marginTop: '48px' }}>
                  <button className="btn btn-secondary btn-lg" onClick={handleReset}>
                    ← Check Again
                  </button>
                </div>
              </div>
            )}

            {/* -------- SINGLE PAGE INPUT FORM -------- */}
            {!loading && !showResults && (
              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '32px' }}>
                <div className="text-center" style={{ marginBottom: '16px' }}>
                  <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-3xl)', fontWeight: 700 }}>
                    Loan Eligibility Checker
                  </h1>
                  <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
                    Enter your details below to find the best matched banks and NBFCs for you.
                  </p>
                </div>

                {/* 3-Column Inputs Layout */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '24px',
                  alignItems: 'start'
                }}>
                  
                  {/* Card 1: Personal Details */}
                  <div className="form-card" style={{ backdropFilter: 'blur(20px)', height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: 'var(--border-subtle)', paddingBottom: '12px' }}>
                      <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyText: 'center', justifyContent: 'center', fontWeight: 600 }}>1</span>
                      <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Personal Info</h2>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Full Name <span className="required">*</span></label>
                      <input
                        type="text"
                        name="name"
                        className={inputClass('name')}
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => updateField('name', e.target.value)}
                      />
                      {errors.name && <p className="input-error-text">⚠ {errors.name}</p>}
                    </div>

                    <div className="input-group">
                      <label className="input-label">Mobile Number <span className="required">*</span></label>
                      <input
                        type="tel"
                        name="mobile"
                        className={inputClass('mobile')}
                        placeholder="10-digit mobile no."
                        maxLength={10}
                        value={formData.mobile}
                        onChange={(e) => updateField('mobile', e.target.value.replace(/\D/g, ''))}
                      />
                      {errors.mobile && <p className="input-error-text">⚠ {errors.mobile}</p>}
                      <p className="input-hint">Will be shared only with matching lenders</p>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Date of Birth <span className="required">*</span></label>
                      <input
                        type="date"
                        name="dob"
                        className={inputClass('dob')}
                        value={formData.dob}
                        onChange={(e) => updateField('dob', e.target.value)}
                      />
                      {errors.dob && <p className="input-error-text">⚠ {errors.dob}</p>}
                    </div>

                    <div className="input-group">
                      <label className="input-label">Age (Years)</label>
                      <input
                        type="text"
                        name="calculated_age"
                        className="input-field"
                        value={formData.dob ? (calculateAge(formData.dob) ?? '') : ''}
                        readOnly
                        placeholder="Automatically calculated from DOB"
                        style={{
                          background: 'rgba(255, 255, 255, 0.05)',
                          cursor: 'not-allowed',
                          color: 'var(--color-text-secondary)',
                          opacity: 0.8
                        }}
                      />
                    </div>
                  </div>

                  {/* Card 2: Address Details */}
                  <div className="form-card" style={{ backdropFilter: 'blur(20px)', height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: 'var(--border-subtle)', paddingBottom: '12px' }}>
                      <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyText: 'center', justifyContent: 'center', fontWeight: 600 }}>2</span>
                      <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Address details</h2>
                    </div>

                    <div className="input-group">
                      <label className="input-label">Current Address <span className="required">*</span></label>
                      <textarea
                        name="currentAddress"
                        className={inputClass('currentAddress')}
                        placeholder="Street, area, landmark"
                        value={formData.currentAddress}
                        onChange={(e) => updateField('currentAddress', e.target.value)}
                        rows={2}
                      />
                      {errors.currentAddress && <p className="input-error-text">⚠ {errors.currentAddress}</p>}
                    </div>

                    <label className="checkbox-wrapper" style={{ margin: '16px 0' }}>
                      <input
                        type="checkbox"
                        className="checkbox-input"
                        checked={formData.sameAddress}
                        onChange={(e) => updateField('sameAddress', e.target.checked)}
                      />
                      <span className="checkbox-label" style={{ fontSize: 'var(--text-sm)' }}>
                        Permanent address same as current
                      </span>
                    </label>

                    {!formData.sameAddress && (
                      <div className="input-group">
                        <label className="input-label">Permanent Address</label>
                        <textarea
                          name="permanentAddress"
                          className="input-field"
                          placeholder="As on identity documents"
                          value={formData.permanentAddress}
                          onChange={(e) => updateField('permanentAddress', e.target.value)}
                          rows={2}
                        />
                      </div>
                    )}

                    <div className="input-group">
                      <label className="input-label">Current Pincode <span className="required">*</span></label>
                      <input
                        type="text"
                        name="pincode"
                        className={inputClass('pincode')}
                        placeholder="6-digit PIN code"
                        maxLength={6}
                        value={formData.pincode}
                        onChange={(e) => updateField('pincode', e.target.value.replace(/\D/g, ''))}
                      />
                      {errors.pincode && <p className="input-error-text">⚠ {errors.pincode}</p>}
                      <p className="input-hint">Used for checking serviceable regions</p>
                    </div>
                  </div>

                  {/* Card 3: Financial Details */}
                  <div className="form-card" style={{ backdropFilter: 'blur(20px)', height: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', borderBottom: 'var(--border-subtle)', paddingBottom: '12px' }}>
                      <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--gradient-primary)', display: 'flex', alignItems: 'center', justifyText: 'center', justifyContent: 'center', fontWeight: 600 }}>3</span>
                      <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Financial profile</h2>
                    </div>
                    {/* Employment Type Toggle */}
                    <div className="input-group">
                      <label className="input-label">Employment Type <span className="required">*</span></label>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        marginTop: '4px'
                      }}>
                        <button
                          type="button"
                          onClick={() => updateField('employmentType', 'salaried')}
                          style={{
                            padding: '14px 16px',
                            borderRadius: 'var(--border-radius-md)',
                            border: formData.employmentType === 'salaried' ? '2px solid var(--color-primary)' : 'var(--border-light)',
                            background: formData.employmentType === 'salaried' ? 'rgba(99, 102, 241, 0.1)' : 'var(--color-bg-input)',
                            color: formData.employmentType === 'salaried' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 'var(--text-sm)',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          💼 Salary Loan
                        </button>
                        <button
                          type="button"
                          onClick={() => updateField('employmentType', 'self_employed')}
                          style={{
                            padding: '14px 16px',
                            borderRadius: 'var(--border-radius-md)',
                            border: formData.employmentType === 'self_employed' ? '2px solid var(--color-accent)' : 'var(--border-light)',
                            background: formData.employmentType === 'self_employed' ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-bg-input)',
                            color: formData.employmentType === 'self_employed' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: 'var(--text-sm)',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                          }}
                        >
                          ⚡ Instant Loan
                        </button>
                      </div>
                    </div>

                    {formData.employmentType === 'salaried' && (
                    <>
                    <div className="input-group">
                      <label className="input-label">Monthly Salary (Net) <span className="required">*</span></label>
                      <div className="input-wrapper">
                        <span className="input-prefix">₹</span>
                        <input
                          type="number"
                          name="salary"
                          className={`${inputClass('salary')} has-prefix`}
                          placeholder="e.g. 50000"
                          min="0"
                          value={formData.salary}
                          onChange={(e) => updateField('salary', e.target.value)}
                        />
                      </div>
                      {errors.salary && <p className="input-error-text">⚠ {errors.salary}</p>}
                    </div>

                    <div className="input-group">
                      <label className="input-label">Existing Monthly EMI</label>
                      <div className="input-wrapper">
                        <span className="input-prefix">₹</span>
                        <input
                          type="number"
                          name="existingEmi"
                          className="input-field has-prefix"
                          placeholder="0 if none"
                          min="0"
                          value={formData.existingEmi}
                          onChange={(e) => updateField('existingEmi', e.target.value)}
                        />
                      </div>
                    </div>
                    </>
                    )}

                    {formData.employmentType === 'self_employed' && (
                      <div style={{
                        background: 'rgba(251, 146, 60, 0.08)',
                        border: '1px solid rgba(251, 146, 60, 0.2)',
                        borderRadius: 'var(--border-radius-md)',
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--color-accent)',
                        lineHeight: 1.5
                      }}>
                        <span style={{ fontSize: '16px' }}>⚡</span>
                        Instant loans do not require salary information. Eligibility is based on your pincode and CIBIL score.
                      </div>
                    )}

                    <div className="input-group">
                      <label className="input-label">CIBIL / Credit Score <span className="required">*</span></label>
                      <input
                        type="number"
                        name="creditScore"
                        className={inputClass('creditScore')}
                        placeholder="Range 300 to 900"
                        min="300"
                        max="900"
                        value={formData.creditScore}
                        onChange={(e) => updateField('creditScore', e.target.value)}
                      />
                      {errors.creditScore && <p className="input-error-text">⚠ {errors.creditScore}</p>}
                    </div>
                  </div>

                </div>

                {/* Form Action Button */}
                <div style={{ textAlign: 'center', marginTop: '24px' }}>
                  <button type="submit" className="btn btn-primary btn-lg" style={{ minWidth: '280px', padding: '16px 32px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      Check Loan Eligibility
                    </span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </section>

        {/* Client Application Modal for Agents */}
        {applyModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}>
            <div className="form-card" style={{ maxWidth: 'min(480px, 96vw)', width: '100%', margin: '0 auto', display: 'grid', gap: '20px', border: 'var(--border-accent)', background: 'var(--color-bg-tertiary)', backdropFilter: 'blur(20px)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'var(--border-subtle)', paddingBottom: '12px' }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>Apply for Client</h3>
                <button onClick={() => setApplyModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--color-text-secondary)', fontSize: '24px', cursor: 'pointer' }}>×</button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <BankLogo bankName={selectedBank?.bank_name} logoUrl={selectedBank?.logo_url} size={32} />
                <div>
                  <h4 style={{ fontWeight: 600 }}>{selectedBank?.bank_name}</h4>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Type: {selectedBank?.loan_type === 'PL' ? 'Personal Loan' : 'Business Loan'}</p>
                </div>
              </div>

              {applyError && <div style={{ padding: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-error)' }}>⚠ {applyError}</div>}
              {applySuccess && <div style={{ padding: '10px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', fontSize: 'var(--text-sm)', color: 'var(--color-success)' }}>✓ {applySuccess}</div>}

              <form onSubmit={handleApplySubmit} style={{ display: 'grid', gap: '16px' }}>
                <div className="input-group">
                  <label className="input-label">Client Name</label>
                  <input
                    type="text"
                    className="input-field"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Client Mobile Number</label>
                  <input
                    type="tel"
                    className="input-field"
                    value={clientMobile}
                    onChange={(e) => setClientMobile(e.target.value.replace(/\D/g, ''))}
                    maxLength={10}
                    required
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Requested Loan Amount</label>
                  <div className="input-wrapper">
                    <span className="input-prefix">₹</span>
                    <input
                      type="number"
                      className="input-field has-prefix"
                      value={loanAmount}
                      placeholder="e.g. 500000"
                      onChange={(e) => setLoanAmount(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {selectedBank?.bank_name?.toUpperCase()?.includes('MUTHOOT') && selectedBank?.loan_type === 'BL' && (
                  <div className="input-group" style={{ marginTop: '16px' }}>
                    <label className="input-label">Muthoot Business Loan Product <span className="required">*</span></label>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                        <input 
                          type="radio" 
                          name="muthoot_type" 
                          checked={muthootSubType === 'daily'} 
                          onChange={() => setMuthootSubType('daily')} 
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        Daily EMI
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                        <input 
                          type="radio" 
                          name="muthoot_type" 
                          checked={muthootSubType === 'monthly'} 
                          onChange={() => setMuthootSubType('monthly')} 
                          style={{ accentColor: 'var(--color-primary)' }}
                        />
                        Monthly EMI
                      </label>
                    </div>
                  </div>
                )}

                {selectedBank?.bank_name?.toUpperCase()?.includes('INCRED') && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: 'var(--border-subtle)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginTop: '16px',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-secondary)',
                    display: 'grid',
                    gap: '6px'
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-accent-violet)' }}>🔑 InCred Partner Login Details:</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>• <strong>Login E-mail:</strong> incredhtoh@gmail.com</span>
                      <button type="button" onClick={() => { navigator.clipboard.writeText('incredhtoh@gmail.com'); }} style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', flexShrink: 0 }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}>📋 Copy</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>• <strong>OTP Support:</strong> Call & Message on WhatsApp to <strong>9389119399</strong></span>
                      <button type="button" onClick={() => { navigator.clipboard.writeText('9389119399'); }} style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', flexShrink: 0 }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}>📋 Copy</button>
                    </div>
                  </div>
                )}

                {selectedBank?.bank_name?.toUpperCase()?.includes('FINNABLE') && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: 'var(--border-subtle)',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginTop: '16px',
                    fontSize: 'var(--text-xs)',
                    color: 'var(--color-text-secondary)',
                    display: 'grid',
                    gap: '6px'
                  }}>
                    <div style={{ fontWeight: 600, color: 'var(--color-accent-violet)' }}>🔑 Finnable Partner Login Details:</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>• <strong>Login Mobile:</strong> 9389119399</span>
                      <button type="button" onClick={() => { navigator.clipboard.writeText('9389119399'); }} style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', flexShrink: 0 }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}>📋 Copy</button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span>• <strong>OTP Support:</strong> Call <strong>9389119399</strong></span>
                      <button type="button" onClick={() => { navigator.clipboard.writeText('9389119399'); }} style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '4px', padding: '2px 8px', fontSize: '10px', color: 'var(--color-primary)', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s', flexShrink: 0 }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.3)'} onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}>📋 Copy</button>
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setApplyModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }} disabled={applying}>
                    {applying ? 'Submitting...' : getAffiliateLink(selectedBank?.bank_name, selectedBank?.loan_type, muthootSubType) ? 'Submit & Open Link ↗' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </>
  );
}

/* ============================================
   RESULT CARD SUB-COMPONENT
   ============================================ */
function ResultCard({ bank, isAgent, onApply }) {
  return (
    <div className="result-card" style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-default)',
      borderRadius: '16px',
      padding: '24px',
      backdropFilter: 'blur(20px)',
      display: 'grid',
      gap: '16px',
      transition: 'all var(--transition-base)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BankLogo bankName={bank.bank_name} logoUrl={bank.logo_url} size={40} />
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {bank.bank_name}
          </div>
        </div>
        {/* Match Score Badge */}
        <div style={{
          padding: '6px 12px',
          borderRadius: '999px',
          fontSize: 'var(--text-xs)',
          fontWeight: 700,
          background: 'rgba(22, 163, 74, 0.1)',
          color: 'var(--color-success)',
          border: '1px solid rgba(22, 163, 74, 0.3)'
        }}>
          Eligible
        </div>
      </div>

      <div style={{ display: 'grid', gap: '8px', borderTop: 'var(--border-subtle)', paddingTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
          <span style={{ color: 'var(--color-text-tertiary)' }}>Min CIBIL</span>
          <span style={{ fontWeight: 500 }}>{bank.min_cibil}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
          <span style={{ color: 'var(--color-text-tertiary)' }}>Min Salary</span>
          <span style={{ fontWeight: 500 }}>₹{Number(bank.min_salary).toLocaleString('en-IN')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
          <span style={{ color: 'var(--color-text-tertiary)' }}>FOIR Limit</span>
          <span style={{ fontWeight: 500 }}>{bank.foir_max}%</span>
        </div>
        {bank.min_experience && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
            <span style={{ color: 'var(--color-text-tertiary)' }}>Experience</span>
            <span style={{ fontWeight: 500 }}>{bank.min_experience}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
        <span className="badge badge-primary">
          {bank.loan_type === 'PL' ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
              PL
            </span>
          ) : (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
              BL
            </span>
          )}
        </span>
        <span className="badge badge-info">
          {bank.company_category}
        </span>
        {bank.pf_required === 'Yes' && (
          <span className="badge badge-warning">
            PF Req.
          </span>
        )}
      </div>

      {bank.special_notes && (
        <div style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-secondary)',
          background: 'rgba(255,255,255,0.02)',
          padding: '8px 12px',
          borderRadius: '6px',
          border: 'var(--border-subtle)',
          lineHeight: 1.4,
          display: 'flex',
          alignItems: 'flex-start',
          gap: '6px'
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-primary)' }}>
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <span>{bank.special_notes}</span>
        </div>
      )}

      {isAgent && (
        <button
          onClick={() => onApply(bank)}
          className="btn btn-primary btn-sm"
          style={{ width: '100%', marginTop: '8px', justifyContent: 'center' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            Apply for Client
          </span>
        </button>
      )}
    </div>
  );
}
