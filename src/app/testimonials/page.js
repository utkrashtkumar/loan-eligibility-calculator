'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const MOCK_TESTIMONIALS = [
  {
    name: 'Rajesh Sharma',
    role: 'Senior Loan Consultant',
    company: 'Sharma Financials',
    rating: 5,
    quote: 'HandToHand Loans has completely transformed my daily workflow. Checking eligibility across 100+ banks used to take hours. Now, I slide the numbers and get accurate approval options instantly in front of my clients!',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100'
  },
  {
    name: 'Neha Gupta',
    role: 'Chartered Accountant',
    company: 'N. Gupta & Associates',
    rating: 5,
    quote: 'The multi-level referral commissions are a massive bonus. I referred four other independent tax consultants, and now I earn commission overrides passively whenever they process clients housing or business loans.',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100'
  },
  {
    name: 'Amit Verma',
    role: 'DSA Partner Agent',
    company: 'Verma Wealth Managers',
    rating: 4,
    quote: 'Payout updates are extremely transparent on the dashboard. I no longer have to call multiple bank underwriters to track file disbursements. The Relationship Manager assigns updates weekly on my logged files.',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100'
  },
  {
    name: 'Vikram Malhotra',
    role: 'Independent Broker',
    company: 'Malhotra FinServices',
    rating: 5,
    quote: 'The Hinglish AI chatbot is surprisingly accurate! I had a late-night query on gold loan LTV values and the bot gave me the exact policy figures of Muthoot Finance instantly. Incredible tech suite.',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100'
  },
  {
    name: 'Siddharth Roy',
    role: 'Business Consultant',
    company: 'Roy Capital Advisory',
    rating: 5,
    quote: 'My business loan client files have a much higher conversion rate now. The Loan Eligibility Calculator lets us model FOIR thresholds accurately beforehand, so we only submit files that banks want.',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=100'
  },
  {
    name: 'Priyanka Sen',
    role: 'Financial Planner',
    company: 'Sen Wealth Creators',
    rating: 4,
    quote: 'HandToHand is a game changer for beginners. The pre-recorded video guides inside the Agent Academy helped me understand underwriting terms and commission tracking structures in just one weekend.',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=100'
  }
];

export default function TestimonialsPage() {
  const [feedbacks, setFeedbacks] = useState(MOCK_TESTIMONIALS);
  const [formData, setFormData] = useState({ name: '', role: '', company: '', rating: 5, quote: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.quote) return;
    
    const newFeedback = {
      name: formData.name,
      role: formData.role || 'Independent Advisor',
      company: formData.company || 'Personal Practice',
      rating: Number(formData.rating),
      quote: formData.quote,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100'
    };

    setFeedbacks([newFeedback, ...feedbacks]);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: '', role: '', company: '', rating: 5, quote: '' });
    }, 3000);
  };

  const renderStars = (count) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} style={{ color: i < count ? '#f59e0b' : 'var(--border-default)', fontSize: '14px', marginRight: '2px' }}>
        ★
      </span>
    ));
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-base" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span className="badge" style={{ marginBottom: '12px' }}>Partner Feedback</span>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
              What Our Partners <span className="text-gradient">Say</span>
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
              Read authentic experiences from loan advisors, CAs, and independent partners scaling their earnings with our platform.
            </p>
          </div>

          {/* Testimonials Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '28px',
            marginBottom: '64px'
          }}>
            {feedbacks.map((t, idx) => (
              <div
                key={idx}
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '16px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src={t.avatar}
                    alt={t.name}
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid var(--color-primary)'
                    }}
                  />
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>
                      {t.name}
                    </h3>
                    <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: 0 }}>
                      {t.role} • <span style={{ fontWeight: 600 }}>{t.company}</span>
                    </p>
                  </div>
                </div>

                <div>
                  {renderStars(t.rating)}
                </div>

                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6, italic: 'true', margin: 0 }}>
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>
            ))}
          </div>

          {/* Feedback Form Block */}
          <div style={{
            background: 'var(--color-bg-glass)',
            border: 'var(--border-light)',
            borderRadius: '20px',
            padding: '40px 32px',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '8px', textAlign: 'center' }}>
              Submit Your Platform Feedback
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '28px', textAlign: 'center' }}>
              Are you an active DSA Agent? Share your feedback to help us optimize the loan pipeline tools!
            </p>

            {submitted ? (
              <div style={{
                padding: '24px',
                background: 'rgba(16, 185, 129, 0.05)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '12px',
                textAlign: 'center',
                color: '#10b981',
                fontWeight: 700
              }}>
                ✓ Thank you! Your testimonial has been logged and displayed successfully.
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-default)',
                        background: 'var(--color-bg-card)',
                        color: 'var(--color-text-primary)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Role / Profession</label>
                    <input
                      type="text"
                      placeholder="e.g. Loan Partner"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-default)',
                        background: 'var(--color-bg-card)',
                        color: 'var(--color-text-primary)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Company Agency</label>
                    <input
                      type="text"
                      placeholder="e.g. FinSol Associates"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-default)',
                        background: 'var(--color-bg-card)',
                        color: 'var(--color-text-primary)',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Rating Rating *</label>
                    <select
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-default)',
                        background: 'var(--color-bg-card)',
                        color: 'var(--color-text-primary)',
                        fontSize: '13px',
                        fontWeight: 700,
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value={5}>5 Stars ★★★★★</option>
                      <option value={4}>4 Stars ★★★★</option>
                      <option value={3}>3 Stars ★★★</option>
                      <option value={2}>2 Stars ★★</option>
                      <option value={1}>1 Star ★</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>Feedback Message *</label>
                  <textarea
                    required
                    rows={4}
                    value={formData.quote}
                    onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                    placeholder="Describe your experience with commissions, calculations, eligibility, dashboard..."
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-default)',
                      background: 'var(--color-bg-card)',
                      color: 'var(--color-text-primary)',
                      fontSize: '13px',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    justifyContent: 'center',
                    padding: '12px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: '8px'
                  }}
                >
                  Submit Testimonial
                </button>
              </form>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
