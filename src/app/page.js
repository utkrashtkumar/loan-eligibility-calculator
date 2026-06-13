'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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

      {/* Features Section */}
      <section className="section features-section">
        <div className="container">
          <h2 className="section-title">
            Why Choose <span className="text-gradient">Hand to Hand Fintech?</span>
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
