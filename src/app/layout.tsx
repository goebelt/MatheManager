/**
 * Root Layout for MatheManager Application
 * Provides shared header/navigation across all app pages
 */

'use client';

import { Navigation } from '@/components/Navigation';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <head>
        {/* Open Graph Meta Tags for Social Media Sharing */}
        <meta property="og:title" content="MatheManager - Nachhilfe-Verwaltung" />
        <meta property="og:description" content="Verwalten Sie Ihre Mathe-Nachhilfe mit Terminplanung, Abrechnung und Rechnungsgenerator" />
        <meta property="og:type" content="website" />
      </head>
      <body className="min-h-screen bg-gray-50 dark:bg-slate-900">
        {/* Navigation */}
        <Navigation />

        {/* Main Content */}
        <main>
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 py-6 print:hidden">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              MatheManager &copy; {new Date().getFullYear()} - Nachhilfe-Verwaltung mit Next.js & Tailwind CSS
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}