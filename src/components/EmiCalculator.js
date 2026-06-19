'use client';

import { useState } from 'react';

export default function EmiCalculator() {
  const [loanAmount, setLoanAmount] = useState(500000);
  const [interestRate, setInterestRate] = useState(10.5);
  const [tenure, setTenure] = useState(36); // in months
  const [tenureType, setTenureType] = useState('months'); // 'months' or 'years'

  const P = Number(loanAmount);
  const R = Number(interestRate);
  const N = tenureType === 'years' ? Number(tenure) * 12 : Number(tenure);

  // 1. Reducing Calculations
  let reducingEmi = 0;
  let reducingTotalInterest = 0;
  let reducingTotalPayment = 0;
  let reducingPrincipalPercent = 100;
  let reducingInterestPercent = 0;

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
  }

  // 2. Flat Calculations
  let flatEmi = 0;
  let flatTotalInterest = 0;
  let flatTotalPayment = 0;
  let flatPrincipalPercent = 100;
  let flatInterestPercent = 0;

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
  }

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
      boxShadow: 'var(--shadow-lg)'
    }}>
      <style jsx>{`
        .inputs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          margin-bottom: 32px;
        }
        @media (max-width: 992px) {
          .inputs-grid {
            grid-template-columns: 1fr;
            gap: 24px;
            margin-bottom: 24px;
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
      `}</style>

      <div>
        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: '6px' }}>
          🧮 Interactive EMI Calculator
        </h3>
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginBottom: '32px' }}>
          Compare standard Reducing Balance vs Flat Rate structures in real-time as you adjust your loan parameters.
        </p>

        {/* Top Section: Inputs */}
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

        {/* Bottom Section: Side-by-Side Comparison */}
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
      </div>
    </div>
  );
}
