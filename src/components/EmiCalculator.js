'use client';

import { useState, useEffect } from 'react';

// ─── Lazy Initializers for URL Parameter Sync (Server-Side Safe) ───────────
function getInitialAmount() {
  if (typeof window === 'undefined') return 500000;
  const params = new URLSearchParams(window.location.search);
  const val = params.get('amount');
  return val ? Math.min(100000000, Math.max(10000, Number(val))) : 500000;
}

function getInitialRate() {
  if (typeof window === 'undefined') return 10.5;
  const params = new URLSearchParams(window.location.search);
  const val = params.get('rate');
  return val ? Math.min(50, Math.max(1, Number(val))) : 10.5;
}

function getInitialTenureType() {
  if (typeof window === 'undefined') return 'months';
  const params = new URLSearchParams(window.location.search);
  const val = params.get('tenureType');
  return val === 'years' ? 'years' : 'months';
}

function getInitialTenure() {
  if (typeof window === 'undefined') return 36;
  const params = new URLSearchParams(window.location.search);
  const val = params.get('tenure');
  const type = params.get('tenureType') === 'years' ? 'years' : 'months';
  const maxT = type === 'years' ? 30 : 360;
  return val ? Math.min(maxT, Math.max(1, Number(val))) : 36;
}

function getInitialIncome() {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return params.get('income') || '';
}

function getInitialExistingEmi() {
  if (typeof window === 'undefined') return '';
  const params = new URLSearchParams(window.location.search);
  return params.get('existingEmi') || '';
}

