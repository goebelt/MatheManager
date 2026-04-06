/**
 * Landing page for MatheManager with navigation
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

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-16 print:hidden">
          <FeatureCard icon={<Calendar size={40} />} title="Termine" description="Wöchentliche oder zweiwöchentliche Termine automatisch verwalten" />
          <FeatureCard icon={<Users size={40} />} title="Gruppenunterricht" description="Max. 2 Schüler teilen sich einen Preis pro Zeiträume-Versionierung" />
          <FeatureCard icon={<BookOpen size={40} />} title="Preise" description="Flexibel veränderliche Preise mit Validitäts-Perioden" />
        </div>

        
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="p-6 rounded-xl bg-white/80 dark:bg-slate-800/80 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-slate-700">
      <div className="flex justify-center mb-4 text-green-600 dark:text-green-500">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-slate-400">{description}</p>
    </div>
  );
}