import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SentinelX — Website Security Scanner & Risk Assessment Platform',
  description:
    'Scan your website publicly observable security posture, evaluate SSL/TLS, inspect HTTP security headers, cookies, and receive actionable remediation guidance.',
  keywords: [
    'website security scanner',
    'cybersecurity audit',
    'security headers',
    'CSP generator',
    'HSTS test',
    'SSL TLS scanner',
    'passive security assessment',
  ],
  authors: [{ name: 'SentinelX Security' }],
  openGraph: {
    title: 'SentinelX — Website Security Scanner',
    description: 'Know Your Website. Secure Your Business. Safe passive cybersecurity assessment.',
    type: 'website',
    locale: 'en_US',
    siteName: 'SentinelX',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SentinelX — Website Security Scanner',
    description: 'Scan your website security posture and get actionable remediation code.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="cyber-body">
        {/* Dynamic ambient cyber grid background */}
        <div className="cyber-grid-bg" />
        <div className="relative z-10 min-h-screen flex flex-col justify-between">
          {children}
        </div>
      </body>
    </html>
  );
}
