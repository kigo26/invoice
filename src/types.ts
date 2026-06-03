export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'DELIVERY' | 'SUPPLIER';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: UserRole;
  isAuthorized?: boolean;
  isDisabled?: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  action: string;
  targetId?: string;
  details?: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  supplyWeight?: number; // Weight at slaughter/supplier (KGs)
  deliveryWeight?: number; // Weight at point of delivery (KGs)
}

export type InvoiceStatus = 'Paid' | 'Pending' | 'Draft' | 'Overdue' | 'Out for Delivery' | 'Delivered';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  clientName: string;
  clientEmail: string;
  issueDate: string;
  dueDate: string;
  items: LineItem[];
  taxRate: number; // percentage
  discount: number; // flat amount
  status: InvoiceStatus;
  notes?: string;
  deliveryPerson?: string;
  deliveryNote?: string;
  deliveryNotes?: string;
  supplierNote?: string;
  spreadsheetId?: string;
  supplierPhotoUrl?: string; // Weighing scale photo from supplier
  deliveryPhotoUrl?: string; // Weighing scale photo from delivery
}
