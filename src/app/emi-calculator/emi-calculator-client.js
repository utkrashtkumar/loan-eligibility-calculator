'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EmiCalculator from '@/components/EmiCalculator';
import Link from 'next/link';

export default function EmiCalculatorPageClient() {
  return (
    <>
      <Header />
      
      {/* Hero Section */}
      <section className="section bg-light" style={{ paddingTop: '120px', paddingBottom: '40px', background: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.05) 0%, transparent 50%)' }}>
        <div className="container" style={{ maxWidth: '1200px', textAlign: 'center' }}>
          <span style={{
            fontSize: '11px',
            fontWeight: 800,
            color: 'var(--color-primary)',
            background: 'rgba(99, 102, 241, 0.1)',
            padding: '6px 16px',
            borderRadius: '20px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            display: 'inline-block',
            marginBottom: '16px'
          }}>
            Smart Financial Tools
          </span>
          <h1 className="section-title" style={{ fontSize: '2.8rem', fontWeight: 800, lineHeight: '1.2', margin: '0 0 16px 0' }} id="main-title">
            Free Online <span className="text-gradient">Loan EMI Calculator</span>
          </h1>
          <p className="section-subtitle" style={{ maxWidth: '640px', margin: '0 auto', fontSize: 'var(--text-md)', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
            Calculate monthly installments, check total interest payable, generate reducing vs flat rate schedules, and evaluate your loan eligibility instantly.
          </p>
        </div>
      </section>

      {/* Calculator Section */}
      <section className="section" style={{ paddingTop: '0px', paddingBottom: '60px' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          <div style={{
            background: 'var(--color-bg-glass-heavy)',
            border: 'var(--border-light)',
            borderRadius: '24px',
            padding: '24px',
            boxShadow: 'var(--shadow-lg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}>
            <EmiCalculator />
          </div>
        </div>
      </section>

      {/* SEO Article / Guide Section */}
      <section className="section bg-light" style={{ padding: '60px 0', borderTop: '1px solid var(--border-default)', background: 'rgba(255, 255, 255, 0.02)' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div style={{ display: 'grid', gap: '40px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)', lineHeight: '1.8' }}>
            
            {/* Guide Introduction */}
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
                Understanding Your Loan EMIs
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                Taking a loan is a significant financial commitment. Whether you are funding a new business, buying a dream home, purchasing a car, or addressing personal medical/family requirements, understanding how your monthly payments are calculated is crucial. Our free **Loan EMI Calculator** gives you a complete mathematical breakdown of your liabilities, allowing you to borrow responsibly and plan ahead.
              </p>
            </div>

            {/* Formula explanation */}
            <div style={{ background: 'var(--color-bg-glass)', border: 'var(--border-light)', borderRadius: '16px', padding: '24px' }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
                How is Loan EMI Calculated?
              </h3>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px' }}>
                Equated Monthly Installment (EMI) calculations depend on the loan principal amount, the interest rate per month, and the total number of monthly tenure periods. The standard mathematical formula for computing reducing balance EMI is:
              </p>
              <div style={{
                background: 'var(--color-bg-input)',
                border: '1px solid var(--border-default)',
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center',
                fontFamily: 'monospace',
                fontSize: '15px',
                fontWeight: 'bold',
                color: 'var(--color-primary)',
                margin: '16px 0'
              }}>
                EMI = [P x R x (1+R)^N] / [(1+R)^N - 1]
              </div>
              <ul style={{ paddingLeft: '20px', display: 'grid', gap: '8px', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                <li><strong>P (Principal):</strong> The actual loan amount borrowed from the bank or NBFC.</li>
                <li><strong>R (Monthly Interest Rate):</strong> Annual interest rate divided by 12 and then divided by 100. (e.g. 12% per annum = 1% or 0.01 per month).</li>
                <li><strong>N (Tenure):</strong> The duration of the loan in terms of months. (e.g. 3 years = 36 months).</li>
              </ul>
            </div>

            {/* Reducing vs Flat rate */}
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
                Reducing Balance Rate vs. Flat Interest Rate
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px' }}>
                Lenders typically calculate interest using one of two methods. It is essential to understand the difference as it significantly affects your total interest payable:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                <div style={{ background: 'var(--color-bg-glass)', border: 'var(--border-light)', borderRadius: '12px', padding: '20px' }}>
                  <h4 style={{ color: 'var(--color-success)', fontWeight: 700, margin: '0 0 10px 0', fontSize: 'var(--text-sm)' }}>1. Reducing Balance Method</h4>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Interest is charged only on the remaining outstanding principal amount at the end of each month. As you pay off your principal, the interest component decreases continuously. This is the standard practice for modern banks.
                  </p>
                </div>
                <div style={{ background: 'var(--color-bg-glass)', border: 'var(--border-light)', borderRadius: '12px', padding: '20px' }}>
                  <h4 style={{ color: '#f59e0b', fontWeight: 700, margin: '0 0 10px 0', fontSize: 'var(--text-sm)' }}>2. Flat Rate Method</h4>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
                    Interest is calculated on the full initial principal amount throughout the entire loan tenure, irrespective of the payments made. Although flat rates look lower on paper, they result in a significantly higher total interest cost than reducing balance rates.
                  </p>
                </div>
              </div>
            </div>

            {/* FOIR explanation */}
            <div>
              <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
                How Does FOIR Affect Your Loan Eligibility?
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                When banks evaluate your loan checker applications, they inspect your **Fixed Obligation to Income Ratio (FOIR)**. FOIR represents the percentage of your monthly net income that is spent on active liabilities (including existing EMIs and the proposed new loan).
              </p>
              <ul style={{ paddingLeft: '20px', display: 'grid', gap: '8px', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '12px' }}>
                <li><strong>High Eligibility (FOIR &lt; 50%):</strong> Banks consider you low-risk. You have a high probability of fast approval.</li>
                <li><strong>Medium Eligibility (FOIR 50% - 65%):</strong> Lenders might approve with extra document verification or stricter terms.</li>
                <li><strong>Low Eligibility (FOIR &gt; 65%):</strong> High debt load. Approval rates are low unless you opt for longer tenures or pay off existing loans.</li>
              </ul>
            </div>

            {/* Eligibility Redirect CTA */}
            <div style={{
              background: 'radial-gradient(circle at 100% 100%, rgba(99, 102, 241, 0.08) 0%, transparent 60%)',
              border: '1px dashed var(--color-primary)',
              borderRadius: '16px',
              padding: '30px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              alignItems: 'center',
              marginTop: '10px'
            }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: '#fff', margin: 0 }}>Ready to Check Your Real Eligibility?</h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', maxWidth: '500px', margin: 0 }}>
                Don&apos;t guess! Use our instant algorithmic eligibility checker to match your profile against criteria from over 100+ partner banks and NBFCs.
              </p>
              <Link href="/check" className="btn btn-primary" style={{ padding: '12px 28px', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', display: 'inline-block', marginTop: '8px' }}>
                🚀 Check Loan Eligibility Now
              </Link>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
