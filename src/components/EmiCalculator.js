'use client';

import { useState } from 'react';

export default function EmiCalculator() {
  const [loanAmount, setLoanAmount] = useState(500000);
  const [interestRate, setInterestRate] = useState(10.5);
  const [tenure, setTenure] = useState(36); // in months
  const [tenureType, setTenureType] = useState('months'); // 'months' or 'years'
  const [interestType, setInterestType] = useState('reducing'); // 'reducing' or 'fixed'

  const P = Number(loanAmount);
  const R = Number(interestRate);
  // Convert tenure to months if selected in years
  const N = tenureType === 'years' ? Number(tenure) * 12 : Number(tenure);

  let emi = 0;
  let totalInterest = 0;
  let totalPayment = 0;

  if (P > 0 && R > 0 && N > 0) {
    if (interestType === 'reducing') {
      // Reducing Interest Rate (Standard EMI formula)
      const monthlyRate = R / 12 / 100;
      const emiVal = (P * monthlyRate * Math.pow(1 + monthlyRate, N)) / (Math.pow(1 + monthlyRate, N) - 1);
      const totalPayVal = emiVal * N;
      const totalIntVal = totalPayVal - P;

      emi = Math.round(emiVal);
      totalInterest = Math.round(totalIntVal);
      totalPayment = Math.round(totalPayVal);
    } else {
      // Fixed Interest Rate (Flat Interest formula)
      const tenureInYears = N / 12;
      const totalIntVal = P * (R / 100) * tenureInYears;
      const totalPayVal = P + totalIntVal;
      const emiVal = totalPayVal / N;

      emi = Math.round(emiVal);
      totalInterest = Math.round(totalIntVal);
      totalPayment = Math.round(totalPayVal);
    }
  }

  const principalPercent = totalPayment > 0 ? Math.round((loanAmount / totalPayment) * 100) : 100;
  const interestPercent = 100 - principalPercent;

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

  return (
    <div className="form-card" style={{
      padding: '32px',
      background: 'var(--color-bg-glass-heavy)',
      backdropFilter: 'blur(20px)',
      border: 'var(--border-light)',
      borderRadius: 'var(--border-radius-xl)',
      display: 'grid',
      gridTemplateColumns: '1fr',
      gap: '32px',
      boxShadow: 'var(--shadow-lg)',
      alignItems: 'start'
    }}>
      <style jsx>{`
        .calculator-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 40px;
        }
        @media (max-width: 992px) {
          .calculator-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }
        .slider-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }
        .slider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .slider-title {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          fontWeight: 600;
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
          width: 130px !important;
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
        .type-toggle-btn {
          padding: 10px 18px;
          font-size: var(--text-sm);
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: var(--border-light);
          background: var(--color-bg-secondary);
          color: var(--color-text-secondary);
          flex: 1;
          text-align: center;
        }
        .type-toggle-btn.active {
          background: var(--gradient-primary);
          color: #ffffff !important;
          border-color: transparent;
          box-shadow: var(--shadow-glow-indigo);
        }
        .donut-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 24px;
        }
        .donut-chart {
          width: 180px;
          height: 180px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: var(--shadow-md);
        }
        .donut-center {
          width: 130px;
          height: 130px;
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
      `}</style>

      <div>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: '6px' }}>
          🧮 Interactive EMI Calculator
        </h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: '32px' }}>
          Plan your loan repayment structures by toggling interest calculation methods
        </p>

        <div className="calculator-grid">
          {/* Left Side: Inputs */}
          <div>
            {/* Interest Type Toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              <label style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Interest Rate Type</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setInterestType('reducing')}
                  className={`type-toggle-btn ${interestType === 'reducing' ? 'active' : ''}`}
                >
                  📉 Reducing Balance
                </button>
                <button
                  type="button"
                  onClick={() => setInterestType('fixed')}
                  className={`type-toggle-btn ${interestType === 'fixed' ? 'active' : ''}`}
                >
                  📌 Flat / Fixed Rate
                </button>
              </div>
            </div>

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
                    style={{ width: '80px !important' }}
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

          {/* Right Side: Results & Pie breakdown */}
          <div className="donut-container">
            {/* EMI display card */}
            <div style={{
              background: 'var(--color-bg-card)',
              border: 'var(--border-accent)',
              borderRadius: '16px',
              padding: '20px 24px',
              width: '100%',
              textAlign: 'center',
              boxShadow: 'var(--shadow-glow-indigo)'
            }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Monthly Loan EMI
              </div>
              <div style={{
                fontSize: 'var(--text-3xl)',
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                background: 'var(--gradient-text)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginTop: '8px'
              }}>
                ₹{emi.toLocaleString('en-IN')}
              </div>
            </div>

            {/* CSS Conic Gradient Donut Chart */}
            <div className="donut-chart" style={{
              background: `conic-gradient(var(--color-primary) 0% ${principalPercent}%, var(--color-accent) ${principalPercent}% 100%)`
            }}>
              <div className="donut-center">
                <span style={{ fontSize: '10px', color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Total Payment</span>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '4px' }}>
                  ₹{totalPayment.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Details Ledger & Legend */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-sm)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
                  <span className="legend-dot" style={{ background: 'var(--color-primary)' }}></span>
                  Principal Amount
                </span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  ₹{loanAmount.toLocaleString('en-IN')} ({principalPercent}%)
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-sm)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)' }}>
                  <span className="legend-dot" style={{ background: 'var(--color-accent)' }}></span>
                  Total Interest
                </span>
                <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                  ₹{totalInterest.toLocaleString('en-IN')} ({interestPercent}%)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
