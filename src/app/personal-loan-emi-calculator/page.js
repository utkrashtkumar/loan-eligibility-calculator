import EmiCalculatorPageClient from '../emi-calculator/emi-calculator-client';
import Link from 'next/link';

export const metadata = {
  title: 'Personal Loan EMI Calculator - Calculate Monthly Installments Online',
  description: 'Use our free Personal Loan EMI Calculator to estimate your monthly payments, total interest, and check eligibility instantly. Compare interest rates of top banks and NBFCs.',
  keywords: ['personal loan emi calculator', 'calculate personal loan emi', 'instant personal loan calculator', 'reducing balance calculator personal loan', 'personal loan interest rates'],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FinancialCalculator',
  'name': 'Personal Loan EMI Calculator',
  'description': 'Calculate monthly personal loan EMIs, total interest payable, and generate amortization schedules instantly.',
  'category': 'Personal Loan Calculator',
  'url': 'https://handtohandloans.in/personal-loan-emi-calculator'
};

export default function PersonalLoanEmiCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EmiCalculatorPageClient
        badge="Personal Finance Tool"
        title={<>Personal Loan <span className="text-gradient">EMI Calculator</span></>}
        subtitle="Estimate your monthly personal loan payouts, view complete amortization reports, and calculate eligibility in seconds."
        defaultAmount={500000}
        defaultRate={10.99}
        defaultTenure={60}
        defaultTenureType="months"
      >
        <section className="section bg-light" style={{ padding: '60px 0', borderTop: '1px solid var(--border-default)', background: 'rgba(255, 255, 255, 0.02)' }}>
          <div className="container" style={{ maxWidth: '900px' }}>
            <div style={{ display: 'grid', gap: '40px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)', lineHeight: '1.8' }}>
              
              {/* Guide Introduction */}
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
                  Planning Your Personal Loan Payouts
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                  Personal loans are unsecured financial tools that help you meet immediate expenses—be it a medical emergency, wedding, travel, or debt consolidation. Because personal loans have slightly higher interest rates compared to secured loans (like home loans), planning your monthly payments is key to maintaining a healthy credit score. Our **Personal Loan EMI Calculator** helps you calculate exactly how much you need to pay each month.
                </p>
              </div>

              {/* Factors that affect EMI */}
              <div style={{ background: 'var(--color-bg-glass)', border: 'var(--border-light)', borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
                  Key Factors Affecting Your Personal Loan EMI
                </h3>
                <ul style={{ paddingLeft: '20px', display: 'grid', gap: '12px', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  <li><strong>Credit Score (CIBIL):</strong> A score above 750 helps you secure the lowest personal loan interest rates, minimizing your EMI.</li>
                  <li><strong>Loan Amount (Principal):</strong> Borrowing more increases your monthly payment. Use our tool to find a comfortable balance.</li>
                  <li><strong>Tenure (Repayment Period):</strong> A longer tenure decreases your monthly EMI but increases the overall interest cost. A shorter tenure does the opposite.</li>
                  <li><strong>Interest Charging Method:</strong> Opt for reducing interest balance methods as they are more cost-effective than flat interest rates.</li>
                </ul>
              </div>

              {/* Tips for lowering EMI */}
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
                  How to Reduce Your Personal Loan EMI?
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px' }}>
                  If your calculated EMI is higher than your budget allows, here are some actionable strategies to bring it down:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                  <div style={{ background: 'var(--color-bg-glass)', border: 'var(--border-light)', borderRadius: '12px', padding: '20px' }}>
                    <h4 style={{ color: 'var(--color-primary)', fontWeight: 700, margin: '0 0 10px 0', fontSize: 'var(--text-sm)' }}>Extend Tenure</h4>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
                      Increasing the repayment duration spread lowers your monthly installment instantly. However, bear in mind this will increase total interest costs over time.
                    </p>
                  </div>
                  <div style={{ background: 'var(--color-bg-glass)', border: 'var(--border-light)', borderRadius: '12px', padding: '20px' }}>
                    <h4 style={{ color: 'var(--color-primary)', fontWeight: 700, margin: '0 0 10px 0', fontSize: 'var(--text-sm)' }}>Improve Credit History</h4>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0 }}>
                      If your credit score is high, negotiate for a lower interest rate with the lender. Even a 0.5% rate cut can save you thousands in EMIs.
                    </p>
                  </div>
                </div>
              </div>

              {/* Eligibility CTA */}
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
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: '#fff', margin: 0 }}>Check Personal Loan Eligibility Across 100+ Lenders</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', maxWidth: '500px', margin: 0 }}>
                  Match your income, credit score, and obligations to find instant lending offers from our registered bank partners.
                </p>
                <Link href="/check" className="btn btn-primary" style={{ padding: '12px 28px', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', display: 'inline-block', marginTop: '8px' }}>
                  🚀 Check Personal Loan Eligibility
                </Link>
              </div>

            </div>
          </div>
        </section>
      </EmiCalculatorPageClient>
    </>
  );
}
