import { Suspense } from 'react';
import BanksClient from '../banks-client';

export const metadata = {
  title: 'Salary Loan Banks & NBFCs Partner List | HandToHand Loans',
  description: 'Compare leading banks and lenders offering personal loans for salaried employees. Find minimum salary requirements and processing fees.',
  keywords: ['salary loan', 'salaried employee loan', 'personal loan for salary', 'salary bank criteria'],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FinancialService',
  'name': 'Salaried Loans Partner List',
  'description': 'Compare minimum salary limits, credit score bands, and processing fees across leading salaried loan providers.',
  'provider': {
    '@type': 'FinancialService',
    'name': 'HandToHand Loans',
    'url': 'https://handtohandloans.in'
  },
  'url': 'https://handtohandloans.in/banks/salary'
};

export default function SalaryBanksPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '16px' }}>
        <div className="loading-spinner" style={{ border: '4px solid rgba(99, 102, 241, 0.1)', borderTop: '4px solid var(--color-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>Loading salary portals...</div>
      </div>
    }>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BanksClient defaultCategory="salary" />
    </Suspense>
  );
}
