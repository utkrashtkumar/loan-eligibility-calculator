'use client';

import { useState } from 'react';
import Link from 'next/link';

const CALCULATORS_DATA = [
  // Loans & Eligibility
  { slug: 'loan-eligibility', name: 'Loan Eligibility Calculator', description: 'Check your loan eligibility instantly', icon: '💰', category: 'Loans & Eligibility' },
  { slug: 'emi', name: 'EMI Calculator', description: 'Calculate EMI on your loans home loan, car loan or personal loan', icon: '🏦', category: 'Loans & Eligibility' },
  
  // Investments & Savings
  { slug: 'fd', name: 'FD Calculator', description: 'Calculate fixed deposit returns', icon: '📈', category: 'Investments & Savings' },
  { slug: 'rd', name: 'RD Calculator', description: 'Calculate recurring deposit maturity', icon: '💳', category: 'Investments & Savings' },
  { slug: 'sip', name: 'SIP Calculator', description: 'Calculate your SIP returns', icon: '💹', category: 'Investments & Savings' },
  { slug: 'mutual-fund', name: 'Mutual Fund Calculator', description: 'Calculate your mutual fund returns', icon: '📊', category: 'Investments & Savings' },
  { slug: 'ppf', name: 'PPF Calculator', description: 'Calculate your Public Provident Fund returns', icon: '💼', category: 'Investments & Savings' },
  { slug: 'nsc', name: 'NSC Calculator', description: 'Calculate your returns under National Savings Certificate scheme', icon: '🏅', category: 'Investments & Savings' },
  { slug: 'kvp', name: 'KVP Calculator', description: 'Calculate Kisan Vikas Patra returns', icon: '🌾', category: 'Investments & Savings' },
  { slug: 'ssy', name: 'SSY Calculator', description: 'Calculate Sukanya Samriddhi Yojana returns', icon: '👶', category: 'Investments & Savings' },
  
  // Retirement & Govt Schemes
  { slug: 'apy', name: 'APY Calculator', description: 'Calculate Atal Pension Yojana returns', icon: '👴', category: 'Retirement & Government Schemes' },
  { slug: 'epf', name: 'EPF Calculator', description: 'Calculate your Employee Provident Fund returns', icon: '👔', category: 'Retirement & Government Schemes' },
  { slug: 'scss', name: 'SCSS Calculator', description: 'Calculate Senior Citizen Savings Scheme returns', icon: '👵', category: 'Retirement & Government Schemes' },
  { slug: 'mahila-samman', name: 'Mahila Samman Calculator', description: 'Calculate Mahila Samman Savings returns', icon: '👩', category: 'Retirement & Government Schemes' },
  { slug: 'post-office-mis', name: 'Post Office MIS Calculator', description: 'Calculate Post Office Monthly Income Scheme returns', icon: '🏢', category: 'Retirement & Government Schemes' },

  // Tax & Salary
  { slug: 'income-tax', name: 'Income Tax Calculator', description: 'Calculate your income tax liability', icon: '📋', category: 'Tax & Salary' },
  { slug: 'hra', name: 'HRA Calculator', description: 'Calculate your HRA exemption', icon: '🏠', category: 'Tax & Salary' },
  { slug: 'gst', name: 'GST Calculator', description: 'Calculate your payable GST amount with a few clicks', icon: '🛍️', category: 'Tax & Salary' },
  { slug: 'tds', name: 'TDS Calculator', description: 'Calculate your TDS deductions', icon: '📄', category: 'Tax & Salary' },
  { slug: 'salary', name: 'Salary Calculator', description: 'Calculate your net take home salary', icon: '💵', category: 'Tax & Salary' },
  { slug: 'gratuity', name: 'Gratuity Calculator', description: 'Calculate how much gratuity you will get when you retire', icon: '🎁', category: 'Tax & Salary' },

  // Business & Tools
  { slug: 'cagr', name: 'CAGR Calculator', description: 'Calculate the Compound Annual Growth Rate for your investments', icon: '📊', category: 'Business & Tools' },
  { slug: 'inflation', name: 'Inflation Calculator', description: 'Calculate inflation adjusted prices', icon: '📅', category: 'Business & Tools' },
  { slug: 'simple-interest', name: 'Simple Interest Calculator', description: 'Calculate simple interest on your savings', icon: '🧮', category: 'Business & Tools' }
];