export default function EmiCalculator() {
  // State initialization via lazy initializers (fully safe for SSR + effect lint rules)
  const [loanAmount, setLoanAmount]       = useState(getInitialAmount);
  const [interestRate, setInterestRate]   = useState(getInitialRate);
  const [tenureType, setTenureType]       = useState(getInitialTenureType);
  const [tenure, setTenure]               = useState(getInitialTenure);
  const [monthlyIncome, setMonthlyIncome] = useState(getInitialIncome);
  const [existingEmi, setExistingEmi]     = useState(getInitialExistingEmi);
  
  // Interactive UI states
  const [showAmortization, setShowAmortization] = useState(false);
  const [amortizationTab, setAmortizationTab]   = useState('reducing'); // 'reducing' or 'flat'
  const [copied, setCopied]                     = useState(false);

  // ─── Calculator math variables ──────────────────────────────────────────
  const P = Number(loanAmount) || 0;
  const R = Number(interestRate) || 0;
  const N = tenureType === 'years' ? Number(tenure) * 12 : Number(tenure);

  // ─── Reducing Balance Calculations ───────────────────────────────────────
  let reducingEmi = 0;
  let reducingTotalInterest = 0;
  let reducingTotalPayment = 0;
  let reducingPrincipalPercent = 100;
  let reducingInterestPercent = 0;
  let reducingSchedule = [];

  if (P > 0 && R > 0 && N > 0) {
    const monthlyRate = R / 12 / 100;
    const emiVal = (P * monthlyRate * Math.pow(1 + monthlyRate, N)) / (Math.pow(1 + monthlyRate, N) - 1);
    const totalPayVal = emiVal * N;
    const totalIntVal = totalPayVal - P;

    reducingEmi = Math.round(emiVal);
    reducingTotalInterest = Math.round(totalIntVal);
    reducingTotalPayment = Math.round(totalPayVal);
    reducingPrincipalPercent = Math.round((P / reducingTotalPayment) * 100);
    reducingInterestPercent = 100 - reducingPrincipalPercent;

    // Generate reducing schedule
    let remainingPrincipal = P;
    for (let i = 1; i <= N; i++) {
      const openingBal = remainingPrincipal;
      const interestPayment = remainingPrincipal * monthlyRate;
      const principalPayment = emiVal - interestPayment;
      remainingPrincipal -= principalPayment;

      reducingSchedule.push({
        month: i,
        opening: Math.round(openingBal),
        emi: Math.round(emiVal),
        interest: Math.round(interestPayment),
        principal: Math.round(principalPayment),
        closing: Math.max(0, Math.round(remainingPrincipal))
      });
    }
  }

  // ─── Flat Rate Calculations ──────────────────────────────────────────────
  let flatEmi = 0;
  let flatTotalInterest = 0;
  let flatTotalPayment = 0;
  let flatPrincipalPercent = 100;
  let flatInterestPercent = 0;
  let flatSchedule = [];

  if (P > 0 && R > 0 && N > 0) {
    const tenureInYears = N / 12;
    const totalIntVal = P * (R / 100) * tenureInYears;
    const totalPayVal = P + totalIntVal;
    const emiVal = totalPayVal / N;

    flatEmi = Math.round(emiVal);
    flatTotalInterest = Math.round(totalIntVal);
    flatTotalPayment = Math.round(totalPayVal);
    flatPrincipalPercent = Math.round((P / flatTotalPayment) * 100);
    flatInterestPercent = 100 - flatPrincipalPercent;

    // Generate flat schedule
    const monthlyInterest = totalIntVal / N;
    const monthlyPrincipal = P / N;
    let remainingPrincipal = P;
    for (let i = 1; i <= N; i++) {
      const openingBal = remainingPrincipal;
      remainingPrincipal -= monthlyPrincipal;

      flatSchedule.push({
        month: i,
        opening: Math.round(openingBal),
        emi: Math.round(emiVal),
        interest: Math.round(monthlyInterest),
        principal: Math.round(monthlyPrincipal),
        closing: Math.max(0, Math.round(remainingPrincipal))
      });
    }
  }

  // ─── FOIR / Eligibility Calculation ──────────────────────────────────────
  const incomeNum = Number(monthlyIncome) || 0;
  const currentEmiNum = Number(existingEmi) || 0;
  const newEmi = reducingEmi; // Default check against reducing rate
  const totalObligations = currentEmiNum + newEmi;
  const foir = incomeNum > 0 ? parseFloat(((totalObligations / incomeNum) * 100).toFixed(1)) : 0;

  let eligibilityStatus = 'none'; // 'low', 'medium', 'high', 'none'
  if (incomeNum > 0) {
    if (foir <= 50) eligibilityStatus = 'high';
    else if (foir <= 65) eligibilityStatus = 'medium';
    else eligibilityStatus = 'low';
  }

  // ─── Action Handlers ─────────────────────────────────────────────────────
  const handleAmountChange = (val) => {
    const num = Number(val);
    setLoanAmount(num > 100000000 ? 100000000 : num);
  };

  const handleRateChange = (val) => {
    const num = Number(val);
    setInterestRate(num > 50 ? 50 : num);
  };

  const handleTenureChange = (val) => {
    const num = Number(val);
    const maxTenure = tenureType === 'years' ? 30 : 360;
    setTenure(num > maxTenure ? maxTenure : num);
  };

  const toggleTenureType = (type) => {
    if (type === tenureType) return;
    setTenureType(type);
    if (type === 'years') {
      setTenure(Math.max(1, Math.round(tenure / 12)));
    } else {
      setTenure(Math.min(360, tenure * 12));
    }
  };

  const handleCopyLink = () => {
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.origin);
      url.searchParams.set('amount', loanAmount.toString());
      url.searchParams.set('rate', interestRate.toString());
      url.searchParams.set('tenure', tenure.toString());
      url.searchParams.set('tenureType', tenureType);
      if (monthlyIncome) url.searchParams.set('income', monthlyIncome);
      if (existingEmi) url.searchParams.set('existingEmi', existingEmi);

      navigator.clipboard.writeText(url.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy share link:', e);
    }
  };

  return (
    <div className="form-card" style={{
      padding: 'clamp(16px, 3vw, 32px)',
      background: 'var(--color-bg-glass-heavy)',
      backdropFilter: 'blur(20px)',
      border: 'var(--border-light)',
      borderRadius: 'var(--border-radius-xl)',
      boxShadow: 'var(--shadow-lg)'
    }}>
      <style jsx>{`
        .inputs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          margin-bottom: 24px;
        }
        .eligibility-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
          margin-bottom: 32px;
          padding: 24px 0;
          border-top: 1px dashed var(--border-default);
        }
        @media (max-width: 992px) {
          .inputs-grid, .eligibility-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          border-top: 1px solid var(--border-default);
          padding-top: 32px;
        }
        @media (max-width: 768px) {
          .comparison-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
        .slider-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .slider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .slider-title {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          font-weight: 600;
        }
        .slider-input-wrapper {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .slider-input {
          background: var(--color-bg-secondary) !important;
          border: var(--border-light) !important;
          color: var(--color-text-primary) !important;
          padding: 8px 12px !important;
          border-radius: 8px !important;
          font-size: var(--text-sm) !important;
          font-weight: 600 !important;
          width: 120px !important;
          text-align: right !important;
          outline: none !important;
        }
        .slider-input:focus {
          border-color: var(--color-primary) !important;
        }
        .range-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: var(--color-bg-secondary);
          outline: none;
          border: var(--border-subtle);
          cursor: pointer;
        }
        .range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--gradient-primary);
          border: none;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
          transition: transform 0.1s ease;
        }
        .range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        .donut-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
        }
        .donut-chart {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: var(--shadow-md);
        }
        .donut-center {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          background: var(--color-bg-card);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: absolute;
          border: var(--border-subtle);
        }
        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 3px;
          display: inline-block;
        }
        .result-card-inner {
          background: var(--color-bg-card);
          border-radius: 16px;
          padding: 24px;
          transition: all var(--transition-base);
          box-shadow: var(--shadow-md);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .result-card-inner:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }
        .result-card-reducing {
          border: 1px solid rgba(45, 212, 191, 0.2);
          box-shadow: 0 0 15px rgba(45, 212, 191, 0.03);
        }
        .result-card-reducing:hover {
          border-color: rgba(45, 212, 191, 0.4);
          box-shadow: var(--shadow-glow-indigo);
        }
        .result-card-flat {
          border: 1px solid rgba(251, 146, 60, 0.2);
          box-shadow: 0 0 15px rgba(251, 146, 60, 0.03);
        }
        .result-card-flat:hover {
          border-color: rgba(251, 146, 60, 0.4);
          box-shadow: var(--shadow-glow-purple);
        }
        .amortization-table-container {
          max-height: 380px;
          overflow-y: auto;
          border: var(--border-light);
          border-radius: 12px;
          background: var(--color-bg-card);
        }
        .amortization-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: var(--text-xs);
        }
        .amortization-table th {
          position: sticky;
          top: 0;
          background: var(--color-bg-secondary);
          padding: 12px 16px;
          font-weight: 700;
          color: var(--color-text-secondary);
          border-bottom: 1px solid var(--border-default);
          z-index: 10;
        }
        .amortization-table td {
          padding: 10px 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.02);
          color: var(--color-text-primary);
        }
      `}</style>

      <div>
        {/* Header Block */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: '6px' }}>
              🧮 Advanced EMI & Eligibility Calculator
            </h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>
              Calculate EMIs, compare flat vs reducing methods, and check income obligations in real-time.
            </p>
          </div>
          <button
            onClick={handleCopyLink}
            style={{
              padding: '8px 16px',
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '8px',
              color: 'var(--color-primary)',
              fontWeight: 600,
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
          >
            {copied ? '✅ Pre-filled Link Copied!' : '🔗 Copy Share Link'}
          </button>
        </div>

        {/* ─── Top Section: Main Calculator Inputs ──────────────────────────── */}
        <div className="inputs-grid">
          {/* Principal Amount Input */}
          <div className="slider-container">
            <div className="slider-header">
              <span className="slider-title">Loan Amount (₹)</span>
              <div className="slider-input-wrapper">
                <input
                  type="number"
                  min="10000"
                  max="100000000"
                  className="slider-input"
                  value={loanAmount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                />
              </div>
            </div>
            <input
              type="range"
              min="10000"
              max="20000000"
              step="10000"
              className="range-slider"
              value={loanAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
              <span>₹10,000</span>
              <span>₹2 Cr</span>
            </div>
          </div>

          {/* Interest Rate Input */}
          <div className="slider-container">
            <div className="slider-header">
              <span className="slider-title">Interest Rate (% P.A.)</span>
              <div className="slider-input-wrapper">
                <input
                  type="number"
                  min="1"
                  max="50"
                  step="0.05"
                  className="slider-input"
                  value={interestRate}
                  onChange={(e) => handleRateChange(e.target.value)}
                />
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="36"
              step="0.05"
              className="range-slider"
              value={interestRate}
              onChange={(e) => handleRateChange(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
              <span>1%</span>
              <span>36%</span>
            </div>
          </div>

          {/* Tenure Input */}
          <div className="slider-container">
            <div className="slider-header">
              <span className="slider-title">Loan Tenure</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  min="1"
                  max={tenureType === 'years' ? 30 : 360}
                  className="slider-input"
                  value={tenure}
                  onChange={(e) => handleTenureChange(e.target.value)}
                  style={{ width: '65px' }}
                />
                <div style={{ display: 'flex', background: 'var(--color-bg-secondary)', border: 'var(--border-light)', borderRadius: '6px', padding: '2px' }}>
                  <button
                    type="button"
                    onClick={() => toggleTenureType('years')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '10px',
                      fontWeight: 600,
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      background: tenureType === 'years' ? 'var(--gradient-primary)' : 'transparent',
                      color: tenureType === 'years' ? '#ffffff' : 'var(--color-text-secondary)'
                    }}
                  >
                    Yr
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleTenureType('months')}
                    style={{
                      padding: '4px 8px',
                      fontSize: '10px',
                      fontWeight: 600,
                      borderRadius: '4px',
                      border: 'none',
                      cursor: 'pointer',
                      background: tenureType === 'months' ? 'var(--gradient-primary)' : 'transparent',
                      color: tenureType === 'months' ? '#ffffff' : 'var(--color-text-secondary)'
                    }}
                  >
                    Mo
                  </button>
                </div>
              </div>
            </div>
            <input
              type="range"
              min="1"
              max={tenureType === 'years' ? 30 : 120}
              step="1"
              className="range-slider"
              value={tenure}
              onChange={(e) => handleTenureChange(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
              <span>1 {tenureType === 'years' ? 'Year' : 'Month'}</span>
              <span>{tenureType === 'years' ? '30 Years' : '10 Years'}</span>
            </div>
          </div>
        </div>

        {/* ─── Middle Section: Optional Eligibility Checks ─────────────────── */}
        <div className="eligibility-grid">
          {/* Monthly Net Salary Input */}
          <div className="slider-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="slider-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                💼 Monthly Income (Net) <span style={{ fontSize: '9px', opacity: 0.6 }}>(Optional)</span>
              </span>
              <input
                type="number"
                placeholder="e.g. 50000"
                className="slider-input"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
              />
            </div>
            <input
              type="range"
              min="0"
              max="500000"
              step="5000"
              className="range-slider"
              value={monthlyIncome || 0}
              onChange={(e) => setMonthlyIncome(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
              <span>₹0</span>
              <span>₹5 Lakhs</span>
            </div>
          </div>

          {/* Existing EMIs Input */}
          <div className="slider-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="slider-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                💳 Existing Monthly EMIs <span style={{ fontSize: '9px', opacity: 0.6 }}>(Optional)</span>
              </span>
              <input
                type="number"
                placeholder="e.g. 10000"
                className="slider-input"
                value={existingEmi}
                onChange={(e) => setExistingEmi(e.target.value)}
              />
            </div>
            <input
              type="range"
              min="0"
              max="150000"
              step="2000"
              className="range-slider"
              value={existingEmi || 0}
              onChange={(e) => setExistingEmi(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--color-text-tertiary)' }}>
              <span>₹0</span>
              <span>₹1.5 Lakhs</span>
            </div>
          </div>
        </div>

        {/* ─── Real-Time FOIR Eligibility Output Card ──────────────────────── */}
        {eligibilityStatus !== 'none' && (
          <div style={{
            marginBottom: '32px',
            borderRadius: '16px',
            padding: '20px',
            border: eligibilityStatus === 'high' 
              ? '1px solid rgba(16, 185, 129, 0.25)' 
              : eligibilityStatus === 'medium'
              ? '1px solid rgba(245, 158, 11, 0.25)'
              : '1px solid rgba(239, 68, 68, 0.25)',
            background: eligibilityStatus === 'high' 
              ? 'rgba(16, 185, 129, 0.05)' 
              : eligibilityStatus === 'medium'
              ? 'rgba(245, 158, 11, 0.05)'
              : 'rgba(239, 68, 68, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <strong style={{
                color: eligibilityStatus === 'high' ? '#10b981' : eligibilityStatus === 'medium' ? '#f59e0b' : '#ef4444',
                fontSize: 'var(--text-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                {eligibilityStatus === 'high' && '🟢 High Eligibility (Low Risk)'}
                {eligibilityStatus === 'medium' && '🟡 Moderate Eligibility (Medium Risk)'}
                {eligibilityStatus === 'low' && '🔴 Low Eligibility (High Debt Risk)'}
              </strong>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                Your Income Obligations (FOIR): <strong>{foir}%</strong>
              </span>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.5 }}>
              {eligibilityStatus === 'high' && `Excellent! Your total EMIs (₹${totalObligations.toLocaleString('en-IN')}) consume only ${foir}% of your monthly income. Most lenders prefer a FOIR below 50%. You have a strong chance of approval.`}
              {eligibilityStatus === 'medium' && `Your total monthly EMIs consume ${foir}% of your income. While still eligible, lenders may inspect your file more carefully. Consider reducing the loan amount or increasing the tenure to drop the FOIR below 50% for premium interest rates.`}
              {eligibilityStatus === 'low' && `Attention: Your total EMIs consume ${foir}% of your monthly salary. Lenders rarely approve files with a FOIR above 65% as it indicates high debt-to-income stress. We suggest applying for a smaller loan amount or arranging a co-applicant to increase eligible income.`}
            </p>
          </div>
        )}

        {/* ─── Comparison Grid (Reducing vs Flat) ──────────────────────────── */}
        <div className="comparison-grid">
          {/* Reducing Balance Method Card */}
          <div className="result-card-inner result-card-reducing">
            <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              📉 Reducing Balance Method
            </h4>
            
            <div style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid rgba(45, 212, 191, 0.15)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Monthly Loan EMI
              </div>
              <div style={{
                fontSize: 'var(--text-2xl)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                color: 'var(--color-primary)',
                marginTop: '4px'
              }}>
                ₹{reducingEmi.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Donut Chart */}
            <div className="donut-container">
              <div className="donut-chart" style={{
                background: `conic-gradient(var(--color-primary) 0% ${reducingPrincipalPercent}%, var(--color-accent) ${reducingPrincipalPercent}% 100%)`
              }}>
                <div className="donut-center">
                  <span style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Total Payment</span>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                    ₹{reducingTotalPayment.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Ledger */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)' }}>
                  <span className="legend-dot" style={{ background: 'var(--color-primary)' }}></span>
                  Principal Amount
                </span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  ₹{loanAmount.toLocaleString('en-IN')} ({reducingPrincipalPercent}%)
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)' }}>
                  <span className="legend-dot" style={{ background: 'var(--color-accent)' }}></span>
                  Total Interest
                </span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  ₹{reducingTotalInterest.toLocaleString('en-IN')} ({reducingInterestPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Flat Rate Method Card */}
          <div className="result-card-inner result-card-flat">
            <h4 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              📌 Flat / Fixed Rate Method
            </h4>
            
            <div style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid rgba(251, 146, 60, 0.15)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Monthly Loan EMI
              </div>
              <div style={{
                fontSize: 'var(--text-2xl)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                color: 'var(--color-accent)',
                marginTop: '4px'
              }}>
                ₹{flatEmi.toLocaleString('en-IN')}
              </div>
            </div>

            {/* Donut Chart */}
            <div className="donut-container">
              <div className="donut-chart" style={{
                background: `conic-gradient(var(--color-primary) 0% ${flatPrincipalPercent}%, var(--color-secondary) ${flatPrincipalPercent}% 100%)`
              }}>
                <div className="donut-center">
                  <span style={{ fontSize: '9px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Total Payment</span>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '2px' }}>
                    ₹{flatTotalPayment.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Details Ledger */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)' }}>
                  <span className="legend-dot" style={{ background: 'var(--color-primary)' }}></span>
                  Principal Amount
                </span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  ₹{loanAmount.toLocaleString('en-IN')} ({flatPrincipalPercent}%)
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-secondary)' }}>
                  <span className="legend-dot" style={{ background: 'var(--color-secondary)' }}></span>
                  Total Interest
                </span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  ₹{flatTotalInterest.toLocaleString('en-IN')} ({flatInterestPercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Bottom Action: Amortization Schedule ────────────────────────── */}
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button
            onClick={() => setShowAmortization(!showAmortization)}
            style={{
              padding: '12px 24px',
              background: 'var(--color-bg-secondary)',
              border: 'var(--border-light)',
              borderRadius: '10px',
              color: 'var(--color-text-primary)',
              fontWeight: 600,
              fontSize: 'var(--text-sm)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            📊 {showAmortization ? 'Hide Repayment Schedule' : 'Show Month-by-Month Repayment Schedule'}
          </button>
        </div>

        {showAmortization && (
          <div style={{ marginTop: '24px', animation: 'pwa-slide-up 0.3s ease-out' }}>
            {/* Tab Selector for reducing vs flat schedule */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', borderBottom: '1px solid var(--border-default)', paddingBottom: '12px' }}>
              <button
                onClick={() => setAmortizationTab('reducing')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  background: amortizationTab === 'reducing' ? 'rgba(45, 212, 191, 0.15)' : 'transparent',
                  color: amortizationTab === 'reducing' ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                }}
              >
                Reducing Balance Schedule
              </button>
              <button
                onClick={() => setAmortizationTab('flat')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  background: amortizationTab === 'flat' ? 'rgba(251, 146, 60, 0.15)' : 'transparent',
                  color: amortizationTab === 'flat' ? 'var(--color-accent)' : 'var(--color-text-secondary)'
                }}
              >
                Flat Rate Schedule
              </button>
            </div>

            {/* Table Container */}
            <div className="amortization-table-container">
              <table className="amortization-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>Month</th>
                    <th>Opening Bal</th>
                    <th>Payment (EMI)</th>
                    <th>Interest Paid</th>
                    <th>Principal Paid</th>
                    <th>Closing Bal</th>
                  </tr>
                </thead>
                <tbody>
                  {(amortizationTab === 'reducing' ? reducingSchedule : flatSchedule).map((row) => (
                    <tr key={row.month}>
                      <td style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>{row.month}</td>
                      <td>₹{row.opening.toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 600 }}>₹{row.emi.toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--color-error)' }}>₹{row.interest.toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--color-success)' }}>₹{row.principal.toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                        ₹{row.closing.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
