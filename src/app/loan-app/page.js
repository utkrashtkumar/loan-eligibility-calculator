'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function LoanAppPage() {
  return (
    <>
      <Header />
      <main className="main-content" style={{ minHeight: '85vh', padding: '120px 24px 80px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          {/* Hero Section */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '40px',
            alignItems: 'center',
            marginBottom: '64px'
          }}>
            {/* Column 1: Info and Download Badges */}
            <div style={{ textAlign: 'left' }}>
              <span className="light-tag" style={{ color: 'var(--color-primary)', background: 'var(--color-primary-light)', padding: '6px 16px', borderRadius: '20px', fontSize: 'var(--text-xs)', fontWeight: 700, letterSpacing: '1px' }}>
                H2H MOBILE APP
              </span>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 800, marginTop: '16px', color: 'var(--color-text-primary)', letterSpacing: '-1px', lineHeight: 1.15 }}>
                Your Loan Business, <br />
                <span style={{ color: 'var(--color-primary)' }}>Right in Your Pocket</span>
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', margin: '16px 0 32px 0', lineHeight: 1.6 }}>
                Download the HandToHand Loans Mobile App to check client eligibility on the go, submit applications instantly, track commission payouts in real time, and manage your DSA network seamlessly.
              </p>

              {/* Download Badges */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                {/* Google Play Store */}
                <a href="#download" onClick={() => alert('Android APK release coming soon on Google Play Store!')} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#090d16',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  color: '#ffffff',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 3.22a.75.75 0 00-.22.53v16.5c0 .2.08.39.22.53l9.07-9.07-9.07-9.49zM15.11 10.66L6.19 5.68l9.97 6.13-1.05-1.15zM16.16 11.81c.21-.13.21-.34 0-.47l-1.42-.87-1.11 1.11 1.11 1.11 1.42-.88zM6.19 18.32l8.92-4.98 1.05-1.05-9.97 6.03z"/>
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <span style={{ fontSize: '8px', textTransform: 'uppercase', opacity: 0.6 }}>Get it on</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Google Play</span>
                  </div>
                </a>

                {/* Apple App Store */}
                <a href="#download" onClick={() => alert('iOS App release coming soon on Apple App Store!')} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: '#090d16',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '10px 20px',
                  color: '#ffffff',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.51-.62.73-1.16 1.87-1.01 2.98.88.08 2.22-.52 2.94-1.43z"/>
                  </svg>
                  <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                    <span style={{ fontSize: '8px', textTransform: 'uppercase', opacity: 0.6 }}>Download on the</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold' }}>App Store</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Column 2: Visual Device Mockup */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: '280px',
                height: '560px',
                borderRadius: '40px',
                background: '#090d16',
                border: '12px solid #1e293b',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
                position: 'relative',
                overflow: 'hidden',
                padding: '24px 16px'
              }}>
                {/* Mobile Camera notch */}
                <div style={{
                  width: '110px',
                  height: '24px',
                  background: '#1e293b',
                  borderRadius: '0 0 15px 15px',
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 20
                }} />

                {/* Mock UI Interface */}
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontSize: '10px' }}>
                  {/* Status Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', marginBottom: '16px', fontWeight: 600 }}>
                    <span>09:41</span>
                    <span>📶 🛜 🔋</span>
                  </div>

                  {/* App Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div>
                      <div style={{ color: '#94a3b8' }}>Welcome back,</div>
                      <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '12px' }}>Rajesh Kumar</div>
                    </div>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--gradient-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyStyle: 'center', fontWeight: 'bold', fontSize: '9px' }}>RK</div>
                  </div>

                  {/* Commission Tracker Widget */}
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(0, 215, 86, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)',
                    border: '1px solid rgba(0,215,86,0.3)',
                    borderRadius: '16px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}>
                    <span style={{ color: '#94a3b8', fontSize: '8px', textTransform: 'uppercase' }}>Unpaid Commissions</span>
                    <div style={{ color: 'var(--color-primary)', fontSize: '20px', fontWeight: 800, margin: '4px 0' }}>₹48,750</div>
                    <div style={{ color: '#94a3b8', fontSize: '8px' }}>▲ +12% from last month</div>
                  </div>

                  {/* Applications list */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffffff', fontWeight: 700, marginBottom: '10px' }}>
                    <span>Active Cases</span>
                    <span style={{ color: 'var(--color-primary)' }}>See All</span>
                  </div>

                  {/* Case item */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { name: 'Amit Sharma', amt: '₹5 Lakhs', status: 'Approved', col: '#10b981' },
                      { name: 'Sunita Patel', amt: '₹12 Lakhs', status: 'Verifying', col: '#fbbf24' }
                    ].map((caseItem, idx) => (
                      <div key={idx} style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ color: '#ffffff', fontWeight: 'bold' }}>{caseItem.name}</div>
                          <div style={{ color: '#94a3b8', fontSize: '8px' }}>Personal Loan • {caseItem.amt}</div>
                        </div>
                        <span style={{ color: caseItem.col, fontWeight: 'bold', fontSize: '8px', background: 'rgba(255,255,255,0.02)', padding: '2px 8px', borderRadius: '20px' }}>{caseItem.status}</span>
                      </div>
                    ))}
                  </div>

                  {/* Footer Mobile Menu */}
                  <div style={{
                    marginTop: 'auto',
                    display: 'flex',
                    justifyContent: 'space-around',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                    paddingTop: '12px',
                    color: '#94a3b8'
                  }}>
                    <span style={{ color: 'var(--color-primary)' }}>🏠 Home</span>
                    <span>📂 Leads</span>
                    <span>👛 Payouts</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div style={{
            background: 'var(--color-bg-glass-heavy)',
            border: 'var(--border-light)',
            borderRadius: '16px',
            padding: '48px',
            boxShadow: 'var(--shadow-md)'
          }}>
            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '40px', textAlign: 'center', fontFamily: 'Outfit, sans-serif' }}>
              ⚡ Exclusive Mobile App Features
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '24px'
            }}>
              {[
                { title: '📸 Instant Document Upload', desc: 'Capture KYC, salary slips, or bank statements directly using your phone camera and submit them securely.' },
                { title: '🔔 Push Notifications', desc: 'Get real-time updates when banking partners approve a lead, request extra files, or process payout commissions.' },
                { title: '📴 Offline Calculators', desc: 'Compute EMI estimates and interest components offline while consulting clients in weak network zones.' },
                { title: '🔒 Biometric Protection', desc: 'Protect sensitive client data and bank credentials using fingerprint or face-recognition unlocks.' }
              ].map((item, idx) => (
                <div key={idx} style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: 'var(--border-light)',
                  borderRadius: '12px',
                  padding: '24px',
                  transition: 'transform 0.2s'
                }}>
                  <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '8px' }}>{item.title}</h4>
                  <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
