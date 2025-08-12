import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import * as ApiServiceServer from "@/services/ApiServiceServer";
import AuthProvider from "@/contexts/AuthContext";

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
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider initialValue={user}>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
