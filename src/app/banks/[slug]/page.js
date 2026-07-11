import { supabase } from '@/lib/supabase';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

// Simple slugify helper
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-');        // Replace multiple - with single -
}

export async function generateStaticParams() {
  try {
    const { data: policies } = await supabase
      .from('bank_policies')
      .select('bank_name');
    
    if (!policies) return [];
    
    return policies.map((p) => ({
      slug: slugify(p.bank_name),
    }));
  } catch (e) {
    console.error('Error generating static params:', e);
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  // Fetch matching bank
  const { data: policies } = await supabase
    .from('bank_policies')
    .select('bank_name, special_notes');
    
  const bank = (policies || []).find((p) => slugify(p.bank_name) === slug);
  const bankName = bank ? bank.bank_name : 'Partner Lender';

  return {
    title: `${bankName} Loan Eligibility Criteria & Policies | HandToHand Loans`,
    description: `Compare minimum CIBIL credit score, salary requirements, age limit, and documents required to apply for a loan with ${bankName} on HandToHand Loans.`,
    keywords: [bankName, `${bankName} loan`, `${bankName} eligibility`, `${bankName} interest rate`, 'loan eligibility check'],
  };
}

export default async function BankPolicyDetailPage({ params }) {
  const { slug } = await params;

  // Fetch all bank policies to find the matched one safely
  const { data: policies } = await supabase
    .from('bank_policies')
    .select('*');

  const bank = (policies || []).find((p) => slugify(p.bank_name) === slug);

  if (!bank) {
    return (
      <>
        <Header />
        <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: '#fff' }}>
          <h2>Lender Profile Not Found</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>The requested bank policy criteria could not be located.</p>
          <Link href="/banks" className="btn btn-primary" style={{ padding: '10px 24px', textDecoration: 'none' }}>
            Back to Partner Network
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  // Format type label
  let categoryLabel = 'Salaried Loan';
  if (bank.loan_type === 'BL' || bank.policy_category === 'business') {
    categoryLabel = 'Business Loan';
  } else if (bank.policy_category === 'instant') {
    categoryLabel = 'Instant Pocket Loan';
  }

  // Dynamic JSON-LD structured data for Google Search rich snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FinancialService',
    'name': `${bank.bank_name} Loan Policy Criteria`,
    'description': `Detailed credit benchmarks, salary limits, and lending policies for ${bank.bank_name} personal/business loans.`,
    'url': `https://handtohandloans.in/banks/${slug}`,
    'provider': {
      '@type': 'FinancialService',
      'name': 'HandToHand Loans',
      'url': 'https://handtohandloans.in'
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />

      <main style={{ paddingTop: '120px', paddingBottom: '80px', color: '#fff' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          
          {/* Back button */}
          <Link href="/banks" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)', textDecoration: 'none', fontSize: 'var(--text-xs)', fontWeight: 600, marginBottom: '24px' }}>
            ← Back to All Lenders
          </Link>

          {/* Hero Banner card */}
          <div style={{
            background: 'var(--gradient-card-dark)',
            border: 'var(--border-light)',
            borderRadius: '24px',
            padding: '40px 32px',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: '32px',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 100% 0%, rgba(99, 102, 241, 0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', zIndex: 2 }}>
              {/* Logo & Category badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                {bank.logo_url ? (
                  <img src={bank.logo_url} alt={`${bank.bank_name} logo`} style={{ height: '48px', objectFit: 'contain', maxWidth: '200px', filter: 'brightness(1.1)' }} />
                ) : (
                  <div style={{ background: 'var(--color-primary-bg)', color: 'var(--color-primary)', height: '48px', width: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' }}>
                    {bank.bank_name.charAt(0)}
                  </div>
                )}
                <span className="badge" style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: 'var(--color-primary)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                  fontSize: '11px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  {categoryLabel}
                </span>
              </div>

              {/* Title heading */}
              <div>
                <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 800, margin: '0 0 8px 0', fontFamily: 'var(--font-heading)' }}>
                  {bank.bank_name} Eligibility Criteria
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', margin: 0, lineHeight: 1.6 }}>
                  Detailed underwriting benchmarks and scoring policies for personal/commercial financing with {bank.bank_name}. Compare requirements before submitting applications.
                </p>
              </div>
            </div>
          </div>

          {/* Criteria Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '40px' }}>
            
            {/* CIBIL Limit Card */}
            <div style={{ background: 'var(--color-bg-glass-heavy)', border: 'var(--border-light)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ color: 'var(--color-text-tertiary)', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Required CIBIL Score</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-success)' }}>
                {bank.min_cibil > 0 ? `${bank.min_cibil}+` : 'No Minimum'}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>
                Applicants with credit score checks higher than the threshold are eligible for accelerated approval.
              </p>
            </div>

            {/* Income Threshold Card */}
            <div style={{ background: 'var(--color-bg-glass-heavy)', border: 'var(--border-light)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ color: 'var(--color-text-tertiary)', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Minimum Income Requirement</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: 'var(--color-primary)' }}>
                {bank.min_salary > 0 ? `₹${Number(bank.min_salary).toLocaleString('en-IN')}/mo` : 'Not Specified'}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>
                Net monthly income received via bank transfers. Cash salary deposits are generally not accepted.
              </p>
            </div>

            {/* Age bracket Card */}
            <div style={{ background: 'var(--color-bg-glass-heavy)', border: 'var(--border-light)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ color: 'var(--color-text-tertiary)', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Age Bracket Limits</div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 800, color: '#f59e0b' }}>
                {bank.min_age && bank.max_age ? `${bank.min_age} - ${bank.max_age} Years` : 'Not Specified'}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>
                Applicant age limits at the time of loan setup maturity must lie within this window.
              </p>
            </div>

          </div>

          {/* In-depth parameters table */}
          <div style={{ background: 'var(--color-bg-glass-heavy)', border: 'var(--border-light)', borderRadius: '20px', padding: '28px', marginBottom: '40px' }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>Lender Policy Matrix</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { label: 'Company Category Code', value: bank.company_category || 'ALL CATEGORIES' },
                { label: 'Salary Slip / PF Required', value: bank.pf_required === 'Yes' ? 'Yes, PF details required' : 'No PF required' },
                { label: 'Max Obligation Limit (FOIR)', value: bank.foir_max ? `${bank.foir_max}%` : 'Not Specified' },
                { label: 'Employment Stability Threshold', value: bank.min_experience || 'N/A' },
                { label: 'Residential Stability Check', value: bank.min_residence_stability || 'N/A' },
                { label: 'Serviceable Pincodes Coverage', value: bank.all_pincodes ? 'PAN India (All Locations)' : 'Specific Cities Only' }
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '12px', fontSize: 'var(--text-xs)', gap: '16px' }}>
                  <span style={{ color: 'var(--color-text-tertiary)' }}>{row.label}</span>
                  <span style={{ fontWeight: 600, textAlign: 'right' }}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Policy notes */}
          {bank.special_notes && (
            <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '16px', padding: '20px 24px', marginBottom: '40px' }}>
              <h4 style={{ color: '#f59e0b', fontSize: 'var(--text-xs)', fontWeight: 700, margin: '0 0 8px 0', textTransform: 'uppercase' }}>Special Guidelines / Notes</h4>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
                {bank.special_notes}
              </p>
            </div>
          )}

          {/* Action CTAs */}
          <div style={{
            background: 'radial-gradient(circle at 0% 100%, rgba(99, 102, 241, 0.08) 0%, transparent 60%)',
            border: '1px dashed var(--color-primary)',
            borderRadius: '20px',
            padding: '32px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'center'
          }}>
            <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 800, margin: 0 }}>Check Your Eligibility For {bank.bank_name}</h3>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', maxWidth: '500px', margin: 0 }}>
              Use our instant credit-matching engine to verify if your salary, age, and location parameters satisfy {bank.bank_name}&apos;s underwriting algorithms.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link href="/check" className="btn btn-primary" style={{ padding: '12px 28px', borderRadius: '8px', fontWeight: 700, textDecoration: 'none' }}>
                🚀 Check Instant Eligibility
              </Link>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </>
  );
}
