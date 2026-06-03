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
  const subtotal = invoice.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const taxAmount = subtotal * (invoice.taxRate / 100);
  const total = Math.max(0, subtotal + taxAmount - invoice.discount);
  
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
    taxRate: 5,
    discount: 50,
    notes: 'Premium grade meat delivery. Temperature controlled transport verified.',
    items: [
      { id: '1', description: 'Premium Grass-Fed Beef (Ribeye)', quantity: 45, price: 18.50 },
      { id: '2', description: 'Fresh Mutton Leg (Bone-in)', quantity: 30, price: 14.20 },
      { id: '3', description: 'Wagyu Beef Strips', quantity: 12, price: 55.00 },
    ],
  },
  {
    id: 'INV-2026-002',
    clientName: 'The Butcher Block',
    clientEmail: 'billing@butcherblock.io',
    issueDate: '2026-05-20',
    dueDate: '2026-06-20',
    status: 'Pending',
    taxRate: 0,
    discount: 0,
    notes: 'Bulk supply for weekend processing. Net 30 terms.',
    items: [
      { id: '1', description: 'Whole Carcass Mutton', quantity: 5, price: 320.00 },
      { id: '2', description: 'Beef Ground (80/20 mix)', quantity: 100, price: 6.50 },
    ],
  },
  {
    id: 'INV-2026-003',
    clientName: 'Gourmet Meats Ltd',
    clientEmail: 'finance@gourmetmeats.com',
    issueDate: '2026-04-15',
    dueDate: '2026-05-15',
    status: 'Overdue',
    taxRate: 8,
    discount: 0,
    notes: 'Payment is now overdue. Please settle the balance for the April meat shipment immediately.',
    items: [
      { id: '1', description: 'Organic Beef Brisket', quantity: 25, price: 12.00 },
      { id: '2', description: 'Mutton Chops (Pack of 10)', quantity: 15, price: 28.00 },
    ],
  },
  {
    id: 'INV-2026-004',
    clientName: 'City Central Bistro',
    clientEmail: 'chef@centralbistro.com',
    issueDate: '2026-06-01',
    dueDate: '2026-07-01',
    status: 'Draft',
    taxRate: 5,
    discount: 25,
    notes: 'Draft quote for upcoming festive season supply.',
    items: [
      { id: '1', description: 'Specialty Mutton Curry Cut', quantity: 50, price: 11.50 },
      { id: '2', description: 'Beef Tenderloin (Prime)', quantity: 20, price: 35.00 },
    ],
  },
];
