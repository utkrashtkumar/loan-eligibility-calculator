'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';

const FEATURES_DATA = [
  {
    title: 'Instant Loan Matching',
    desc: 'Our proprietary algorithm analyzes client profile parameters (income, CIBIL, DA, existing debts, and pincode) to instantly compare eligibility across 100+ partner banks & NBFCs in seconds.',
    icon: '⚡',
    color: '#3b82f6',
    benefit: 'Save days of manual policy checks and optimize client approval chances.'
  },
  {
    title: 'Multi-Level Agent Referrals',
    desc: 'Build your own agency network! Refer other loan agents to the platform and earn passive commission overrides up to 3 tiers down when they successfully close files.',
    icon: '👥',
    color: '#10b981',
    benefit: 'Scale your income passively as your referral network grows.'
  },
  {
    title: 'Real-Time Lead Tracking',
    desc: 'Enjoy complete transparency with state-of-the-art lead flow stages. Track files as they move from Login, to Underwriting, to Sanctioned, and finally Disbursed.',
    icon: '📊',
    color: '#f59e0b',
    benefit: 'Stay updated at every single milestone and reduce client anxiety.'
  },
  {
    title: 'Instant Payout Dashboard',
    desc: 'No more follow-ups on payouts! The agent dashboard logs precise commission rates, calculates commission amounts immediately on disbursement, and automates weekly deposits.',
    icon: '💳',
    color: '#8b5cf6',
    benefit: 'Predictable, weekly payouts deposited directly to your bank account.'
  },
  {
    title: '24/7 Hinglish Policy AI Chatbot',
    desc: 'Have a query on interest slabs, age caps, or processing fees at midnight? Ask our AI assistant in normal Hinglish or English to get instant answers. Zero waiting times.',
    icon: '🤖',
    color: '#ec4899',
    benefit: 'Immediate guidance on complex bank policy criteria anytime, anywhere.'
  },
  {
    title: 'Relationship Manager Ecosystem',
    desc: 'Every major agent is assigned a dedicated Relationship Manager (RM). RMs coordinate with bank underwriters to push stuck files and resolve document discrepancies.',
    icon: '🤝',
    color: '#06b6d4',
    benefit: 'A human escalation point ready to resolve critical files with one call.'
  }
];

export default function FeaturesPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-base" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 20px' }}>
          
          {/* Hero Section */}
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <span className="badge" style={{ marginBottom: '12px' }}>Platform Highlights</span>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
              HandToHand Platform <span className="text-gradient">Features</span>
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
              A high-performance lending ecosystem built from the ground up to empower independent agents, financial advisors, and referral partners.
            </p>
          </div>

          {/* Features Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '32px',
            marginBottom: '64px'
          }}>
            {FEATURES_DATA.map((feat, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--border-default)',
                  borderRadius: '16px',
                  padding: '32px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  boxShadow: 'var(--shadow-sm)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Visual Accent Corner Glow */}
                <div style={{
                  position: 'absolute',
                  top: '-20px',
                  right: '-20px',
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: feat.color,
                  opacity: 0.1,
                  filter: 'blur(20px)'
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '36px' }}>{feat.icon}</span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>
                    {feat.title}
                  </h3>
                </div>

                <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                  {feat.desc}
                </p>

                <div style={{
                  marginTop: 'auto',
                  padding: '12px 16px',
                  background: 'var(--color-bg-glass, rgba(0,0,0,0.02))',
                  borderLeft: `3px solid ${feat.color}`,
                  borderRadius: '0 8px 8px 0',
                  fontSize: '12px',
                  color: 'var(--color-text-secondary)',
                  fontWeight: 600
                }}>
                  💡 <strong>Agent Value:</strong> {feat.benefit}
                </div>
              </div>
            ))}
          </div>

          {/* Platform Access Table Comparison */}
          <div style={{
            background: 'var(--color-bg-glass)',
            border: 'var(--border-light)',
            borderRadius: '20px',
            padding: '40px 32px',
            marginBottom: '56px',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              One Platform. Two Experience Modes.
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '32px' }}>
              HandToHand automatically configures features depending on your logged-in profile.
            </p>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-default)', color: 'var(--color-text-primary)' }}>
                    <th style={{ padding: '12px', fontWeight: 800 }}>Feature Parameter</th>
                    <th style={{ padding: '12px', fontWeight: 800 }}>DSA Agent Account</th>
                    <th style={{ padding: '12px', fontWeight: 800 }}>Direct Customer Account</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <td style={{ padding: '12px', fontWeight: 700 }}>Eligibility Matcher</td>
                    <td style={{ padding: '12px', color: 'var(--color-success)' }}>✓ Check for unlimited clients</td>
                    <td style={{ padding: '12px', color: 'var(--color-success)' }}>✓ Check for self only</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <td style={{ padding: '12px', fontWeight: 700 }}>Commission Slabs</td>
                    <td style={{ padding: '12px', color: 'var(--color-success)' }}>✓ Up to 2.50% weekly payouts</td>
                    <td style={{ padding: '12px', color: 'var(--color-text-secondary)' }}>N/A (Referral benefits only)</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <td style={{ padding: '12px', fontWeight: 700 }}>Referral Tree Tools</td>
                    <td style={{ padding: '12px', color: 'var(--color-success)' }}>✓ Build 3-tier sub-agent tree</td>
                    <td style={{ padding: '12px', color: 'var(--color-text-secondary)' }}>N/A</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <td style={{ padding: '12px', fontWeight: 700 }}>Support Model</td>
                    <td style={{ padding: '12px', color: 'var(--color-success)' }}>✓ Dedicated RM + AI Bot</td>
                    <td style={{ padding: '12px', color: 'var(--color-success)' }}>✓ AI Chatbot + Helpdesk</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA Footer block */}
          <div style={{
            textAlign: 'center',
            padding: '48px',
            borderRadius: '20px',
            background: 'var(--color-bg-card)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '12px', fontFamily: 'var(--font-heading)' }}>
              Ready to Accelerate Your Loan Agency?
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', maxWidth: '600px', margin: '0 auto 28px auto', lineHeight: 1.6 }}>
              Join thousands of referral partners logging leads and securing payout margins with HandToHand Loans.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/signup" className="btn btn-primary" style={{ padding: '14px 32px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700 }}>
                🚀 Join as Partner Agent
              </Link>
              <Link href="/check" className="btn btn-secondary" style={{ padding: '14px 32px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700 }}>
                Check Personal Eligibility
              </Link>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
