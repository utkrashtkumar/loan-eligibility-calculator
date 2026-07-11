import { Suspense } from 'react';
import BanksClient from './banks-client';

export const metadata = {
  title: 'Partner Banks & NBFCs Policy Criteria | HandToHand Loans',
  description: 'Browse loan eligibility criteria, income thresholds, and CIBIL requirements across 100+ partner banks and NBFCs.',
  keywords: ['partner banks', 'lending policies', 'CIBIL requirements', 'minimum income', 'loan eligibility', 'lenders', 'NBFCs'],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FinancialService',
  'name': 'Lending Partners Network & Policy Criteria',
  'description': 'Detailed review of lending criteria, minimum salary, and credit scores required across 100+ registered banks and NBFCs in India.',
  'provider': {
    '@type': 'FinancialService',
    'name': 'HandToHand Loans',
    'url': 'https://hand2handloans.com'
  },
  'url': 'https://hand2handloans.com/banks'
};

export default function BanksPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div className="loading-spinner" style={{ border: '4px solid rgba(99, 102, 241, 0.1)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Loading partner portals...</div>
      </div>
    }>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BanksClient />
    </Suspense>
  );
}
