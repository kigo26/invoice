import { Invoice } from './types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export interface InvoiceCalculations {
  subtotal: number;
  taxAmount: number;
  total: number;
}

export function calculateInvoice(invoice: Invoice): InvoiceCalculations {
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
  // VAT is hardcoded to 16% as requested
  const taxAmount = subtotal * 0.16;
  const total = subtotal + taxAmount;
  
  return {
    subtotal,
    taxAmount,
    total,
  };
}

export const SEED_INVOICES: Invoice[] = [
  {
    id: 'INV-2026-001',
    clientName: 'Prime Steaks House',
    clientEmail: 'orders@primesteaks.com',
    issueDate: '2026-05-10',
    dueDate: '2026-06-10',
    status: 'Paid',
    taxRate: 16,
    discount: 0,
    notes: 'Premium grade meat delivery. Temperature controlled transport verified.',
    items: [
      { id: '1', description: 'Premium Grass-Fed Beef (Ribeye)', quantity: 45, price: 1800 },
      { id: '2', description: 'Fresh Mutton Leg (Bone-in)', quantity: 30, price: 1400 },
      { id: '3', description: 'Wagyu Beef Strips', quantity: 12, price: 5500 },
    ],
  },
  {
    id: 'INV-2026-002',
    clientName: 'The Butcher Block',
    clientEmail: 'billing@butcherblock.io',
    issueDate: '2026-05-20',
    dueDate: '2026-06-20',
    status: 'Pending',
    taxRate: 16,
    discount: 0,
    notes: 'Bulk supply for weekend processing. Net 30 terms.',
    items: [
      { id: '1', description: 'Whole Carcass Mutton', quantity: 5, price: 32000 },
      { id: '2', description: 'Beef Ground (80/20 mix)', quantity: 100, price: 650 },
    ],
  },
];
