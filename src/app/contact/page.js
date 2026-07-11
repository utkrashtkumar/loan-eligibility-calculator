import ContactClient from './contact-client';

export const metadata = {
  title: 'Contact Us - Help, Support & Office Location | HandToHand Loans',
  description: 'Get in touch with the HandToHand Loans support team. Submit a query, find support hours, email us, or check office details online.',
  keywords: ['Contact Us', 'Support', 'customer service loan', 'helpdesk HandToHand Loans'],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  'name': 'Contact HandToHand Loans',
  'description': 'Customer support desk for queries regarding loans, credit scoring, and partner bank portals.',
  'url': 'https://handtohandloans.com/contact'
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ContactClient />
    </>
  );
}
