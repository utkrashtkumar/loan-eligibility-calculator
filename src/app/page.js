'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Home() {
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
          <div className="hero-stats">
            <div className="hero-stat-card">
              <span className="hero-stat-icon">🏦</span>
              <span className="hero-stat-value">10+</span>
              <span className="hero-stat-label">Banks & NBFCs</span>
            </div>
            <div className="hero-stat-card">
              <span className="hero-stat-icon">⚡</span>
              <span className="hero-stat-value">60s</span>
              <span className="hero-stat-label">Instant Results</span>
            </div>
            <div className="hero-stat-card">
              <span className="hero-stat-icon">🎯</span>
              <span className="hero-stat-value">100%</span>
              <span className="hero-stat-label">Free Forever</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section features-section">
        <div className="container">
          <h2 className="section-title">
            Why Choose <span className="text-gradient">LoanMatch Pro?</span>
          </h2>
          <p className="section-subtitle">
            Our intelligent engine matches your profile with the best available loan options
          </p>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-title">Smart Matching</h3>
              <p className="feature-desc">
                Our algorithm analyzes salary, CIBIL score, FOIR ratio, and pincode to find your best matches with precision scoring.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-title">6,000+ Pincodes</h3>
              <p className="feature-desc">
                Comprehensive pincode coverage across India. We check if banks and NBFCs actually operate in your area.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="feature-title">CIBIL Analysis</h3>
              <p className="feature-desc">
                We match your credit score against each bank&apos;s minimum requirement and calculate your eligibility strength.
              </p>
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
              <div className="step-icon">📝</div>
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
                    <stop stopColor="#6366f1"/>
                    <stop offset="1" stopColor="#a855f7"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-icon">🔍</div>
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
                    <stop stopColor="#8b5cf6"/>
                    <stop offset="1" stopColor="#ec4899"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-icon">🎉</div>
              <h3 className="step-title">View Results</h3>
              <p className="step-desc">
                See your eligible banks ranked by match score with detailed breakdowns.
              </p>
            </div>
          </div>
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
            <Link href="/check" className="btn-primary">
              Start Free Check
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
