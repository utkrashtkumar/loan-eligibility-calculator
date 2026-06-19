'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPolicy() {
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
              Privacy <span className="text-gradient">Policy</span>
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)', marginBottom: '32px' }}>
              Last updated: June 20, 2026
            </p>
            
            <p style={{ color: 'var(--color-text-primary)', fontSize: 'var(--text-sm)', marginBottom: '24px', lineHeight: 1.7 }}>
              At Hand to Hand Fintech, accessible from our platform, one of our main priorities is the privacy of our visitors and partners. This Privacy Policy document contains types of information that is collected and recorded by Hand to Hand Fintech and how we use it.
            </p>
            
            <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '32px', marginBottom: '12px' }}>
              1. Information We Collect
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px', lineHeight: 1.7 }}>
              If you register as a Referral Agent (DSA Partner) or a normal Customer, we collect basic registration data (name, email, phone number) and profile details (such as identity document types, numbers, addresses, and permanent credentials) to provide loan eligibility matching and payout tracking features. We also collect client data submitted via our loan checker wizard.
            </p>

            <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '32px', marginBottom: '12px' }}>
              2. How We Use Your Information
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px', lineHeight: 1.7 }}>
              We use the collected information to:
            </p>
            <ul style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', paddingLeft: '20px', marginBottom: '24px', listStyleType: 'disc', lineHeight: 1.8 }}>
              <li>Analyze loan eligibility against bank credit criteria (salary, CIBIL, FOIR, age, pincode).</li>
              <li>Process payouts and commission requests for Referral Agents.</li>
              <li>Provide, operate, and maintain our platform dashboards.</li>
              <li>Improve, personalize, and expand our eligibility matching algorithms.</li>
              <li>Communicate with you regarding updates, security, and administrative notifications.</li>
            </ul>

            <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '32px', marginBottom: '12px' }}>
              3. Data Security & Storage
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px', lineHeight: 1.7 }}>
              We use bank-grade encryption protocols and secure database policies to protect your data. All uploaded files (such as avatar pictures and identity documents) are encrypted and access-controlled through Supabase security policies, ensuring your personal identifiers are completely protected.
            </p>

            <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '32px', marginBottom: '12px' }}>
              4. Cookies Preference
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px', lineHeight: 1.7 }}>
              Like any other website, Hand to Hand Fintech uses cookies. These cookies are used to store information including visitors&apos; preferences, and the pages on the website that the visitor accessed or visited. The information is used to optimize the users&apos; experience by customizing our web page content based on visitors&apos; browser type and/or other information.
            </p>

            <h2 style={{ fontSize: 'var(--text-md)', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '32px', marginBottom: '12px' }}>
              5. Contact Us
            </h2>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', marginBottom: '16px', lineHeight: 1.7 }}>
              If you have any questions or suggestions about our Privacy Policy, do not hesitate to contact us at:
            </p>
            <p style={{ color: 'var(--color-primary)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
              ✉ handtohandloans@gmail.com
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
