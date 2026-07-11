import EmiCalculatorPageClient from '../emi-calculator/emi-calculator-client';
import Link from 'next/link';

export const metadata = {
  title: 'Business Loan EMI Calculator - Estimate Working Capital EMIs Online',
  description: 'Use our free Business Loan EMI Calculator to estimate monthly installments and total interest for working capital loans and MSME setups. Compare NBFC policy requirements.',
  keywords: ['business loan emi calculator', 'MSME loan calculator', 'calculate business loan emi', 'working capital calculator', 'unsecured business loan rates'],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FinancialCalculator',
  'name': 'Business Loan EMI Calculator',
  'description': 'Calculate monthly business loan EMIs, total interest payable, and generate commercial loan amortization schedules instantly.',
  'category': 'Business Loan Calculator',
  'url': 'https://handtohandloans.in/business-loan-emi-calculator'
};

export default function BusinessLoanEmiCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EmiCalculatorPageClient
        badge="Commercial Finance Tool"
        title={<>Business Loan <span className="text-gradient">EMI Calculator</span></>}
        subtitle="Evaluate your working capital installments, check MSME finance costs, and check company borrowing eligibility in seconds."
        defaultAmount={1000000}
        defaultRate={15}
        defaultTenure={36}
        defaultTenureType="months"
      >
        <section className="section bg-light" style={{ padding: '60px 0', borderTop: '1px solid var(--border-default)', background: 'rgba(255, 255, 255, 0.02)' }}>
          <div className="container" style={{ maxWidth: '900px' }}>
            <div style={{ display: 'grid', gap: '40px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)', lineHeight: '1.8' }}>
              
              {/* Guide Introduction */}
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
                  Planning Commercial Loans for Business Expansion
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                  A business loan is a powerful lever to fund inventory purchases, hire personnel, acquire machinery, or manage short-term working capital gaps. Since business loans are calculated based on your company's revenue, vintage, and balance sheet health, interest rates tend to be slightly higher than property loans. Our **Business Loan EMI Calculator** enables you to forecast expenses precisely so that borrowing does not strain your business cash flow.
                </p>
              </div>

              {/* Business loan criteria highlights */}
              <div style={{ background: 'var(--color-bg-glass)', border: 'var(--border-light)', borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
                  Important Business Loan Requirements & Tips
                </h3>
                <ul style={{ paddingLeft: '20px', display: 'grid', gap: '12px', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  <li><strong>Business Vintage:</strong> Lenders usually require your business to have been active and operational for at least 1 to 3 years.</li>
                  <li><strong>Banking & GST Transactions:</strong> Consistent cash inflows reflected in bank statements and matching GST filings drastically improve your approval chances.</li>
                  <li><strong>Collateral vs. Unsecured:</strong> Secured business loans (backed by real estate or assets) offer much lower interest rates and lower EMIs than unsecured business loans.</li>
                </ul>
              </div>

              {/* Debt Service Coverage Ratio (DSCR) */}
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
                  Debt Service Coverage Ratio (DSCR)
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px' }}>
                  For commercial loans, lenders check your business's **Debt Service Coverage Ratio (DSCR)** instead of FOIR. It measures your net operating income against your total debt service obligations (interest and principal payments). A DSCR score above 1.25 indicates that your business generates more than enough cash flow to cover its loan EMIs, making you a low-risk borrower.
                </p>
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
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: '#fff', margin: 0 }}>Check Business Loan Eligibility with Leading Lenders</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', maxWidth: '500px', margin: 0 }}>
                  Analyze eligibility criteria dynamically across our registered network of NBFCs and commercial banks in India.
                </p>
                <Link href="/check" className="btn btn-primary" style={{ padding: '12px 28px', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', display: 'inline-block', marginTop: '8px' }}>
                  🚀 Check Business Loan Eligibility
                </Link>
              </div>

            </div>
          </div>
        </section>
      </EmiCalculatorPageClient>
    </>
  );
}
