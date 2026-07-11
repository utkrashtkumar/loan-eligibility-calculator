export default function sitemap() {
  const baseUrl = 'https://handtohandloans.com';
  
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
    '/blog',
    '/about',
    '/contact',
    '/login',
    '/signup',
    '/privacy',
    '/terms',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: ['/check', '/banks', '/banks/instant', '/banks/salary', '/banks/business', '/credit-cards', '/emi-calculator', '/blog'].includes(route) || route === '' ? 'daily' : 'monthly',
    priority: route === '' ? 1.0 : ['/check', '/emi-calculator', '/credit-cards'].includes(route) ? 0.9 : ['/banks', '/banks/instant', '/banks/salary', '/banks/business', '/cibil', '/blog', '/about', '/contact'].includes(route) ? 0.8 : 0.5,
  }));
}
