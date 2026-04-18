/**
 * Root Layout for MatheManager Application
 * Provides shared header/navigation across all app pages
 */

'use client';

import { ArrowLeftRight, Calendar, Euro, Settings } from 'lucide-react'
import Link from 'next/link'
import './globals.css'

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
        {/* Navigation Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700 print:hidden">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            {/* Logo & App Name */}
            <Link href="/dashboard" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:shadow-md transition-all">
                M
              </div>
              <span className="font-semibold text-gray-900 dark:text-white hidden sm:block">
                MatheManager
              </span>
            </Link>

            {/* Navigation Links */}
            <nav className="flex items-center gap-1 sm:gap-2" role="navigation" aria-label="Hauptnavigation">
              <Link href="/dashboard"
                className="px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-gray-100 dark:bg-slate-700/50 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500">
                Dashboard
              </Link>

              <Link href="/billing"
                className="px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-gray-100 dark:bg-slate-700/50 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500">
                Abrechnung
              </Link>

              <Link href="/prices"
                className="px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-gray-100 dark:bg-slate-700/50 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500">
                Preise
              </Link>

              <ArrowLeftRight className="w-4 h-4 text-gray-400 hidden sm:block" />

              <Link href="/invoices"
                className="px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-green-600 text-white hover:bg-green-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                Rechnungen
              </Link>

              <Link href="/settings"
                className="px-3 py-2 text-sm font-medium rounded-lg transition-colors bg-gray-100 dark:bg-slate-700/50 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                aria-label="Einstellungen öffnen">
                <Settings size={16} />
              </Link>
            </nav>

            {/* Mobile Menu Icon - Hidden on desktop */}
            <div className="sm:hidden">
              <button className="p-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                <Calendar className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content with margin-top for fixed header */}
        <main style={{ paddingTop: '64px' }}>
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