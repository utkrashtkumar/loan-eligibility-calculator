'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { checkEligibility, saveInquiry } from '@/lib/eligibility';
import BankLogo from '@/components/BankLogo';

const INITIAL_FORM = {
  name: '',
  mobile: '',
  currentAddress: '',
  permanentAddress: '',
  sameAddress: false,
  pincode: '',
  salary: '',
  existingEmi: '',
  creditScore: '',
  loanType: 'ALL',
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

  // Ensure user is authenticated
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?redirect=/check');
      } else {
        setUser(session.user);
        
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

    // Address Validation
    if (!formData.currentAddress.trim())
      newErrors.currentAddress = 'Current address is required';
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Enter a valid 6-digit pincode';
    }

    // Financial Validation
    if (!formData.salary || Number(formData.salary) <= 0)
      newErrors.salary = 'Monthly salary is required';
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

      const eligible = await checkEligibility({
        pincode: formData.pincode.trim(),
        salary,
        creditScore,
        existingEmi,
        loanType: formData.loanType,
      });

      setResults(eligible);
      setShowResults(true);

      // Save inquiry with userId linked
      await saveInquiry({
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        currentAddress: formData.currentAddress.trim(),
        permanentAddress: formData.permanentAddress.trim() || formData.currentAddress.trim(),
        pincode: formData.pincode.trim(),
        salary,
        existingEmi,
        creditScore,
        eligibleBanks: eligible.map((b) => b.bank_name),
        userId: user?.id || null,
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
    formData.salary && Number(formData.salary) > 0
      ? (((Number(formData.existingEmi) || 0) / Number(formData.salary)) * 100).toFixed(1)
      : '0';

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
                    Based on pincode availability, minimum salary, CIBIL, and FOIR ratio.
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
                  <div className="profile-item">
                    <div className="profile-item-label">Monthly Salary</div>
                    <div className="profile-item-value">
                      ₹{Number(formData.salary).toLocaleString('en-IN')}
                    </div>
                  </div>
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
                  <div className="profile-item">
                    <div className="profile-item-label">Calculated FOIR</div>
                    <div className="profile-item-value" style={{ color: Number(userFoir) > 50 ? 'var(--color-warning)' : 'var(--color-text-primary)' }}>
                      {userFoir}%
                    </div>
                  </div>
                </div>

                {/* Bank Grid */}
                {results.length > 0 ? (
                  <div className="results-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
                    {results.map((bank) => (
                      <ResultCard key={bank.id} bank={bank} />
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
                    <div className="no-results-icon" style={{ fontSize: '48px', marginBottom: '16px' }}>😔</div>
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
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
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

                    <div className="input-group">
                      <label className="input-label">Loan Type <span className="required">*</span></label>
                      <div className="loan-type-toggle" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '4px', borderRadius: '8px', border: 'var(--border-subtle)' }}>
                        {['ALL', 'PL', 'BL'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            className={`loan-type-btn ${formData.loanType === type ? 'active' : ''}`}
                            onClick={() => updateField('loanType', type)}
                            style={{
                              padding: '8px',
                              fontSize: 'var(--text-xs)',
                              borderRadius: '6px',
                              background: formData.loanType === type ? 'var(--gradient-primary)' : 'transparent',
                              border: 'none',
                              color: formData.loanType === type ? '#fff' : 'var(--color-text-secondary)',
                              cursor: 'pointer',
                              fontWeight: 500,
                              transition: 'all var(--transition-fast)'
                            }}
                          >
                            {type === 'ALL' ? '🏦 All' : type === 'PL' ? '💳 Personal' : '💼 Business'}
                          </button>
                        ))}
                      </div>
                    </div>

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
                    🔍 Check Loan Eligibility
                  </button>
                </div>
              </form>
            )}

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

/* ============================================
   RESULT CARD SUB-COMPONENT
   ============================================ */
function ResultCard({ bank }) {
  const score = bank.match_score;

  // Gradient color based on score
  const getScoreColor = (s) => {
    if (s >= 85) return '#10b981'; // Green
    if (s >= 70) return '#0ea5e9'; // Ocean Blue
    return '#f59e0b'; // Amber
  };

  const scoreColor = getScoreColor(score);
  const conicGradient = `conic-gradient(${scoreColor} ${score * 3.6}deg, var(--color-circle-track) ${score * 3.6}deg)`;

  return (
    <div className="result-card" style={{
      background: 'var(--color-bg-card)',
      border: 'var(--border-light)',
      borderRadius: 'var(--border-radius-md)',
      padding: '24px',
      backdropFilter: 'blur(20px)',
      display: 'grid',
      gap: '16px',
      transition: 'all var(--transition-base)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BankLogo bankName={bank.bank_name} size={40} />
          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {bank.bank_name}
          </div>
        </div>
        
        {/* Progress Match Score Circle */}
        <div className="match-circle" style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: conicGradient
        }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'var(--color-bg-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            color: scoreColor
          }}>
            {score}%
          </div>
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
          {bank.loan_type === 'PL' ? '💳 PL' : '💼 BL'}
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
          lineHeight: 1.4
        }}>
          📝 {bank.special_notes}
        </div>
      )}
    </div>
  );
}
