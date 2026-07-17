'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

export default function CommoditiesIndexPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-base" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span className="badge" style={{ marginBottom: '12px' }}>Real-time Assets</span>
            <h1 style={{ fontSize: 'clamp(28px, 4.5vw, 42px)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
              Commodities <span className="text-gradient">Market Rates</span>
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '500px', margin: '0 auto', lineHeight: 1.6 }}>
              Access live tracking feeds, location-specific pricing tables, and historical performance metrics.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
            {/* Gold Rate Desk Card */}
            <Link href="/commodities/gold" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(217, 119, 6, 0.08) 100%)',
                border: '1px solid rgba(251, 191, 36, 0.25)',
                borderRadius: '20px',
                padding: '40px 32px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: 'var(--shadow-sm)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.borderColor = '#fbbf24';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.25)';
              }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>👑</span>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
                  Gold Rates Today
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
                  Track 24K, 22K, & 18K purity rates daily with city offsets and valuation estimators.
                </p>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#fbbf24' }}>
                  Enter Gold Desk ➔
                </span>
              </div>
            </Link>

            {/* Silver Rate Desk Card */}
            <Link href="/commodities/silver" style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(156, 163, 175, 0.08) 0%, rgba(107, 114, 128, 0.08) 100%)',
                border: '1px solid rgba(156, 163, 175, 0.25)',
                borderRadius: '20px',
                padding: '40px 32px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: 'var(--shadow-sm)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.borderColor = '#9ca3af';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'rgba(156, 163, 175, 0.25)';
              }}>
                <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🥈</span>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '8px', fontFamily: 'var(--font-heading)' }}>
                  Silver Rates Today
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.5, marginBottom: '24px' }}>
                  Track Fine (999) & Sterling (925) silver rates with monthly performance history logs.
                </p>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#9ca3af' }}>
                  Enter Silver Desk ➔
                </span>
              </div>
            </Link>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
