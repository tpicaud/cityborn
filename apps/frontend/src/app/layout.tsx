import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import * as ApiServiceServer from "@/services/ApiServiceServer";
import AuthProvider from "@/contexts/AuthContext";
import { Roboto } from "next/font/google";
import Script from "next/script";
import ErrorProvider from "@/contexts/ErrorContext";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "CityBorn",
  description: "Trouvez le lieu de naissances des personnalités",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let user = null;
  const hasToken = await ApiServiceServer.hasToken();
  if (hasToken) {
    try {
      user = await ApiServiceServer.getCurrentUser();
    } catch (error) {
      console.error("Failed to fetch user:", error);
    }
  }

  return (
    <html lang="en">
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
        <meta
          name="google-site-verification"
          content="gFNaiS_8H0_ADBty1p6PsNfeYmrO2Z9Cf2pZQOj6Pqs"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${roboto.className} antialiased`}
      >
        <AuthProvider initialValue={user}>
          <ErrorProvider>{children}</ErrorProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
