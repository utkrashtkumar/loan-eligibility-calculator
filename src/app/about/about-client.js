'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function AboutClient() {
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
            About HandToHand Loans
          </span>
          <h1 className="section-title" style={{ fontSize: '2.8rem', fontWeight: 800, lineHeight: '1.2', margin: '0 0 16px 0' }}>
            Empowering Your <span className="text-gradient">Financial Future</span>
          </h1>
          <p className="section-subtitle" style={{ maxWidth: '640px', margin: '0 auto', fontSize: 'var(--text-md)', color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>
            India&apos;s leading algorithmic loan marketplace, matching borrowers with the lowest-interest lending options from over 100+ partner banks and NBFCs.
          </p>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="section" style={{ padding: '60px 0' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
            
            {/* Mission Card */}
            <div style={{
              background: 'var(--color-bg-glass)',
              border: 'var(--border-light)',
              borderRadius: '20px',
              padding: '40px 32px',
              boxShadow: 'var(--shadow-md)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>🎯</div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
                Our Mission
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.7', margin: 0 }}>
                To democratize credit access in India by leveraging artificial intelligence and data-driven algorithms. We aim to remove manual friction, eliminate hidden brokerage charges, and make credit evaluations transparent for every Indian citizen.
              </p>
            </div>

            {/* Vision Card */}
            <div style={{
              background: 'var(--color-bg-glass)',
              border: 'var(--border-light)',
              borderRadius: '20px',
              padding: '40px 32px',
              boxShadow: 'var(--shadow-md)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)'
            }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>🚀</div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
                Our Vision
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', lineHeight: '1.7', margin: 0 }}>
                A completely digital credit ecosystem where matching a borrower to the right bank is as instant and reliable as checking weather reports. We envision a financially inclusive society supported by fair, customized borrowing parameters.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="section bg-light" style={{ padding: '60px 0', borderTop: '1px solid var(--border-default)', background: 'rgba(255, 255, 255, 0.01)' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', textAlign: 'center', marginBottom: '40px', fontFamily: 'var(--font-heading)' }}>
            Core Values Driving Our Platform
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            {[
              { icon: '🔒', title: 'Absolute Trust', text: 'We prioritize client data privacy and secure transmission. Every transaction is encrypted.' },
              { icon: '👁️', title: 'Radical Transparency', text: 'No hidden charges, markups, or referral bias. You see exact policies and calculations.' },
              { icon: '⚙️', title: 'Algorithmic Matching', text: 'We match loan seekers with lender criteria mathematically, ensuring approval rates exceed 92%.' },
              { icon: '👥', title: 'Customer First', text: 'Our platform, PWA application, and support staff are designed to ensure seamless financial access.' }
            ].map((v) => (
              <div key={v.title} style={{
                background: 'var(--color-bg-secondary)',
                border: 'var(--border-subtle)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', marginBottom: '12px' }}>{v.icon}</div>
                <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>{v.title}</h4>
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.6', margin: 0 }}>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="section" style={{ padding: '60px 0' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '20px',
            textAlign: 'center'
          }}>
            {[
              { value: '100+', label: 'Partner Lenders', color: 'var(--color-primary)' },
              { value: '50k+', label: 'Borrowers Helped', color: 'var(--color-success)' },
              { value: '94%', label: 'Approval Rate', color: 'var(--color-accent)' },
              { value: '2 Min', label: 'Average Match Time', color: 'var(--color-warning)' }
            ].map((s) => (
              <div key={s.label} style={{
                background: 'var(--color-bg-glass-heavy)',
                border: 'var(--border-light)',
                borderRadius: '16px',
                padding: '24px'
              }}>
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-heading)', marginBottom: '4px' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Redirect banner */}
      <section className="section" style={{ paddingBottom: '80px' }}>
        <div className="container" style={{ maxWidth: '1000px' }}>
          <div style={{
            background: 'radial-gradient(circle at 100% 100%, rgba(99, 102, 241, 0.08) 0%, transparent 60%)',
            border: '1px dashed var(--color-primary)',
            borderRadius: '24px',
            padding: '40px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            alignItems: 'center'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: 0, fontFamily: 'var(--font-heading)' }}>
              Check Your Loan Eligibility Instantly
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', maxWidth: '600px', margin: 0, lineHeight: '1.6' }}>
              Why wait? Get matched with our 100+ partner banks and find the absolute best loan deal for your salary or business profile in less than 2 minutes.
            </p>
            <Link href="/check" className="btn btn-primary" style={{ padding: '12px 32px', borderRadius: '8px', fontWeight: 700, textDecoration: 'none', display: 'inline-block', marginTop: '8px' }}>
              🚀 Start Free Eligibility Check
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
