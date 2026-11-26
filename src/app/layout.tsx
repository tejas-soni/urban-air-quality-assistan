/**
 * Root App Router layout reading the request CSP nonce and providing keyboard skip navigation.
 */
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';

export const metadata: Metadata = {
  title: 'BreatheWise — Urban Air Quality Assistant',
  description:
    'GenAI urban air quality assistant with live AQI data, WHO/EPA guidance citations, and quantified low-emission routines.',
  icons: { icon: '/icon.svg' },
};

/** Renders the HTML shell while binding Next.js dynamic SSR scripts to the per-request CSP nonce. */
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await headers();

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
