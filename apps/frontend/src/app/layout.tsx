import type { Metadata } from 'next';
import './globals.css';
import Script from 'next/script';
import { getCurrentUser, hasToken } from '@/server/server-only/auth';
import { AppProviders } from './providers';

export const metadata: Metadata = {
  title: 'CityBorn',
  description: 'Trouvez le lieu de naissances des personnalités',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user = null;
  const tokenExists = await hasToken();
  if (tokenExists) {
    try {
      user = await getCurrentUser();
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  }

  return (
    <html lang="fr" className="h-full">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://fonts.googleapis.com/css2?family=Geist&family=Poppins:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <meta
          name="google-site-verification"
          content="gFNaiS_8H0_ADBty1p6PsNfeYmrO2Z9Cf2pZQOj6Pqs"
        />
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="beforeInteractive"
        />
      </head>
      <body className="h-full antialiased font-sans">
        <main className="min-h-screen h-full">
          <AppProviders user={user}>{children}</AppProviders>
        </main>
      </body>
    </html>
  );
}
