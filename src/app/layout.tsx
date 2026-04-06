/**
 * Main layout for MatheManager app
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import { Navigation } from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'MatheManager - Terminverwaltung',
  description: 'Next.js App zur Verwaltung von Mathe-Nachhilfe mit Tailwind CSS',
};

const NAV_ITEMS = [
  { href: '/', icon: <Home size={20} />, label: 'Startseite' },
  { href: '/families', icon: <Users size={20} />, label: 'Familien & Schüler' },
  { href: '/billing', icon: <FileText size={20} />, label: 'Abrechnung' },
];

interface NavItemProps extends React.HTMLAttributes<HTMLDivElement> {
  item: { href: string; icon: React.ReactNode; label: string };
}

function NavItem({ item, className }: NavItemProps) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${className}`}
    >
      {item.icon}
      {item.label}
    </Link>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="min-h-screen bg-gray-50 dark:bg-slate-900">
        {/* Navigation */}
        <Navigation />

        {/* Main Content */}
        <main className="pb-16">{children}</main>
      </body>
    </html>
  );
}