/**
 * Landing page for MatheManager
 */
import { ArrowRight, BookOpen, Calendar, Users } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-teal-500 mb-6">
          MatheManager
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
          Ihre persönliche Nachhilfe-Verwaltung für Familien, Schüler und Termine.
        </p>
        
        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <FeatureCard icon={<Calendar size={40} />} title="Termine" description="Wöchentliche oder zweiwöchentliche Termine automatisch verwalten" />
          <FeatureCard icon={<Users size={40} />} title="Gruppenunterricht" description="Max. 2 Schüler teilen sich einen Preis pro Zeiträume-Versionierung" />
          <FeatureCard icon={<BookOpen size={40} />} title="Preise" description="Flexibel veränderliche Preise mit Validitäts-Perioden" />
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 text-center">
        <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg inline-flex items-center gap-2 transition-colors">
          Starten
          <ArrowRight size={20} />
        </button>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="p-6 rounded-xl bg-white/80 dark:bg-gray-800/80 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
      <div className="flex justify-center mb-4 text-green-600 dark:text-green-500">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}
