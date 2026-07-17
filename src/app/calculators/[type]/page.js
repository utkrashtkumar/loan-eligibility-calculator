import CalculatorsClient from './client';

export function generateStaticParams() {
  const slugs = [
    'loan-eligibility',
    'fd',
    'rd',
    'sip',
    'mutual-fund',
    'ppf',
    'nsc',
    'kvp',
    'ssy',
    'apy',
    'epf',
    'scss',
    'mahila-samman',
    'post-office-mis',
    'income-tax',
    'hra',
    'gst',
    'tds',
    'salary',
    'gratuity',
    'cagr',
    'inflation',
    'simple-interest'
  ];
  return slugs.map((slug) => ({ type: slug }));
}

export const metadata = {
  title: 'Financial Calculators - HandToHand Loans Platform',
  description: 'Make informed decisions with our premium suite of interactive loan, tax, and investment calculators.',
};

export default async function CalculatorDetailPage({ params }) {
  const resolvedParams = await params;
  return <CalculatorsClient type={resolvedParams.type} />;
}
