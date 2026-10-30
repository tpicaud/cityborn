import type { Metadata } from 'next';
import type { NextFontWithVariable } from 'next/dist/compiled/@next/font';
import localFont from 'next/font/local';
import './globals.css';
import '../../public/tamagui.generated.css';
import Script from 'next/script';
import { AppProviders } from './providers';

const fredoka: NextFontWithVariable = localFont({
  src: [
    {
      path: '../../../../packages/design-system/assets/fonts/Fredoka_400Regular.woff2',
      weight: '400',
    },
    {
      path: '../../../../packages/design-system/assets/fonts/Fredoka_500Medium.woff2',
      weight: '500',
    },
    {
      path: '../../../../packages/design-system/assets/fonts/Fredoka_600SemiBold.woff2',
      weight: '600',
    },
    {
      path: '../../../../packages/design-system/assets/fonts/Fredoka_700Bold.woff2',
      weight: '700',
    },
  ],
  display: 'swap',
  variable: '--font-fredoka',
});

export const metadata: Metadata = {
  title: 'CityBorn',
  description: 'Trouvez le lieu de naissances des personnalités',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`h-full ${fredoka.variable}`}>
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
          <AppProviders>{children}</AppProviders>
        </main>
      </body>
    </html>
  );
}
