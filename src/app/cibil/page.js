'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CibilReportPage() {
  return (
    <>
      <Header />
      <main className="main-content">
        <section className="form-page" style={{ minHeight: 'calc(100vh - 160px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0' }}>
          <div className="form-container" style={{ maxWidth: '480px', width: '100%' }}>
            
            <div className="form-card" style={{ 
              background: 'var(--color-bg-glass)', 
              border: 'var(--border-light)', 
              borderRadius: 'var(--border-radius-xl)', 
              padding: '50px 40px', 
              textAlign: 'center', 
              boxShadow: 'var(--shadow-lg)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              
              {/* Logo Circle */}
              <div className="logo-circle" style={{
                width: '80px',
                height: '80px',
                background: 'var(--gradient-primary)',
                borderRadius: '50%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                margin: '0 auto 25px',
                boxShadow: 'var(--shadow-md)'
              }}>
                <svg viewBox="0 0 24 24" style={{ width: '40px', height: '40px', fill: '#ffffff' }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
                </svg>
              </div>

              {/* Title */}
              <h1 style={{ 
                color: 'var(--color-text-primary)', 
                fontFamily: 'var(--font-heading)',
                fontSize: '24px', 
                fontWeight: 800,
                marginBottom: '12px',
                letterSpacing: '-0.02em'
              }}>
                Free Credit Report
              </h1>

              {/* Description */}
              <p style={{ 
                color: 'var(--color-text-secondary)', 
                lineHeight: '1.6', 
                marginBottom: '35px', 
                fontSize: '15px' 
              }}>
                Check your credit score instantly at no cost, powered by Experian in partnership with Punjab National Bank.
              </p>

              {/* BUTTON */}
              <a 
                href="https://pnb.bank.in/Free-Credit-Report.html" 
                target="_blank" 
                rel="noopener noreferrer"
                className="button-82-pushable"
                style={{
                  position: 'relative',
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  cursor: 'pointer',
                  outlineOffset: '4px',
                  textDecoration: 'none',
                  display: 'inline-block'
                }}
              >
                <span className="button-82-shadow" style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  borderRadius: '12px',
                  background: 'rgba(0, 0, 0, 0.25)',
                  transform: 'translateY(2px)',
                  transition: 'transform 0.2s'
                }}></span>
                <span className="button-82-edge" style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  borderRadius: '12px',
                  background: 'var(--gradient-primary)'
                }}></span>
                <span className="button-82-front" style={{
                  display: 'block',
                  position: 'relative',
                  padding: '15px 34px',
                  borderRadius: '12px',
                  background: 'var(--gradient-front, var(--gradient-primary))',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 700,
                  transform: 'translateY(-4px)',
                  transition: 'transform 0.2s'
                }}>
                  Click Here For Free Credit Report
                </span>
              </a>

              {/* Divider */}
              <hr className="divider" style={{
                margin: '30px 0',
                border: 'none',
                borderTop: 'var(--border-subtle)'
              }} />

              {/* Info text */}
              <div className="info-text" style={{
                color: 'var(--color-text-tertiary)',
                fontSize: '13px',
                lineHeight: '1.7'
              }}>
                Your credit report is fetched securely via Experian.<br />
                No charges apply. Data is protected under applicable privacy laws.
              </div>

              {/* Experian Badge */}
              <div className="experian-badge" style={{
                marginTop: '25px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--color-text-tertiary)',
                fontSize: '13px'
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--color-primary)">
                  <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
                <span>
                  Powered by <strong style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>Experian</strong> · In partnership with <strong style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>Punjab National Bank</strong>
                </span>
              </div>

            </div>
            
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
