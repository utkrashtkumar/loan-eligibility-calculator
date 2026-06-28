export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/dashboard/', '/reset-password/'],
    },
    sitemap: 'https://hand2handloans.com/sitemap.xml',
  };
}
