import { supabase } from '@/lib/supabase';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-');        // Replace multiple - with single -
}

export default async function sitemap() {
  const baseUrl = 'https://handtohandloans.in';
  
  const routes = [
    '',
    '/check',
    '/banks',
    '/banks/instant',
    '/banks/salary',
    '/banks/business',
    '/credit-cards',
    '/cibil',
    '/emi-calculator',
    '/personal-loan-emi-calculator',
    '/home-loan-emi-calculator',
    '/business-loan-emi-calculator',
    '/blog',
    '/about',
    '/contact',
    '/login',
    '/signup',
    '/privacy',
    '/terms',
  ];

  const staticEntries = routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: ['/check', '/banks', '/banks/instant', '/banks/salary', '/banks/business', '/credit-cards', '/emi-calculator', '/personal-loan-emi-calculator', '/home-loan-emi-calculator', '/business-loan-emi-calculator', '/blog'].includes(route) || route === '' ? 'daily' : 'monthly',
    priority: route === '' ? 1.0 : ['/check', '/emi-calculator', '/personal-loan-emi-calculator', '/home-loan-emi-calculator', '/business-loan-emi-calculator', '/credit-cards'].includes(route) ? 0.9 : ['/banks', '/banks/instant', '/banks/salary', '/banks/business', '/cibil', '/blog', '/about', '/contact'].includes(route) ? 0.8 : 0.5,
  }));

  try {
    const { data: policies } = await supabase
      .from('bank_policies')
      .select('bank_name');
    
    if (policies && policies.length > 0) {
      const bankEntries = policies.map((p) => ({
        url: `${baseUrl}/banks/${slugify(p.bank_name)}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      }));
      return [...staticEntries, ...bankEntries];
    }
  } catch (e) {
    console.error('Error fetching sitemap dynamic paths:', e);
  }

  return staticEntries;
}
