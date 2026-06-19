'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsConditions() {
  return (
    <>
      <Header />
      <main style={{ padding: 'clamp(80px, 12vw, 140px) 0 48px', position: 'relative', overflow: 'hidden' }}>
        {/* Background blobs */}
        <div className="hero-bg" style={{ pointerEvents: 'none' }}>
          <div className="hero-orb hero-orb-1" style={{ top: '10%', left: '20%' }}></div>
          <div className="hero-orb hero-orb-2" style={{ top: '60%', right: '10%' }}></div>
          <div className="hero-grid"></div>
        </div>

        <div className="container" style={{ maxWidth: '800px', position: 'relative', zIndex: 1 }}>
          <div className="form-card" style={{ padding: '40px', background: 'var(--color-bg-glass-heavy)', border: 'var(--border-light)' }}>
            <h1 className="section-title" style={{ textAlign: 'left', marginBottom: '8px' }}>
              Terms &amp; <span className="text-gradient">Conditions</span>
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', marginBottom: '32px' }}>
              Last updated: June 20, 2026
            </p>

            <p style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', marginBottom: '24px', lineHeight: 1.7 }}>
              Welcome to Hand to Hand Fintech! These terms and conditions outline the rules and regulations for the use of Hand to Hand Fintech&apos;s Platform. By accessing this website we assume you accept these terms and conditions. Do not continue to use our platform if you do not agree to take all of the terms and conditions stated on this page.
            </p>

            <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '32px', marginBottom: '12px' }}>
              1. Platform Usage &amp; Eligibility checks
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px', lineHeight: 1.7 }}>
              Our platform allows guests and registered users to check eligibility criteria against partner bank guidelines. While our matching algorithms are 90%+ accurate, all final loan approvals and rates are determined solely by the issuing financial institutions after physical document verification.
            </p>

            <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '32px', marginBottom: '12px' }}>
              2. Referral Agent Program (DSA)
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px', lineHeight: 1.7 }}>
              Agents register as independent distributors. Agents must submit accurate client data and represent details truthfully. Inaccurate file submissions or misrepresentation of terms may result in account lock, demotion, and forfeiture of outstanding payout balances as per policy criteria.
            </p>

            <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '32px', marginBottom: '12px' }}>
              3. Payout and Earnings
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px', lineHeight: 1.7 }}>
              Commissions and payout requests are processed after confirmation of loan disbursement from partner banks. Payout processing takes 5-7 business days, and funds are transferred via verified UPI or bank details provided by the agent.
            </p>

            <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '32px', marginBottom: '12px' }}>
              4. User Content &amp; RLS
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px', lineHeight: 1.7 }}>
              We retain the right to audit profile inputs, uploaded identity documents, and submitted clients&apos; details. Unauthorized copying of our matching algorithm logic or site layouts is strictly prohibited.
            </p>

            <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '32px', marginBottom: '12px' }}>
              5. Limitation of Liability
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px', lineHeight: 1.7 }}>
              In no event shall Hand to Hand Fintech, nor any of its officers, directors, and employees, be held liable for anything arising out of or in any way connected with your use of this website. Hand to Hand Fintech shall not be held liable for any indirect, consequential, or special liability arising out of or in any way related to your use of this website.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
