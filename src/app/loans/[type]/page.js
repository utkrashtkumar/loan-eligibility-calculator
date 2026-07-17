'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Config data for different loan types
const LOAN_DATA = {
  'two-wheeler': {
    title: 'Two-Wheeler Loan',
    code: 'AL',
    interestRate: '8.50%',
    maxAmount: '3 Lakhs',
    maxTenure: '5 Years',
    processingFee: '1.00%',
    description: 'Get on the road quickly with our hassle-free Two-Wheeler Loans. We offer up to 100% funding on select bike and scooter models with minimal documentation.',
    features: [
      'Funding up to 100% of on-road price',
      'Flexible repayment tenures up to 60 months',
      'Instant eligibility check and quick disbursal',
      'Special interest rates for women borrowers'
    ],
    faqs: [
      { q: 'What is the maximum loan amount I can get?', a: 'You can get a loan of up to ₹3 Lakhs or 100% of the bike\'s on-road price, depending on your income profile and credit score.' },
      { q: 'Do I need a co-applicant?', a: 'A co-applicant is not mandatory if you meet the minimum income and credit criteria, but adding one can improve your eligibility.' }
    ]
  },
  'car': {
    title: 'Car Loan',
    code: 'AL',
    interestRate: '7.90%',
    maxAmount: '50 Lakhs',
    maxTenure: '7 Years',
    processingFee: '0.50%',
    description: 'Drive your dream car home today. Our auto loans offer attractive interest rates, flexible tenures, and financing options for both new and pre-owned passenger vehicles.',
    features: [
      'Attractive interest rates starting at 7.90% p.a.',
      'Loan tenures up to 84 months for comfortable EMIs',
      'Up to 90% financing on new car ex-showroom prices',
      'Pre-approved offers for existing customers with high credit ratings'
    ],
    faqs: [
      { q: 'Can I get a loan for a used car?', a: 'Yes, we facilitate financing for both new and pre-owned cars. Pre-owned car loans generally have slightly different interest rates and tenures.' },
      { q: 'Is there a foreclosure charge?', a: 'Foreclosure charges vary by partner banks, but many of our private lending partners offer zero foreclosure fees after 12 monthly payments.' }
    ]
  },
  'marriage': {
    title: 'Marriage & Wedding Loan',
    code: 'PL',
    interestRate: '10.49%',
    maxAmount: '25 Lakhs',
    maxTenure: '5 Years',
    processingFee: '1.50%',
    description: 'Celebrate your special day without financial stress. Our wedding loans provide quick access to funds to cover venue bookings, catering, apparel, jewelry, and honeymoon planning.',
    features: [
      'Unsecured personal loan with no collateral requirements',
      'Quick disbursal within 24 hours of approval',
      'Use the funds for any wedding-related expenses without restrictions',
      'Attractive flexi-EMI schemes to ease repayment post-marriage'
    ],
    faqs: [
      { q: 'How fast can I get the wedding loan disbursed?', a: 'Once your documentation is successfully verified by our partner bank, disbursal typically takes less than 24 hours.' },
      { q: 'What document proofs are required?', a: 'You will need standard identity proof (PAN/Aadhaar), address proof, and recent salary slips or bank statements showing steady income.' }
    ]
  },
  'travel': {
    title: 'Travel & Holiday Loan',
    code: 'PL',
    interestRate: '10.49%',
    maxAmount: '10 Lakhs',
    maxTenure: '3 Years',
    processingFee: '1.50%',
    description: 'Explore the world on your own terms. Finance your domestic getaways or international holidays with easy travel loans featuring flexible end-use and simple application procedures.',
    features: [
      'Fund flights, hotels, tour packages, and shopping',
      'Short-term loan options from 12 to 36 months',
      'No security deposit or collateral needed',
      'Minimal paperwork with fully digital approval flow'
    ],
    faqs: [
      { q: 'Can I pay off my travel loan early?', a: 'Yes, early repayments and foreclosures are supported. Check the specific partner bank terms during signing for exact prepayment fees, if any.' },
      { q: 'Does my holiday destination affect my loan?', a: 'Not at all. You can use the funds to travel to any domestic or international destination of your choice.' }
    ]
  },
  'medical': {
    title: 'Medical Emergency Loan',
    code: 'PL',
    interestRate: '9.99%',
    maxAmount: '15 Lakhs',
    maxTenure: '5 Years',
    processingFee: '1.00%',
    description: 'Prioritize health when it matters most. Get fast, hassle-free medical loans to cover hospital bills, surgeries, treatments, and post-operative care not fully covered by insurance.',
    features: [
      'Priority processing with emergency approvals in 2 hours',
      'High-limit financing for complex operations and surgeries',
      'Flexible repayment schemes to match your monthly cash flow',
      'Co-applicant option to boost approval chances during emergencies'
    ],
    faqs: [
      { q: 'Can I apply if I don\'t have health insurance?', a: 'Yes. Our medical emergency loans are designed to provide liquidity precisely when insurance is insufficient or not available.' },
      { q: 'Is the check direct-to-hospital or to my bank account?', a: 'The loan amount is disbursed directly to your bank account, giving you complete flexibility to settle bills with the hospital yourself.' }
    ]
  },
  'education': {
    title: 'Education Loan',
    code: 'EL',
    interestRate: '8.15%',
    maxAmount: '1.5 Crores',
    maxTenure: '15 Years',
    processingFee: '0.00%',
    description: 'Invest in your academic future. Our education loans cover tuition fees, accommodation, study material, and travel expenses for premier institutions in India and abroad.',
    features: [
      'Collateral-free loans up to ₹7.5 Lakhs for recognized courses',
      'Moratorium period: Repayment starts after course completion + 6 months',
      'Tax benefits under Section 80E of the Income Tax Act',
      'Comprehensive coverage of tuition, hostel, and equipment costs'
    ],
    faqs: [
      { q: 'What is a moratorium period?', a: 'It is a holiday period during which you do not have to pay EMIs. Repayment typically starts 6 to 12 months after course completion or immediately after securing employment.' },
      { q: 'Does this cover international universities?', a: 'Yes, our banking partners fund education for thousands of recognized foreign universities across the US, UK, Canada, Europe, and Asia.' }
    ]
  },
  'home': {
    title: 'Home Loan',
    code: 'HL',
    interestRate: '6.95%',
    maxAmount: '10 Crores',
    maxTenure: '30 Years',
    processingFee: '0.25%',
    description: 'Build your sanctuary. Secure your dream home with low interest rates, flexible long-term tenures, and balance transfer features for existing high-rate home loans.',
    features: [
      'Lowest industry interest rates starting at 6.95% p.a.',
      'Flexible extended tenures up to 30 years to minimize EMIs',
      'Home Loan Balance Transfer to reduce your current interest burden',
      'Sanction based on combined household incomes for higher limits'
    ],
    faqs: [
      { q: 'How is my home loan eligibility calculated?', a: 'Eligibility is calculated based on your age, monthly disposable income, existing liabilities, employment stability, and the market value of the property.' },
      { q: 'Can I add a co-applicant to increase the loan amount?', a: 'Yes, adding a co-owner or immediate family member as a co-applicant is highly encouraged to maximize your home loan borrowing limit.' }
    ]
  },
  'gold': {
    title: 'Gold Loan',
    code: 'GL',
    interestRate: '7.25%',
    maxAmount: '50 Lakhs',
    maxTenure: '2 Years',
    processingFee: '0.50%',
    description: 'Unlock the value of your gold jewelry instantly. Get low-interest gold loans with highest Loan-to-Value (LTV) ratios and same-day payouts directly to your account.',
    features: [
      'Highest per-gram valuation and Loan-to-Value (LTV) ratio',
      'Instant disbursal in 30 minutes with physical gold valuation',
      'Low interest rates starting at 7.25% p.a.',
      'Multiple repayment options: Interest-only, bullet payment, or standard EMI'
    ],
    faqs: [
      { q: 'Where will my gold jewelry be stored?', a: 'Your gold ornaments are stored in highly secure, fireproof vaults with 24/7 CCTV surveillance and full insurance coverage.' },
      { q: 'What is the minimum purity required?', a: 'Our gold loan partners accept gold ornaments and jewelry with a purity of 18 carats to 22 carats.' }
    ]
  }
};

