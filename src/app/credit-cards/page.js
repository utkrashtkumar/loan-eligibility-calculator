import CreditCardsClient from './credit-cards-client';

export const metadata = {
  title: 'Apply for Premium Credit Cards Online | HandToHand Loans',
  description: 'Compare and apply for top credit cards from leading partner banks. View fee details, reward perks, and check eligibility instantly.',
  keywords: ['credit cards', 'apply credit card online', 'premium credit cards', 'reward cards', 'HDFC credit card', 'Axis credit card', 'loan checker', 'eligibility check'],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FinancialService',
  'name': 'Credit Card Comparison & Application Service',
  'description': 'Compare rewards, fees, and interest structures across premium cards from Axis Bank, HDFC, SBI, and other leading partners.',
  'provider': {
    '@type': 'FinancialService',
    'name': 'HandToHand Loans',
    'url': 'https://handtohandloans.in'
  },
  'url': 'https://handtohandloans.in/credit-cards'
};

export default function CreditCardsPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CreditCardsClient />
    </>
  );
}
