/**
 * @jest-environment jsdom
 */
import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { InvoiceTemplate, type InvoiceData } from '../InvoiceTemplate';

const SAMPLE_INVOICE: InvoiceData = {
  invoiceNumber: '2026/00001',
  invoiceDate: '2026-03-15T10:00:00.000Z',
  dueDate: '2026-03-29T10:00:00.000Z',
  issuedBy: {
    name: 'Mathe Nachhilfe',
    street: 'Teststraße 5',
    zipCode: '12345',
    city: 'Berlin',
    email: 'test@example.com',
    phone: '030-123456',
    iban: 'DE89 3704 0044 0532 0130 00',
  },
  billedTo: {
    name: 'Familie Müller',
    street: 'Müllerweg 10',
    zipCode: '54321',
    city: 'Hamburg',
  },
  items: [
    {
      appointmentId: 'a1',
      date: '2026-03-10',
      studentName: 'Max Müller',
      lessonType: 'individual',
      status: 'attended',
      description: 'Einzelunterricht 60min',
      unitPrice: 30,
      quantity: 1,
      totalPrice: 30,
      isPaid: false,
    },
    {
      appointmentId: 'a2',
      date: '2026-03-12',
      studentName: 'Anna Müller',
      lessonType: 'group',
      status: 'canceled_paid',
      description: 'Gruppenunterricht 60min (Ausfall)',
      unitPrice: 10,
      quantity: 1,
      totalPrice: 10,
      isPaid: true,
    },
  ],
  subtotal: 40,
  taxRate: 0,
  taxAmount: 0,
  total: 40,
};

describe('InvoiceTemplate', () => {
  it('renders invoice number', () => {
    render(<InvoiceTemplate invoice={SAMPLE_INVOICE} />);
    expect(screen.getByText(/2026\/00001/)).toBeInTheDocument();
  });

  it('renders RECHNUNG heading', () => {
    render(<InvoiceTemplate invoice={SAMPLE_INVOICE} />);
    expect(screen.getByText('RECHNUNG')).toBeInTheDocument();
  });

  it('renders issuer business name', () => {
    render(<InvoiceTemplate invoice={SAMPLE_INVOICE} />);
    expect(screen.getByText('Mathe Nachhilfe')).toBeInTheDocument();
  });

  it('renders billed-to family name', () => {
    render(<InvoiceTemplate invoice={SAMPLE_INVOICE} />);
    expect(screen.getByText('Familie Müller')).toBeInTheDocument();
  });

  it('renders student names in items', () => {
    render(<InvoiceTemplate invoice={SAMPLE_INVOICE} />);
    expect(screen.getByText('Max Müller')).toBeInTheDocument();
    expect(screen.getByText('Anna Müller')).toBeInTheDocument();
  });

  it('renders lesson types correctly', () => {
    render(<InvoiceTemplate invoice={SAMPLE_INVOICE} />);
    expect(screen.getByText('Einzelunterricht')).toBeInTheDocument();
    expect(screen.getByText('Gruppenunterricht')).toBeInTheDocument();
  });

  it('renders attended status', () => {
    render(<InvoiceTemplate invoice={SAMPLE_INVOICE} />);
    expect(screen.getByText('Besucht')).toBeInTheDocument();
  });

  it('renders canceled_paid status', () => {
    render(<InvoiceTemplate invoice={SAMPLE_INVOICE} />);
    expect(screen.getByText('Bezahlt ausgefallen')).toBeInTheDocument();
  });

  it('renders total amount', () => {
    render(<InvoiceTemplate invoice={SAMPLE_INVOICE} />);
    // Both subtotal and total are €40.00 since tax is 0
    const amounts = screen.getAllByText(/€40\.00/);
    expect(amounts.length).toBeGreaterThanOrEqual(2);
  });

  it('renders subtotal label', () => {
    render(<InvoiceTemplate invoice={SAMPLE_INVOICE} />);
    expect(screen.getByText('Zwischensumme (netto)')).toBeInTheDocument();
  });

  it('renders tax exemption notice (§4 Nr. 21)', () => {
    render(<InvoiceTemplate invoice={SAMPLE_INVOICE} />);
    expect(screen.getByText(/§4 Nr\. 21/)).toBeInTheDocument();
    expect(screen.getByText(/Umsatzsteuer befreit/)).toBeInTheDocument();
  });

  it('renders IBAN', () => {
    render(<InvoiceTemplate invoice={SAMPLE_INVOICE} />);
    expect(screen.getByText(/DE89 3704 0044 0532 0130 00/)).toBeInTheDocument();
  });

  it('renders payment due date', () => {
    render(<InvoiceTemplate invoice={SAMPLE_INVOICE} />);
    expect(screen.getByText(/Fällig bis:/)).toBeInTheDocument();
  });

  it('renders footer thank-you note', () => {
    render(<InvoiceTemplate invoice={SAMPLE_INVOICE} />);
    expect(screen.getByText(/Vielen Dank/)).toBeInTheDocument();
  });

  it('renders "Keine Positionen" when items is empty', () => {
    const emptyInvoice = { ...SAMPLE_INVOICE, items: [], subtotal: 0, total: 0 };
    render(<InvoiceTemplate invoice={emptyInvoice} />);
    expect(screen.getByText('Keine Positionen vorhanden')).toBeInTheDocument();
  });

  it('renders canceled_free status', () => {
    const invoice: InvoiceData = {
      ...SAMPLE_INVOICE,
      items: [{
        appointmentId: 'a3',
        date: '2026-03-14',
        studentName: 'Lisa Müller',
        lessonType: 'individual',
        status: 'canceled_free',
        description: 'Ausfall frei',
        unitPrice: 0,
        quantity: 1,
        totalPrice: 0,
      }],
    };
    render(<InvoiceTemplate invoice={invoice} />);
    expect(screen.getByText('Kostenlos ausgefallen')).toBeInTheDocument();
  });

  it('renders planned status', () => {
    const invoice: InvoiceData = {
      ...SAMPLE_INVOICE,
      items: [{
        appointmentId: 'a4',
        date: '2026-03-20',
        studentName: 'Tom Müller',
        lessonType: 'individual',
        status: 'planned',
        description: 'Geplant',
        unitPrice: 30,
        quantity: 1,
        totalPrice: 0,
      }],
    };
    render(<InvoiceTemplate invoice={invoice} />);
    expect(screen.getByText('Geplant')).toBeInTheDocument();
  });

  it('renders paid status for items', () => {
    render(<InvoiceTemplate invoice={SAMPLE_INVOICE} />);
    // The second item isPaid=true
    const jaLabels = screen.getAllByText('Ja');
    expect(jaLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('renders unpaid status for items', () => {
    render(<InvoiceTemplate invoice={SAMPLE_INVOICE} />);
    // First item isPaid=false
    const neinLabels = screen.getAllByText('Nein');
    expect(neinLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('renders issuer email', () => {
    render(<InvoiceTemplate invoice={SAMPLE_INVOICE} />);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('renders issuer phone', () => {
    render(<InvoiceTemplate invoice={SAMPLE_INVOICE} />);
    expect(screen.getByText('030-123456')).toBeInTheDocument();
  });
});
