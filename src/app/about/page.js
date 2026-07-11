import AboutClient from './about-client';

export const metadata = {
  title: 'About Us - Our Mission & Vision | HandToHand Loans',
  description: 'Learn about HandToHand Loans, India\'s trusted loan matching platform. Discover our core values, partner banks network, and how we help borrowers.',
  keywords: ['About Us', 'HandToHand Loans', 'loan marketplace', 'algorithmic loan matching', 'fintech India'],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  'name': 'About HandToHand Loans',
  'description': 'Lending marketplace and AI-driven credit matching algorithm connecting consumers to bank lending programs.',
  'publisher': {
    '@type': 'Organization',
    'name': 'HandToHand Loans',
    'url': 'https://handtohandloans.com'
  },
  'url': 'https://handtohandloans.com/about'
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AboutClient />
    </>
  );
}
