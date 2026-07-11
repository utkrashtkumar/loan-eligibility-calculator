import { Suspense } from 'react';
import BanksClient from '../banks-client';

export const metadata = {
  title: 'Instant Personal Loans Partner Banks & NBFCs | HandToHand Loans',
  description: 'Compare emergency and pocket loan partner banks, approval criteria, minimum salary, and credit scores. Apply online for immediate loan disbursement.',
  keywords: ['instant loans', 'pocket loans', 'emergency loan', 'instant approval bank', 'best instant personal loans'],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FinancialService',
  'name': 'Instant Personal Loans Partner List',
  'description': 'Lending criteria and instant approval policies across registered pocket and emergency loan providers in India.',
  'provider': {
    '@type': 'FinancialService',
    'name': 'HandToHand Loans',
    'url': 'https://handtohandloans.in'
  },
  'url': 'https://handtohandloans.in/banks/instant'
};

export default function InstantBanksPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div className="loading-spinner" style={{ border: '4px solid rgba(99, 102, 241, 0.1)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Loading instant portals...</div>
      </div>
    }>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BanksClient defaultCategory="instant" />
    </Suspense>
  );
}
