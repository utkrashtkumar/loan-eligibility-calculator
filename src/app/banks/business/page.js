import { Suspense } from 'react';
import BanksClient from '../banks-client';

export const metadata = {
  title: 'Unsecured Business Loans Partner Banks | HandToHand Loans',
  description: 'Compare interest rates and eligibility criteria for unsecured business loans across leading partner banks and financial institutions.',
  keywords: ['business loans', 'unsecured business loan', 'commercial loan', 'working capital loans', 'MSME loan'],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FinancialService',
  'name': 'Business Loans Partner List',
  'description': 'Lending thresholds, CIBIL benchmarks, and MSME working capital limits across partner banks and NBFCs.',
  'provider': {
    '@type': 'FinancialService',
    'name': 'HandToHand Loans',
    'url': 'https://handtohandloans.in'
  },
  'url': 'https://handtohandloans.in/banks/business'
};

export default function BusinessBanksPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div className="loading-spinner" style={{ border: '4px solid rgba(99, 102, 241, 0.1)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Loading business portals...</div>
      </div>
    }>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BanksClient defaultCategory="business" />
    </Suspense>
  );
}
