export default function sitemap() {
  const baseUrl = 'https://hand2handloans.com';
  
  const routes = [
    '',
    '/check',
    '/banks',
    '/login',
    '/signup',
    '/privacy',
    '/terms',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' || route === '/check' || route === '/banks' ? 'daily' : 'monthly',
    priority: route === '' ? 1.0 : route === '/check' ? 0.9 : route === '/banks' ? 0.8 : 0.5,
  }));
}
