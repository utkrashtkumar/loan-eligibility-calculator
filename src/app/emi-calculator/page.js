import EmiCalculatorPageClient from './emi-calculator-client';

export const metadata = {
  title: 'Free Personal Loan EMI Calculator & Eligibility Checker | HandToHand Loans',
  description: 'Calculate your monthly loan EMI, total interest, and check eligibility instantly using our free reducing balance and flat rate EMI calculator. Optimize your loan check options.',
  keywords: ['EMI Calculator', 'Personal Loan EMI Calculator', 'Business Loan EMI', 'Home Loan EMI', 'reducing balance calculator', 'flat rate emi calculator', 'fixed obligation to income ratio', 'eligibility check'],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FinancialCalculator',
  'name': 'Free Loan EMI Calculator',
  'description': 'Calculate monthly loan EMIs, total interest payable, and generate amortization schedules instantly.',
  'category': 'Loan Calculator',
  'url': 'https://hand2handloans.com/emi-calculator'
};

export default function EmiCalculatorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <EmiCalculatorPageClient />
    </>
  );
}