export default function LoanTypePage({ params }) {
  const unwrappedParams = use(params);
  const type = unwrappedParams.type;
  const loan = LOAN_DATA[type];

  // Calculator states
  const [income, setIncome] = useState(50000);
  const [existingEmi, setExistingEmi] = useState(10000);
  const [eligibility, setEligibility] = useState(0);

  useEffect(() => {
    // Basic standard eligibility formula
    // Disposable income = (Income * 50%) - Existing EMIs
    const disposable = (income * 0.5) - existingEmi;
    if (disposable <= 0) {
      setEligibility(0);
    } else {
      // Estimated loan amount eligibility based on 60 months multiplier
      const estimatedAmt = disposable * 60;
      setEligibility(estimatedAmt);
    }
  }, [income, existingEmi]);

  if (!loan) {
    return (
      <>
        <Header />
        <main className="main-content flex-center" style={{ minHeight: '85vh', padding: '120px 24px' }}>
          <div style={{ textAlign: 'center', background: 'var(--color-bg-glass-heavy)', padding: '48px', borderRadius: '16px', border: 'var(--border-light)' }}>
            <h1 style={{ color: 'var(--color-error)' }}>Loan Category Not Found</h1>
            <p style={{ margin: '16px 0 24px', color: 'var(--color-text-secondary)' }}>The requested loan category does not exist.</p>
            <Link href="/" className="btn btn-primary">Go to Home</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="main-content" style={{ minHeight: '85vh', padding: '120px 24px 80px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          {/* Breadcrumb / Category Tag */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="light-tag" style={{ color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '6px 16px', borderRadius: '20px', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
              HandToHand Loans • {loan.title}
            </span>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 800, marginTop: '16px', color: 'var(--color-text-primary)', letterSpacing: '-1px' }}>
              Affordable {loan.title}s
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-base)', maxWidth: '700px', margin: '16px auto 0', lineHeight: 1.6 }}>
              {loan.description}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '56px'
          }}>
            {[
              { label: 'Interest Rate', val: `${loan.interestRate} onwards` },
              { label: 'Max Loan Amount', val: `Up to ₹${loan.maxAmount}` },
              { label: 'Repayment Tenure', val: loan.maxTenure },
              { label: 'Processing Fee', val: loan.processingFee }
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'var(--color-bg-glass)',
                border: 'var(--border-light)',
                borderRadius: '12px',
                padding: '24px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-sm)'
              }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{stat.label}</span>
                <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-text-primary)', marginTop: '8px' }}>{stat.val}</div>
              </div>
            ))}
          </div>

          {/* Two Column Layout: Calculator & Features */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '40px',
            alignItems: 'start',
            marginBottom: '56px'
          }}>
            {/* Column 1: Eligibility Estimator */}
            <div style={{
              background: 'var(--color-bg-glass-heavy)',
              border: 'var(--border-light)',
              borderRadius: '16px',
              padding: '32px',
              boxShadow: 'var(--shadow-md)'
            }}>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '24px', fontFamily: 'Outfit, sans-serif' }}>
                🧮 Loan Eligibility Estimator
              </h3>

              {/* Monthly Income Slider */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyStyle: 'space-between', marginBottom: '8px', fontSize: 'var(--text-xs)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Net Monthly Income</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>₹{income.toLocaleString('en-IN')}</span>
                </div>
                <input 
                  type="range" 
                  min="15000" 
                  max="300000" 
                  step="5000" 
                  value={income}
                  onChange={(e) => setIncome(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                />
              </div>

              {/* Existing EMIs Slider */}
              <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', justifyStyle: 'space-between', marginBottom: '8px', fontSize: 'var(--text-xs)' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Existing Monthly EMIs</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-error)' }}>₹{existingEmi.toLocaleString('en-IN')}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="150000" 
                  step="2000" 
                  value={existingEmi}
                  onChange={(e) => setExistingEmi(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--color-primary)' }}
                />
              </div>

              {/* Eligibility Result Display */}
              <div style={{
                background: 'rgba(0, 215, 86, 0.04)',
                border: '1px dashed rgba(0, 215, 86, 0.25)',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'center',
                marginBottom: '24px'
              }}>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Estimated Loan Amount Eligibility</span>
                <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, color: 'var(--color-primary)', marginTop: '8px' }}>
                  ₹{eligibility.toLocaleString('en-IN')}
                </div>
              </div>

              <Link 
                href={`/check?type=${loan.code}`} 
                className="btn btn-primary" 
                style={{ width: '100%', textAlign: 'center', display: 'block', padding: '14px 20px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700 }}
              >
                Apply Now
              </Link>
            </div>

            {/* Column 2: Key Features & Benefits */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              <div style={{
                background: 'var(--color-bg-glass-heavy)',
                border: 'var(--border-light)',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: 'var(--shadow-md)'
              }}>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '24px', fontFamily: 'Outfit, sans-serif' }}>
                  ✨ Key Features & Benefits
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {loan.features.map((feat, i) => (
                    <li key={i} style={{ display: 'flex', gap: '12px', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                      <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>✓</span>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Security Shield Callout */}
              <div style={{
                background: 'var(--color-bg-glass)',
                border: 'var(--border-light)',
                borderRadius: '12px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'var(--color-primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-primary)',
                  flexShrink: 0
                }}>
                  🛡️
                </div>
                <div>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', margin: 0 }}>Safe & Secure Processes</h4>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', margin: '2px 0 0 0' }}>Your details are secured using bank-grade AES 256-bit encryption.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          <div style={{
            background: 'var(--color-bg-glass-heavy)',
            border: 'var(--border-light)',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: 'var(--shadow-md)'
          }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '32px', textAlign: 'center', fontFamily: 'Outfit, sans-serif' }}>
              ❓ Frequently Asked Questions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {loan.faqs.map((faq, i) => (
                <div key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '20px' }}>
                  <h4 style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                    Q: {faq.q}
                  </h4>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: 0 }}>
                    A: {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
