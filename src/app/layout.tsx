/**
 * Root layout for MatheManager
 */
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MatheManager - Nachhilfe Verwaltung",
  description: "Verwalten Sie Ihre Mathe-Nachhilfe Termine und Preise einfach und übersichtlich.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
