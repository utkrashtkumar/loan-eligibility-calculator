import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import CookieConsent from '@/components/CookieConsent';
import ScrollToTop from '@/components/ScrollToTop';

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
  title: 'Hand to Hand Fintech Loan Platform',
  description:
    'Check loan eligibility instantly across 100+ banks and NBFCs, manage client applications, track agent earnings, and build your referral tree on the premium Hand to Hand Fintech platform.',
  keywords: ['fintech loan platform', 'agent portal', 'loan eligibility', 'personal loan', 'CIBIL score', 'loan checker', 'bank comparison'],
  openGraph: {
    title: 'Hand to Hand Fintech Loan Platform',
    description:
      'Check loan eligibility instantly, submit client applications, and manage agent commissions on the Hand to Hand Fintech platform.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${plusJakartaSans.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var savedTheme = localStorage.getItem('theme') || 'dark';
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
        </div>
      </body>
    </html>
  );
}
