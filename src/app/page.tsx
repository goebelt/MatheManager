/**
 * Landing page for MatheManager mit Navigation
 */

'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, BookOpen, Calendar, Users, DollarSign, LayoutDashboard } from "lucide-react";

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
            href="/appointments"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-green-600 to-teal-500 text-white font-medium rounded-xl hover:from-green-700 hover:to-teal-600 transition-all transform hover:scale-105 shadow-lg"
          >
            <LayoutDashboard size={20} />
            Zum Terminplan starten
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