/**
 * Landing page for MatheManager mit Navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, BookOpen, Calendar, Users, DollarSign, Settings as SettingsIcon, LayoutDashboard } from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
  { name: 'Rechnungen', href: '/invoices', icon: <DollarSign size={20} /> },
  { name: 'Einstellungen', href: '/settings', icon: <SettingsIcon size={20} /> },
];

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Navigation Bar */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50 print:hidden">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between max-w-6xl">
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-teal-500">
              MatheManager
            </h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  item.href === '/dashboard'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                {item.icon}
                {item.name}
              </a>
            ))}
          </div>

        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center max-w-3xl">
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-teal-500 mb-6">
          MatheManager
        </h1>
        <p className="text-xl text-gray-600 dark:text-slate-300 max-w-2xl mx-auto mb-8">
          Ihre persönliche Nachhilfe-Verwaltung für Familien, Schüler und Termine.
        </p>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Calendar, title: 'Terminverwaltung', desc: 'Planen Sie Nachhilfestunden übersichtlich' },
            { icon: Users, title: 'Schülermanagement', desc: 'Verwalten Sie alle Ihre Schüler auf einen Blick' },
            { icon: DollarSign, title: 'Rechnungen', desc: 'Automatische Preisberechnung und Abrechnung' },
          ].map((feature, index) => (
            <div key={index} className="p-6 bg-white/80 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-4 mx-auto">
                <feature.icon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 dark:text-slate-400">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="flex justify-center">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-teal-500 text-white font-medium rounded-xl hover:from-green-700 hover:to-teal-600 transition-all transform hover:scale-105 shadow-lg"
          >
            <LayoutDashboard size={20} />
            Zum Dashboard starten
            <ArrowRight size={20} />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-sm text-gray-500 dark:text-slate-500 print:hidden">
        <p>&copy; 2026 MatheManager. Alle Rechte vorbehalten.</p>
      </footer>
    </main>
  );
}