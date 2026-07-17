'use client';

import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const FAQ_DATA = [
  {
    category: 'General Queries',
    items: [
      { q: 'What is HandToHand Loans?', a: 'HandToHand Loans is a premium fintech aggregator platform that matches customers with optimal loan offers from over 100+ partner banks and NBFCs based on automated credit profiling.' },
      { q: 'Is my credit score affected when checking eligibility?', a: 'No, checking loan eligibility on HandToHand Loans uses a soft credit check query which has absolutely zero impact on your official CIBIL score.' },
      { q: 'Are there any fees for using the calculators?', a: 'All financial calculators and planning utilities on our platform are 100% free to use for both referral partners and general customers.' }
    ]
  },
  {
    category: 'DSA Partners & Referral',
    items: [
      { q: 'Who can register as a DSA Referral Partner?', a: 'Any financial consultant, loan agent, chartered accountant, or independent professional can register as a DSA partner to log client files and earn commission.' },
      { q: 'How does the DSA Commission model work?', a: 'DSA partners earn up to 2.5% commission on successfully disbursed loan files. Payouts are directly calculated based on disbursement reports and sent to your bank account weekly.' },
      { q: 'What support do DSA agents get?', a: 'Agents receive access to a dedicated Relationship Manager (RM), 24/7 AI chatbot assistance in Hinglish, weekly policy training webinars, and marketing kits.' }
    ]
  },
  {
    category: 'Loan Processing & Payouts',
    items: [
      { q: 'How long does loan disbursement take?', a: 'Instant loans can be disbursed in as little as 2 hours, whereas personal and business loans typically take 2 to 5 working days depending on document verification.' },
      { q: 'Can I track my application status online?', a: 'Yes, agents and clients can track real-time file progression (Login, Underwriting, Sanctioned, Disbursed) directly from their secure platform dashboards.' },
      { q: 'Are joint applications allowed for housing loans?', a: 'Yes, co-applying with spouses or parents is highly recommended to increase eligibility margins and qualify for larger loan amounts.' }
    ]
  },
  {
    category: 'Privacy & Security',
    items: [
      { q: 'How secure is my personal and client data?', a: 'Your data security is our top priority. We use military-grade 256-bit SSL encryption, secure tokens, and strict Row Level Security (RLS) database policies to safeguard details.' },
      { q: 'Does HandToHand share my data with third parties?', a: 'We only share client application data with the specific banks/NBFCs chosen by the client during file login. We never sell data to advertisers.' }
    ]
  }
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [expandedIndex, setExpandedIndex] = useState(null);

  const toggleExpand = (idx) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  // Flattened and filtered list
  const allItems = [];
  FAQ_DATA.forEach(cat => {
    cat.items.forEach(item => {
      allItems.push({ ...item, category: cat.category });
    });
  });

  const filteredItems = allItems.filter(item => {
    const matchesSearch = item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.a.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'All' || item.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const categoriesList = ['All', ...FAQ_DATA.map(c => c.category)];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-base" style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 20px' }}>
          
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <span className="badge" style={{ marginBottom: '12px' }}>Knowledge Base</span>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '16px', fontFamily: 'var(--font-heading)' }}>
              Frequently Asked <span className="text-gradient">Questions</span>
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
              Got questions? We have answers. Explore detailed information about our loan matching processes, DSA commissions, payouts, and security.
            </p>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto 32px auto' }}>
            <input
              type="text"
              placeholder="Search questions (e.g. commission, CIBIL, time...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '10px',
                border: '1px solid var(--border-default)',
                background: 'var(--color-bg-card)',
                color: 'var(--color-text-primary)',
                padding: '0 16px 0 40px',
                fontSize: '14px',
                fontWeight: 600,
                outline: 'none',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--border-default)'}
            />
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', opacity: 0.6 }}>🔍</span>
          </div>

          {/* Category Tabs */}
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '32px'
          }}>
            {categoriesList.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveTab(cat); setExpandedIndex(null); }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '30px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: activeTab === cat ? 'var(--color-text-primary)' : 'var(--color-bg-card)',
                  color: activeTab === cat ? 'var(--color-bg-secondary)' : 'var(--color-text-secondary)',
                  border: activeTab === cat ? '1px solid var(--color-text-primary)' : '1px solid var(--border-default)'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Accordion Container */}
          <div style={{ display: 'grid', gap: '16px' }}>
            {filteredItems.length > 0 ? (
              filteredItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--border-default)',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <button
                    onClick={() => toggleExpand(idx)}
                    style={{
                      width: '100%',
                      padding: '20px 24px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'none',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '15px',
                      fontWeight: 700,
                      color: 'var(--color-text-primary)',
                      gap: '16px'
                    }}
                  >
                    <span>{item.q}</span>
                    <span style={{
                      transform: expandedIndex === idx ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.2s',
                      fontSize: '14px',
                      color: 'var(--color-primary)'
                    }}>
                      ▼
                    </span>
                  </button>

                  <div style={{
                    maxHeight: expandedIndex === idx ? '300px' : '0',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      padding: '0 24px 20px 24px',
                      fontSize: '13.5px',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.6,
                      borderTop: '1px solid var(--border-default)'
                    }}>
                      {item.a}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', background: 'var(--color-bg-card)', borderRadius: '12px', border: '1px dashed var(--border-default)' }}>
                <p style={{ color: 'var(--color-text-secondary)' }}>No matches found. Try another search query.</p>
              </div>
            )}
          </div>

          {/* Need help footer section */}
          <div style={{
            marginTop: '48px',
            padding: '32px',
            borderRadius: '16px',
            border: '1px dashed var(--color-primary)',
            background: 'var(--color-bg-glass)',
            textAlign: 'center'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
              Still have questions?
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
              Our support team is available 24/7 to resolve policies, application discrepancies, or payout logs questions.
            </p>
            <Link href="/contact" className="btn btn-primary" style={{ padding: '12px 28px', borderRadius: '8px', textDecoration: 'none', fontWeight: 700 }}>
              ✉ Contact Support
            </Link>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
