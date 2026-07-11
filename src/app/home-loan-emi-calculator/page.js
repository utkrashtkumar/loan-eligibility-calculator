import EmiCalculatorPageClient from '../emi-calculator/emi-calculator-client';
import Link from 'next/link';

export const metadata = {
  title: 'Home Loan EMI Calculator - Calculate Housing Loan EMIs Online',
  description: 'Estimate your home loan monthly payments and total interest payable using our free Home Loan EMI Calculator. View detailed amortization table.',
  keywords: ['home loan emi calculator', 'housing loan calculator', 'calculate home loan emi', 'reducing balance housing loan', 'home loan interest rates'],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FinancialCalculator',
  'name': 'Home Loan EMI Calculator',
  'description': 'Calculate monthly home loan EMIs, total interest payable, and generate housing loan amortization schedules instantly.',
  'category': 'Home Loan Calculator',
  'url': 'https://handtohandloans.in/home-loan-emi-calculator'
};

export default function HomeLoanEmiCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EmiCalculatorPageClient
        badge="Property Finance Tool"
        title={<>Home Loan <span className="text-gradient">EMI Calculator</span></>}
        subtitle="Calculate housing loan monthly payments, view long-term interest costs, and analyze your eligibility instantly."
        defaultAmount={3500000}
        defaultRate={8.5}
        defaultTenure={20}
        defaultTenureType="years"
      >
        <section className="section bg-light" style={{ padding: '60px 0', borderTop: '1px solid var(--border-default)', background: 'rgba(255, 255, 255, 0.02)' }}>
          <div className="container" style={{ maxWidth: '900px' }}>
            <div style={{ display: 'grid', gap: '40px', color: 'var(--color-text-primary)', fontFamily: 'var(--font-body)', lineHeight: '1.8' }}>
              
              {/* Guide Introduction */}
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
                  Planning Your Home Purchase Responsibly
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                  Buying a home is one of the biggest investments in a person&apos;s life. Housing loans are long-term commitments, typically spanning 15 to 30 years. Even a tiny change in the interest rate or a small pre-payment can save you lakhs of rupees in interest over decades. Our **Home Loan EMI Calculator** helps you plan your monthly housing budget and visualize how your principal decreases over time.
                </p>
              </div>

              {/* Home Loan vs Personal Loan difference */}
              <div style={{ background: 'var(--color-bg-glass)', border: 'var(--border-light)', borderRadius: '16px', padding: '24px' }}>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
                  Important Home Loan Rules & Tips
                </h3>
                <ul style={{ paddingLeft: '20px', display: 'grid', gap: '12px', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                  <li><strong>Down Payment (LTV Ratio):</strong> Banks usually fund up to 75% to 90% of the property value. A larger down payment decreases your loan amount, lowering your EMI and total interest.</li>
                  <li><strong>Tax Benefits:</strong> You can claim deductions on home loan principal repayments under Section 80C and interest payments under Section 24b of the Income Tax Act.</li>
                  <li><strong>Pre-payments:</strong> Most banks do not charge pre-payment penalties on floating interest rate home loans. Making occasional part-prepayments can cut your loan tenure by years!</li>
                </ul>
              </div>

              {/* Amortization understanding */}
              <div>
                <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
                  Understanding Your Amortization Schedule
                </h2>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px' }}>
                  In the initial years of a housing loan, a massive percentage of your EMI goes towards paying the interest, while only a small chunk reduces the principal. As time progresses, this ratio reverses. Check the **Amortization Table** under our calculator on this page to see exactly how your monthly installments are split between principal and interest.
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
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 800, color: '#fff', margin: 0 }}>Check Home Loan Eligibility Across Top Banks</h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', maxWidth: '500px', margin: 0 }}>
                  Compare property loan thresholds, maximum loan-to-value limits, and interest rates dynamically.
                </p>
                <Link href="/check" className="btn btn-primary" style={{ padding: '12px 28px', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', display: 'inline-block', marginTop: '8px' }}>
                  🚀 Check Home Loan Eligibility
                </Link>
              </div>

            </div>
          </div>
        </section>
      </EmiCalculatorPageClient>
    </>
  );
}
