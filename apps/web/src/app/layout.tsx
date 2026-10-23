/**
 * Root layout — wires the i18n provider and the global app providers.
 */

import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

import './globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';

const SITE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ResumeForge AI — AI-powered resume builder',
    template: '%s · ResumeForge AI',
  },
  description:
    'Build, enhance and export a resume that passes both recruiter screens and ATS filters — with live preview and real AI assistance.',
  applicationName: 'ResumeForge AI',
  keywords: [
    'resume builder',
    'cv maker',
    'ATS resume',
    'AI resume writer',
    'cover letter',
    'resume templates',
  ],
  authors: [{ name: 'ResumeForge AI' }],
  creator: 'ResumeForge AI',
  openGraph: {
    type: 'website',
    siteName: 'ResumeForge AI',
    title: 'ResumeForge AI — AI-powered resume builder',
    description:
      'Build, enhance and export a resume that passes both recruiter screens and ATS filters.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ResumeForge AI — AI-powered resume builder',
    description:
      'Build, enhance and export a resume that passes both recruiter screens and ATS filters.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The locale comes from a cookie, so the tree is rendered per request.
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="font-sans antialiased bg-background text-foreground min-h-screen flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            {children}
            <Toaster position="top-right" />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
