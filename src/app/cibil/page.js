import CibilClient from './cibil-client';

export const metadata = {
  title: 'Free CIBIL Score & Credit Report Online | HandToHand Loans',
  description: 'Check your credit score instantly at no cost. Download your Experian credit report in partnership with Punjab National Bank (PNB).',
  keywords: ['CIBIL score', 'check credit score', 'free credit report', 'PNB credit report', 'Experian credit score', 'loan eligibility check'],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FinancialService',
  'name': 'Free CIBIL Score & Experian Credit Check Service',
  'description': 'Instantly check and fetch your detailed credit report securely for free, powered by Experian and Punjab National Bank.',
  'provider': {
    '@type': 'FinancialService',
    'name': 'HandToHand Loans',
    'url': 'https://handtohandloans.in'
  },
  'url': 'https://handtohandloans.in/cibil'
};

export default function CibilPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CibilClient />
    </>
  );
}
