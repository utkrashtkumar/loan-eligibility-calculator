'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PRESS_RELEASES = [
  {
    date: 'July 10, 2026',
    tag: 'Expansion',
    title: 'HandToHand Loans Expands DSA Agent Partner Program to 200+ Cities',
    excerpt: 'H2H Fintech has announced the expansion of its digital Direct Selling Agent (DSA) network. The expansion will allow qualified finance brokers in Tier-2 and Tier-3 Indian cities to submit loan leads and earn payouts with immediate banking approvals.',
    link: '#article1'
  },
  {
    date: 'May 18, 2026',
    tag: 'Partnership',
    title: 'H2H Loans Announces Digital Lending Integration with Leading Public Sector Banks',
    excerpt: 'In a major step towards automated financial inclusion, HandToHand Loans has deployed direct API integrations for personal and education loans with premier banks, dropping average approval times from 5 days to under 12 hours.',
    link: '#article2'
  },
  {
    date: 'February 24, 2026',
    tag: 'Funding',
    title: 'H2H Fintech Raises Pre-Series A Funding of $3M for Disbursal Pipeline Automation',
    excerpt: 'H2H Fintech has secured $3 Million in pre-series A funding led by key tech venture capitals. The funds will be deployed to accelerate machine learning models for risk analysis and document validation.',
    link: '#article3'
  }
];

export default function PressPage() {
  return (
    <>
      <Header />
      <main className="main-content" style={{ minHeight: '85vh', padding: '120px 24px 80px' }}>
        <div style={{ maxWidth: '950px', margin: '0 auto' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span className="light-tag" style={{ color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '6px 16px', borderRadius: '20px', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '1px' }}>
              H2H NEWSROOM
            </span>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 800, marginTop: '16px', color: 'var(--color-text-primary)', letterSpacing: '-1px' }}>
              Press Releases & Corporate News
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '600px', margin: '12px auto 0', lineHeight: 1.6 }}>
              Follow corporate updates, product launches, partnership milestones, and tech announcements from HandToHand Loans.
            </p>
          </div>

          {/* Press list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginBottom: '56px' }}>
            {PRESS_RELEASES.map((article, idx) => (
              <article key={idx} style={{
                background: 'var(--color-bg-glass-heavy)',
                border: 'var(--border-light)',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: 'var(--shadow-sm)',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>{article.date}</span>
                  <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
                  <span style={{ color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '2px 8px', borderRadius: '20px' }}>{article.tag}</span>
                </div>
                <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '12px', lineHeight: 1.4, fontFamily: 'Outfit, sans-serif' }}>
                  {article.title}
                </h3>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.6, margin: '0 0 20px 0' }}>
                  {article.excerpt}
                </p>
                <a href={article.link} onClick={(e) => { e.preventDefault(); alert('Full press coverage release details are restricted to verified media channels.'); }} style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 700,
                  color: 'var(--color-primary)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  Read Full Release 
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </a>
              </article>
            ))}
          </div>

          {/* Media Kit Section */}
          <div style={{
            background: 'var(--color-bg-glass-heavy)',
            border: 'var(--border-light)',
            borderRadius: '16px',
            padding: '36px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '32px',
            alignItems: 'center',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ textAlign: 'left' }}>
              <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px', fontFamily: 'Outfit, sans-serif' }}>
                📂 Brand Assets & Media Kit
              </h3>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Download high-resolution corporate logos, guidelines, executive profile files, and official bio documentation for editorial coverage.
              </p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Media contact */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: 'var(--border-light)',
                borderRadius: '10px',
                padding: '16px',
                fontSize: '11px',
                color: 'var(--color-text-muted)',
                lineHeight: 1.5,
                textAlign: 'left'
              }}>
                <strong>PR & Media Contact:</strong> <br />
                👤 Mr. Anand Sen (Head of Corporate Communications) <br />
                ✉️ press@handtohandloans.com
              </div>

              <button onClick={() => alert('Media Kit zip archive download starting shortly!')} className="btn btn-primary" style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: 700 }}>
                Download Media Kit (.ZIP)
              </button>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