const CATEGORIES = ['All', 'Loans & Eligibility', 'Investments & Savings', 'Retirement & Government Schemes', 'Tax & Salary', 'Business & Tools'];

export default function CalculatorsSection({ isHomeSection = false }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredCalculators = CALCULATORS_DATA.filter((calc) => {
    const matchesSearch = calc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          calc.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'All' || calc.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <section 
      style={{ 
        padding: isHomeSection ? '80px 0' : '0', 
        borderTop: isHomeSection ? '1px solid var(--border-default)' : 'none',
        background: isHomeSection ? 'rgba(255, 255, 255, 0.01)' : 'transparent'
      }}
    >
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        
        {/* Header Block */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="badge" style={{ marginBottom: '12px' }}>Platform Financial Utilities</span>
          <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 36px)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
            Financial <span className="text-gradient">Decision Calculators</span>
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
            Estimate returns, model taxes, project loan schedules, and check eligibility instantly across 24 premium tools built to match your goals.
          </p>
        </div>

        {/* Search and Filters Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '40px' }}>
          {/* Search Input Box */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
            <input
              type="text"
              placeholder="Search calculators (e.g. SIP, FD, HRA...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '10px',
                border: '1px solid var(--border-default)',
                background: 'var(--color-bg-card)',
                color: 'var(--color-text-primary)',
                padding: '0 16px 0 40px',
                fontSize: '14px',
                fontWeight: 600,
                outline: 'none',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'}
            />
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', opacity: 0.6 }}>🔍</span>
          </div>

          {/* Category Select Filters */}
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            overflowX: 'auto',
            paddingBottom: '4px'
          }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '30px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: activeCategory === cat ? 'var(--color-text-primary)' : 'var(--color-bg-card)',
                  color: activeCategory === cat ? 'var(--color-bg-secondary)' : 'var(--color-text-secondary)',
                  border: activeCategory === cat ? '1px solid var(--color-text-primary)' : '1px solid var(--border-default)'
                }}
                onMouseOver={(e) => {
                  if (activeCategory !== cat) e.currentTarget.style.borderColor = 'var(--color-text-primary)';
                }}
                onMouseOut={(e) => {
                  if (activeCategory !== cat) e.currentTarget.style.borderColor = 'var(--border-default)';
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Layout of Calculators */}
        {filteredCalculators.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: '16px'
          }}>
            {filteredCalculators.map((calc) => (
              <Link
                key={calc.slug}
                href={calc.slug === 'emi' ? '/emi-calculator' : `/calculators/${calc.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="calc-card"
                  style={{
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '12px',
                    padding: '16px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'all 0.3s ease',
                    boxShadow: 'var(--shadow-sm)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '24px' }}>{calc.icon}</span>
                    <span style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-primary)', background: 'var(--color-bg-glass)', padding: '4px 8px', borderRadius: '4px' }}>
                      {calc.category.split(' ')[0]}
                    </span>
                  </div>

                  <div>
                    <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '6px', fontFamily: 'var(--font-heading)' }}>
                      {calc.name}
                    </h3>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.4, minHeight: '34px' }}>
                      {calc.description}
                    </p>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '10px',
                    fontWeight: 800,
                    color: 'var(--color-text-primary)',
                    marginTop: 'auto',
                    borderTop: '1px solid var(--border-default)',
                    paddingTop: '10px'
                  }}>
                    Check Now <span style={{ fontSize: '10px' }}>➔</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', background: 'var(--color-bg-card)', borderRadius: '16px', border: '1px dashed var(--border-default)' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🔍</span>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '8px' }}>No calculators found</h3>
            <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
              Try modifying your search queries or filter categories.
            </p>
          </div>
        )}

      </div>

      <style jsx>{`
        .calc-card:hover {
          transform: translateY(-5px);
          border-color: var(--color-primary) !important;
          box-shadow: 0 10px 25px -5px rgba(0, 215, 86, 0.15) !important;
        }
      `}</style>
    </section>
  );
}
