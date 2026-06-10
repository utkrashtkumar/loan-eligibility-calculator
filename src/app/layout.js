import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata = {
  title: 'LoanMatch Pro - Smart Loan Eligibility Checker',
  description:
    'Check your loan eligibility instantly across 10+ banks and NBFCs. Compare personal loan offers, CIBIL requirements, and find the best match for your profile — 100% free.',
  keywords: ['loan eligibility', 'personal loan', 'CIBIL score', 'loan checker', 'bank comparison'],
  openGraph: {
    title: 'LoanMatch Pro - Smart Loan Eligibility Checker',
    description:
      'Instantly check your loan eligibility across multiple banks. Find the best personal loan match for your profile.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
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
        </div>
      </body>
    </html>
  );
}
