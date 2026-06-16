'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EmiCalculator from '@/components/EmiCalculator';

export default function Home() {
  const [activeFaq, setActiveFaq] = useState(null);
  const [formState, setFormState] = useState({ name: '', email: '', subject: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleFaqToggle = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formState.name || !formState.email || !formState.message) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormState({ name: '', email: '', subject: '', message: '' });
    }, 1200);
  };

  const faqs = [
    {
      q: "What is Hand to Hand Fintech?",
      a: "Hand to Hand Fintech is an intelligent platform that lets you check your personal loan eligibility across 10+ major Indian banks and NBFCs in under 60 seconds. We analyze your credit profile, salary, location, and existing liabilities against complex bank lending rules to find your best matches."
    },
    {
      q: "Is checking my eligibility free, and does it affect my CIBIL score?",
      a: "Yes, our eligibility check is 100% free and always will be. Checking your eligibility on our platform is a \"soft search\" and does not impact your CIBIL credit score in any way."
    },
    {
      q: "What documents are required to apply for a loan after matching?",
      a: "Typically, you will need your PAN card, Aadhaar card, last 3 months' bank statements, salary slips (for salaried individuals), or business proof (for self-employed individuals)."
    },
    {
      q: "How accurate are the eligibility scores?",
      a: "Our matching engine uses real-time bank policies, credit criteria, FOIR calculations, and location mapping. While highly accurate (90%+ alignment with bank decisions), the final loan approval and interest rates are determined solely by the partner bank/NBFC after physical document verification."
    },
    {
      q: "How can I earn commissions as a Referral Agent?",
      a: "You can sign up as a Referral Agent, check eligibility for your clients, submit their applications, and track progress on your Agent Dashboard. You earn payouts/commissions for every successfully disbursed loan."
    }
  ];

  return (
    <>
      <Header />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
          <div className="hero-orb hero-orb-3"></div>
          <div className="hero-grid"></div>
        </div>

        <div className="hero-content visible">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            Trusted by 10,000+ borrowers
          </div>

          <h1 className="hero-title">
            Check Your Loan Eligibility
            <span className="hero-title-gradient"> in 60 Seconds</span>
          </h1>

          <p className="hero-subtitle">
            Compare 10+ banks &amp; NBFCs instantly. Find the best personal loan 
            match for your profile — completely free.
          </p>

          <Link href="/check" className="btn-primary hero-cta">
            Check Eligibility Now
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>

          {/* Floating Stats */}
          <div className="hero-stats" style={{ flexWrap: 'wrap', justifyContent: 'center' }}>
            <div className="hero-stat-card">
              <span className="hero-stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent)' }}>
                  <path d="M3 21h18" />
                  <path d="M3 10h18" />
                  <path d="M5 6h14" />
                  <path d="M4 10v11" />
                  <path d="M20 10v11" />
                  <path d="M8 14v3" />
                  <path d="M12 14v3" />
                  <path d="M16 14v3" />
                  <path d="M12 2L2 7h20L12 2z" />
                </svg>
              </span>
              <span className="hero-stat-value">10+</span>
              <span className="hero-stat-label">Banks & NBFCs</span>
            </div>
            <div className="hero-stat-card">
              <span className="hero-stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent)' }}>
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </span>
              <span className="hero-stat-value">60s</span>
              <span className="hero-stat-label">Instant Results</span>
            </div>
            <div className="hero-stat-card">
              <span className="hero-stat-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-accent)' }}>
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </span>
              <span className="hero-stat-value">100%</span>
              <span className="hero-stat-label">Free Forever</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why HandToHand? Section */}
      <section className="section features-section" style={{ paddingBottom: '32px' }}>
        <div className="container">
          <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '48px' }}>
            Why <span className="text-gradient">HandToHand?</span>
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(240px, 100%), 1fr))',
            gap: '24px'
          }}>
            {/* Faster Approvals */}
            <div className="feature-card" style={{
              background: 'var(--color-bg-glass-heavy)',
              border: 'var(--border-light)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '40px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(6, 182, 212, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(6, 182, 212, 0.15)',
                marginBottom: '8px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Faster Approvals
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                API integrations directly with lenders cut processing times by 80%.
              </p>
            </div>

            {/* Smart Matching */}
            <div className="feature-card" style={{
              background: 'var(--color-bg-glass-heavy)',
              border: 'var(--border-light)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '40px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(16, 185, 129, 0.15)',
                marginBottom: '8px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1 0-3.12 3 3 0 0 1 0-4.88 2.5 2.5 0 0 1 0-3.12A2.5 2.5 0 0 1 9.5 2z" />
                  <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 0-3.12 3 3 0 0 0 0-4.88 2.5 2.5 0 0 0 0-3.12A2.5 2.5 0 0 0 14.5 2z" />
                </svg>
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Smart Matching
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Say goodbye to rejections. Apply only where approval probability is high.
              </p>
            </div>

            {/* Human + AI */}
            <div className="feature-card" style={{
              background: 'var(--color-bg-glass-heavy)',
              border: 'var(--border-light)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '40px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(6, 182, 212, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(6, 182, 212, 0.15)',
                marginBottom: '8px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                Human + AI
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                The efficiency of algorithms backed by expert human relationship managers.
              </p>
            </div>

            {/* 100% Transparent */}
            <div className="feature-card" style={{
              background: 'var(--color-bg-glass-heavy)',
              border: 'var(--border-light)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '40px 24px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(6, 182, 212, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(6, 182, 212, 0.15)',
                marginBottom: '8px'
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                100% Transparent
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Real-time tracking for every file, payout, and status update.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Smart Loan Solutions Section */}
      <section className="section solutions-section" style={{ paddingTop: '32px', borderTop: 'var(--border-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="section-title">
              Smart <span className="text-gradient">Loan Solutions</span>
            </h2>
            <p className="section-subtitle" style={{ maxWidth: '600px', margin: '8px auto 0' }}>
              Instant AI-driven loan infrastructure for every financial need.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
            gap: '24px'
          }}>
            {/* Personal Loans */}
            <div className="feature-card" style={{
              background: 'var(--color-bg-glass-heavy)',
              border: 'var(--border-light)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '40px 32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '20px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(16, 185, 129, 0.15)'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Personal Loans
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  Instant unsecured loans with AI-powered approval matching and lightning-fast processing.
                </p>
              </div>
              <Link href="/check" className="btn btn-primary btn-sm" style={{
                marginTop: 'auto',
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                background: 'var(--gradient-primary)',
                boxShadow: 'var(--shadow-glow-purple)',
                color: '#ffffff',
                border: 'none'
              }}>
                Apply Now
              </Link>
            </div>

            {/* Business Loans */}
            <div className="feature-card" style={{
              background: 'var(--color-bg-glass-heavy)',
              border: 'var(--border-light)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '40px 32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '20px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(16, 185, 129, 0.15)'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Business Loans
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  Smart capital infrastructure for startups, MSMEs, and growing enterprises.
                </p>
              </div>
              <Link href="/check" className="btn btn-primary btn-sm" style={{
                marginTop: 'auto',
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                background: 'var(--gradient-primary)',
                boxShadow: 'var(--shadow-glow-purple)',
                color: '#ffffff',
                border: 'none'
              }}>
                Apply Now
              </Link>
            </div>

            {/* Instant Loans */}
            <div className="feature-card" style={{
              background: 'var(--color-bg-glass-heavy)',
              border: 'var(--border-light)',
              borderRadius: 'var(--border-radius-lg)',
              padding: '40px 32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: '20px'
            }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(16, 185, 129, 0.15)'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
                  Instant Loans
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  Real-time digital verification with ultra-fast AI-powered approvals.
                </p>
              </div>
              <Link href="/check" className="btn btn-primary btn-sm" style={{
                marginTop: 'auto',
                padding: '10px 24px',
                borderRadius: '8px',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                background: 'var(--gradient-primary)',
                boxShadow: 'var(--shadow-glow-purple)',
                color: '#ffffff',
                border: 'none'
              }}>
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section how-section">
        <div className="container">
          <h2 className="section-title">
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="section-subtitle">
            Three simple steps to find your perfect loan match
          </p>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">01</div>
              <div className="step-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
              </div>
              <h3 className="step-title">Enter Your Details</h3>
              <p className="step-desc">
                Fill in your basic info, address, salary, existing EMI, and credit score.
              </p>
            </div>

            <div className="step-connector">
              <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
                <path d="M0 12h36m0 0l-6-6m6 6l-6 6" stroke="url(#arrow-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="arrow-grad" x1="0" y1="12" x2="36" y2="12">
                    <stop stopColor="var(--color-primary)"/>
                    <stop offset="1" stopColor="var(--color-accent)"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <h3 className="step-title">Smart Matching</h3>
              <p className="step-desc">
                Our engine checks pincode coverage, salary, CIBIL, and FOIR against all banks.
              </p>
            </div>

            <div className="step-connector">
              <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
                <path d="M0 12h36m0 0l-6-6m6 6l-6 6" stroke="url(#arrow-grad2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="arrow-grad2" x1="0" y1="12" x2="36" y2="12">
                    <stop stopColor="var(--color-accent)"/>
                    <stop offset="1" stopColor="var(--color-secondary)"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-primary)' }}>
                  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
                  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
                  <path d="M4 22h16" />
                  <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
                  <path d="M12 2a5 5 0 0 0-5 5v3c0 2.2 1.8 4 4 4h2c2.2 0 4-1.8 4-4V7a5 5 0 0 0-5-5z" />
                </svg>
              </div>
              <h3 className="step-title">View Results</h3>
              <p className="step-desc">
                See your eligible banks ranked by match score with detailed breakdowns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* EMI Calculator Section */}
      <section className="section emi-calculator-section" style={{ borderTop: 'var(--border-subtle)', background: 'rgba(0, 10, 26, 0.2)' }}>
        <div className="container" style={{ maxWidth: '1200px' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="section-title">
              Calculate Your <span className="text-gradient">Loan EMIs</span>
            </h2>
            <p className="section-subtitle">
              Check your monthly payments instantly using fixed or reducing interest rate structures.
            </p>
          </div>
          <EmiCalculator />
        </div>
      </section>

      {/* CTA Section */}
      <section className="section cta-section">
        <div className="container">
          <div className="cta-card">
            <h2 className="cta-title">Ready to Find Your Perfect Loan?</h2>
            <p className="cta-subtitle">
              Join thousands of borrowers who found their ideal loan match in under a minute.
            </p>
            <Link 
              href="/check" 
              className="btn btn-primary btn-lg" 
              style={{ 
                marginTop: '16px',
                padding: '16px 36px',
                fontSize: '1.1rem',
                boxShadow: 'var(--shadow-glow-purple), 0 8px 24px rgba(251, 146, 60, 0.35)',
                transform: 'translateY(0)',
                transition: 'all var(--transition-base)'
              }}
            >
              Start Free Check
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="section faq-section" style={{ borderTop: 'var(--border-subtle)' }}>
        <div className="container">
          <h2 className="section-title">
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <p className="section-subtitle">
            Find answers to common questions about eligibility checks, credit scores, and agent partnerships
          </p>

          <div className="faq-container">
            {faqs.map((faq, idx) => (
              <div key={idx} className={`faq-item ${activeFaq === idx ? 'active' : ''}`}>
                <button className="faq-header" onClick={() => handleFaqToggle(idx)}>
                  <span>{faq.q}</span>
                  <span className="faq-icon-wrapper">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </span>
                </button>
                <div className="faq-body">
                  <div className="faq-content">
                    <p>{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section className="section contact-section" style={{ borderTop: 'var(--border-subtle)' }}>
        <div className="container">
          <h2 className="section-title">
            Contact <span className="text-gradient">Our Team</span>
          </h2>
          <p className="section-subtitle">
            Have queries, partnership requests, or need support? We are here to help.
          </p>

          <div className="contact-grid">
            <div className="contact-info">
              <div className="contact-card-info">
                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="contact-info-title">Email Us</h4>
                    <p className="contact-info-text">handtohandloans@gmail.com</p>
                    <p className="contact-info-text" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>We reply within 24 hours</p>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="contact-info-title">Helpline Hours</h4>
                    <p className="contact-info-text">Monday to Saturday</p>
                    <p className="contact-info-text">9:00 AM - 6:00 PM IST</p>
                  </div>
                </div>

                <div className="contact-info-item">
                  <div className="contact-info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="contact-info-title">Secure & Encrypted</h4>
                    <p className="contact-info-text">Your personal and financial information is fully protected under bank-grade security protocols.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="contact-form-container">
              {isSubmitted ? (
                <div className="contact-success-card">
                  <div className="contact-success-icon">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <h3 className="contact-success-title">Message Sent!</h3>
                  <p className="contact-success-text">
                    Thank you for reaching out. We have received your inquiry and our support team will contact you shortly.
                  </p>
                  <button className="btn btn-secondary" onClick={() => setIsSubmitted(false)}>
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="responsive-grid-2">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Name</label>
                      <input 
                        type="text" 
                        name="name" 
                        className="input-field" 
                        placeholder="Your Name" 
                        required 
                        value={formState.name} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <label style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Email</label>
                      <input 
                        type="email" 
                        name="email" 
                        className="input-field" 
                        placeholder="Your Email" 
                        required 
                        value={formState.email} 
                        onChange={handleInputChange} 
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Subject</label>
                    <input 
                      type="text" 
                      name="subject" 
                      className="input-field" 
                      placeholder="Subject (e.g. Agent Query, Eligibility Help)" 
                      value={formState.subject} 
                      onChange={handleInputChange} 
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>Message</label>
                    <textarea 
                      name="message" 
                      className="input-field" 
                      placeholder="Type your message here..." 
                      rows="4" 
                      required 
                      value={formState.message} 
                      onChange={handleInputChange} 
                      style={{ resize: 'vertical' }}
                    ></textarea>
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg" 
                    style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }} 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending Message...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
