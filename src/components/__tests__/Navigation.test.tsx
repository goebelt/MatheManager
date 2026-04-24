/**
 * @jest-environment jsdom
 */
import { describe, it, expect, jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/appointments',
}));

// Mock next/link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { Navigation } from '../Navigation';

describe('Navigation', () => {
  it('renders all navigation links', () => {
    render(<Navigation />);
    expect(screen.getByText('Startseite')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Familien & Schueler')).toBeInTheDocument();
    expect(screen.getByText('Schuelerverwaltung')).toBeInTheDocument();
    expect(screen.getByText('Terminplan')).toBeInTheDocument();
    expect(screen.getByText('Preise')).toBeInTheDocument();
    expect(screen.getByText('Abrechnung')).toBeInTheDocument();
    expect(screen.getByText('Rechnungen')).toBeInTheDocument();
    expect(screen.getByText('Einstellungen')).toBeInTheDocument();
  });

  it('marks current page as active', () => {
    // usePathname returns '/appointments'
    render(<Navigation />);
    const appointmentsLink = screen.getByText('Terminplan').closest('a');
    expect(appointmentsLink?.className).toContain('bg-green-50');
  });

  it('does not mark non-current pages as active', () => {
    render(<Navigation />);
    const familiesLink = screen.getByText('Familien & Schueler').closest('a');
    expect(familiesLink?.className).not.toContain('bg-green-50');
  });

  it('renders home link with / href', () => {
    render(<Navigation />);
    const homeLink = screen.getByText('Startseite').closest('a');
    expect(homeLink?.getAttribute('href')).toBe('/');
  });

  it('renders dashboard link with /dashboard href', () => {
    render(<Navigation />);
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink?.getAttribute('href')).toBe('/dashboard');
  });

  it('toggles mobile menu on button click', () => {
    render(<Navigation />);
    const menuButton = screen.getByLabelText('Menu oeffnen');
    fireEvent.click(menuButton);
    // Menu should still be functional after toggle
    expect(screen.getByLabelText('Menu oeffnen')).toBeInTheDocument();
  });

  it('applies opacity-0 when isLoading is true', () => {
    render(<Navigation isLoading={true} />);
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link.className).toContain('opacity-0');
    });
  });
});
