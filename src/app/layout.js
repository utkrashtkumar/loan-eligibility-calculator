import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import CookieConsent from '@/components/CookieConsent';
import ScrollToTop from '@/components/ScrollToTop';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata = {
  title: 'HandToHand Loans Platform',
  description:
    'Check loan eligibility instantly across 100+ banks and NBFCs, manage client applications, track agent earnings, and build your referral tree on the premium HandToHand Loans platform.',
  keywords: ['fintech loan platform', 'agent portal', 'loan eligibility', 'salary loan', 'instant loan', 'business loan', 'CIBIL score', 'loan checker', 'bank comparison'],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'H2H Loans',
  },
  openGraph: {
    title: 'HandToHand Loans Platform',
    description:
      'Check loan eligibility instantly, submit client applications, and manage agent commissions on the HandToHand Loans platform.',
    type: 'website',
    images: ['/icon-512x512.png'],
  },
  icons: {
    apple: '/icon-192x192.png',
    icon: '/icon-512x512.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable}`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#6366f1" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#4f46e5" media="(prefers-color-scheme: light)" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="H2H Loans" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Development Phase: Clear cookies and localStorage on every new visit (browser session)
                  if (!sessionStorage.getItem('h2h_session_active')) {
                    localStorage.clear();
                    var cookies = document.cookie.split(";");
                    for (var i = 0; i < cookies.length; i++) {
                      var cookie = cookies[i];
                      var eqPos = cookie.indexOf("=");
                      var name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                    }
                    sessionStorage.setItem('h2h_session_active', '1');
                  }
                  var savedTheme = localStorage.getItem('theme') || 'dark';
                  if (savedTheme !== 'dark' && savedTheme !== 'light') savedTheme = 'dark';
                  document.documentElement.setAttribute('data-theme', savedTheme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <div className="app-wrapper">
          {children}
          <CookieConsent />
          <ScrollToTop />
          <PWAInstallPrompt />
        </div>
      </body>
    </html>
  );
}
