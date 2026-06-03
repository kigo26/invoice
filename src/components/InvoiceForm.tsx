import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Invoice, LineItem, InvoiceStatus, AppUser } from '../types';
import { Plus, Trash2, X, AlertCircle, Sparkles, BookOpen, Camera, Loader2, Upload, User as UserIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SUPPLY_TEMPLATES, DELIVERY_TEMPLATES, InvoiceTemplate } from '../data/templates';

interface InvoiceFormProps {
  key?: string;
  invoice?: Invoice | null; // If null, we are in CREATE mode
  onSave: (invoice: Invoice) => void;
  onClose: () => void;
  existingInvoices: Invoice[];
  deliveryUsers?: AppUser[];
}

export default function InvoiceForm({ invoice, onSave, onClose, existingInvoices, deliveryUsers = [] }: InvoiceFormProps) {
  const [id, setId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<InvoiceStatus>('Pending');
  const [taxRate, setTaxRate] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [items, setItems] = useState<LineItem[]>([]);
  const [notes, setNotes] = useState('');
  const [deliveryPerson, setDeliveryPerson] = useState('');
  const [deliveryNote, setDeliveryNote] = useState('');
  const [supplierNote, setSupplierNote] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showTemplates, setShowTemplates] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const handleScanDocument = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    setErrors({});

    const formData = new FormData();
    formData.append('document', file);

    try {
      const response = await fetch('/api/ai/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to scan document');
      }

      const data = await response.json();

      // Populate form with extracted data
      if (data.clientName) setClientName(data.clientName);
      if (data.id) setId(data.id);
      if (data.issueDate) setIssueDate(data.issueDate);
      if (data.notes) setNotes((prev) => prev ? `${prev}\n\n${data.notes}` : data.notes);
      
      if (data.items && data.items.length > 0) {
        const extractedItems = data.items.map((item: any, idx: number) => ({
          id: `${Date.now()}-${idx}`,
          description: item.description || '',
          quantity: item.quantity || 1,
          price: item.price || 0,
          supplyWeight: item.supplyWeight,
          deliveryWeight: item.deliveryWeight,
        }));
        setItems(extractedItems);
      }
      
      if (data.supplierName) {
        setSupplierNote((prev) => prev ? `${prev}\n\nSupplier: ${data.supplierName}` : `Supplier: ${data.supplierName}`);
      }

    } catch (err: any) {
      console.error('Scan Error:', err);
      setErrors({ scan: err.message || 'AI extraction failed. Please enter manually.' });
    } finally {
      setIsScanning(false);
    }
  };

  // Auto-generate ID on create
  useEffect(() => {
    if (invoice) {
      // Edit mode: populate existing values
      setId(invoice.id);
      setClientName(invoice.clientName);
      setClientEmail(invoice.clientEmail);
      setIssueDate(invoice.issueDate);
      setDueDate(invoice.dueDate);
      setStatus(invoice.status);
      setTaxRate(invoice.taxRate);
      setDiscount(invoice.discount);
      setItems(invoice.items);
      setNotes(invoice.notes || '');
      setDeliveryPerson(invoice.deliveryPerson || '');
      setDeliveryNote(invoice.deliveryNote || '');
      setSupplierNote(invoice.supplierNote || '');
      setSpreadsheetId(invoice.spreadsheetId || '');
    } else {
      // Create mode
      const now = new Date();
      const currentYear = now.getFullYear();
      const randomNum = Math.floor(100+ Math.random() * 900); // 3 digit random
      const count = existingInvoices.length + 1;
      const proposedId = `INV-${currentYear}-${String(count).padStart(3, '0')}-${randomNum}`;
      
      const todayStr = now.toISOString().split('T')[0];
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysLaterStr = thirtyDaysLater.toISOString().split('T')[0];

      setId(proposedId);
      setClientName('Liliprovisions Limited');
      setClientEmail('');
      setIssueDate(todayStr);
      setDueDate(thirtyDaysLaterStr);
      setStatus('Pending');
      setTaxRate(8); // Default state/tax
      setDiscount(0);
      setItems([{ id: '1', description: 'Consulting & Implementation Services', quantity: 1, price: 1500 }]);
      setNotes('');
      setDeliveryPerson('');
      setDeliveryNote('DELIVERY NOTE\n\nDelivery Note No: ___________________________\n\nDate: ______________________________________\n\nSupplier: __________________________________\n\nDelivered To: Liliprovisions Limited\n\nVehicle Registration: ______________________\n\nDriver Name: _______________________________\n\nItems Delivered\n\n| Item Description | Quantity Ordered (Kg) | Quantity Delivered (Kg) |\n| ---------------- | --------------------- | ----------------------- |\n| Beef Carcass     |                       |                         |\n| Goat Meat        |                       |                         |\n| Beef Mince       |                       |                         |\n| Other            |                       |                         |\n\nTotal Quantity Delivered: __________________ Kg\n\nDelivery Time: _____________________________\n\nCondition of Goods\n\n☐ Good\n\n☐ Damaged\n\nRemarks:\n\n---\n\n---\n\nDelivered By\n\nName: __________________________\n\nSignature: _____________________\n\nDate: __________________________\n\nReceived By\n\nName: __________________________\n\nSignature: _____________________\n\nDate: __________________________\n\nCompany Stamp:');
      setSupplierNote('MEAT SUPPLY NOTE\n\nSupplier Name: ______________________________\n\nAddress: ____________________________________\n\nPhone: ______________________________________\n\nSupply Note No: _____________________________\n\nDate: _______________________________________\n\nCustomer Name: Liliprovisions Limited\n\nContact Person: _____________________________\n\nPhone: ______________________________________\n\nDescription of Meat Supplied\n\n| Item Description | Quantity (Kg) |\n| ---------------- | ------------- |\n| Beef Carcass     |               |\n| Goat Meat        |               |\n| Beef Mince       |               |\n| Other            |               |\n\nRemarks:\n\n---\n\n---\n\nSupplier Representative\n\nName: __________________________\n\nSignature: _____________________\n\nDate: __________________________\n\nCustomer Representative\n\nName: __________________________\n\nSignature: _____________________\n\nDate Received: _________________');
      setSpreadsheetId('');
    }
  }, [invoice, existingInvoices.length]);

  // Sync Due Date 30-day offset if Issue Date moves and Due Date hasn't been custom selected
  const handleIssueDateChange = (val: string) => {
    setIssueDate(val);
    if (val) {
      const parts = val.split('-');
      const issue = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const due = new Date(issue.getTime() + 30 * 24 * 60 * 60 * 1000);
      setDueDate(due.toISOString().split('T')[0]);
    }
  };

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = Math.max(0, subtotal + taxAmount - discount);

  // Line Items handlers
  const handleAddItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      price: 0,
    };
    setItems([...items, newItem]);
  };

  const handleLoadTemplate = (template: InvoiceTemplate) => {
    const newItems: LineItem[] = template.items.map((item, idx) => ({
      ...item,
      id: `${Date.now()}-${idx}`,
    }));
    setItems(newItems);
    if (template.notes) setNotes(template.notes);
    if (template.deliveryNote) setDeliveryNote(template.deliveryNote);
    if (template.supplierNote) setSupplierNote(template.supplierNote);
    setShowTemplates(false);
  };

  const handleRemoveItem = (itemId: string) => {
    // Keep at least one line item
    if (items.length <= 1) return;
    setItems(items.filter((item) => item.id !== itemId));
  };

  const handleItemChange = (itemId: string, field: keyof LineItem, value: string | number) => {
    const updated = items.map((item) => {
      if (item.id === itemId) {
        return {
          ...item,
          [field]: value,
        };
      }
      return item;
    });
    setItems(updated);
  };

  // Submit flow
  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};

    if (!id.trim()) newErrors.id = 'Invoice reference ID is required';
    if (!clientName.trim()) newErrors.clientName = 'Client name is required';
    if (!clientEmail.trim()) {
      newErrors.clientEmail = 'Client email is required';
    } else if (!/\S+@\S+\.\S+/.test(clientEmail)) {
      newErrors.clientEmail = 'Invalid email address format';
    }
    if (!issueDate) newErrors.issueDate = 'Issued date is required';
    if (!dueDate) newErrors.dueDate = 'Due date is required';
    if (new Date(dueDate) < new Date(issueDate)) {
      newErrors.dueDate = 'Due date cannot be before issued date';
    }

    // Check line items validity
    items.forEach((item, index) => {
      if (!item.description.trim()) {
        newErrors[`item-${index}`]= 'Item description is required';
      }
      if (item.quantity <= 0) {
        newErrors[`item-qty-${index}`] = 'Qty must be > 0';
      }
      if (item.price < 0) {
        newErrors[`item-price-${index}`] = 'Price cannot be negative';
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // scroll to top of form or alert
      return;
    }

    // Clear errors
    setErrors({});

    const savedInvoice: Invoice = {
      id: id.trim(),
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      issueDate,
      dueDate,
      status,
      taxRate: Number(taxRate) || 0,
      discount: Number(discount) || 0,
      items,
      notes: notes.trim() || undefined,
      deliveryPerson: deliveryPerson.trim() || undefined,
      deliveryNote: deliveryNote.trim() || undefined,
      supplierNote: supplierNote.trim() || undefined,
      spreadsheetId: spreadsheetId || undefined,
    };

    onSave(savedInvoice);
  };

  return (
    <div id="invoice-form-backdrop" className="fixed inset-0 z-50 flex justify-end no-print">
      {/* Dim overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
      />

      {/* Slide drawer container */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 220 }}
        className="relative w-full max-w-2xl bg-[#0A0A0A] h-screen shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-[#1F1F1F] flex items-center justify-between bg-[#141414]">
          <div className="flex-1">
            <h2 className="text-base font-bold text-white font-sans" id="form-heading">
              {invoice ? `Edit Invoice ${invoice.id}` : 'Create New Invoice'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Fill in client information, items list, and transaction rates securely.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!invoice && (
              <div className="relative">
                <input
                  type="file"
                  id="scan-upload"
                  className="hidden"
                  accept="image/*,application/pdf"
                  onChange={handleScanDocument}
                  disabled={isScanning}
                />
                <label
                  htmlFor="scan-upload"
                  className={`cursor-pointer flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-lg ${isScanning ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {isScanning ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Camera size={14} />
                  )}
                  {isScanning ? 'Reading Document...' : 'Scan Document'}
                </label>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer p-1 hover:bg-[#1C1C1C] rounded-lg text-zinc-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form elements scrolling container */}
        <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-6" id="invoice-edit-form">
          {errors.scan && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-450 text-xs font-mono mb-4">
              <AlertCircle size={14} />
              {errors.scan}
            </div>
          )}
          {/* General Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Invoice ID */}
            <div>
              <label htmlFor="form-invoice-id" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">
                Invoice Reference ID
              </label>
              <input
                id="form-invoice-id"
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="INV-2026-0001"
                disabled={!!invoice} // Lock key ID if editing to prevent corruption
                className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-lg text-sm text-white placeholder-zinc-550 disabled:bg-[#0C0C0C] disabled:text-zinc-500 disabled:cursor-not-allowed focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden font-mono"
              />
              {errors.id && <p className="text-rose-450 text-xs mt-1 font-sans">{errors.id}</p>}
            </div>

            {/* Status Selector */}
            <div>
              <label htmlFor="form-status" className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5 font-mono">
                Payment Status
              </label>
              <select
                id="form-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as InvoiceStatus)}
                className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="Draft">Draft</option>
                <option value="Pending">Pending</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Client Details */}
          <div className="space-y-4 pt-4 border-t border-[#1F1F1F]">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">
              Client Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="form-client-name" className="block text-xs font-semibold text-zinc-400 mb-1">
                  Client Name
                </label>
                <input
                  id="form-client-name"
                  type="text"
                  placeholder="e.g. Acme Corp"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-lg text-sm text-white placeholder-zinc-550 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-hidden"
                />
                {errors.clientName && <p className="text-rose-450 text-xs mt-1">{errors.clientName}</p>}
              </div>

              <div>
                <label htmlFor="form-client-email" className="block text-xs font-semibold text-zinc-400 mb-1">
                  Client Email Address
                </label>
                <input
                  id="form-client-email"
                  type="email"
                  placeholder="e.g. billing@acme.com"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-lg text-sm text-white placeholder-zinc-550 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-hidden"
                />
                {errors.clientEmail && <p className="text-[#F43F5E] text-xs mt-1">{errors.clientEmail}</p>}
              </div>
            </div>
          </div>

          {/* Timing/Dates */}
          <div className="space-y-4 pt-4 border-t border-[#1F1F1F]">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">
              Dates Setup
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="form-issue-date" className="block text-xs font-semibold text-zinc-400 mb-1 font-mono">
                  Issue Date
                </label>
                <input
                  id="form-issue-date"
                  type="date"
                  value={issueDate}
                  onChange={(e) => handleIssueDateChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-hidden"
                />
                {errors.issueDate && <p className="text-rose-450 text-xs mt-1">{errors.issueDate}</p>}
              </div>

              <div>
                <label htmlFor="form-due-date" className="block text-xs font-semibold text-zinc-400 mb-1 font-mono">
                  Due Date
                </label>
                <input
                  id="form-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-hidden"
                />
                {errors.dueDate && <p className="text-rose-450 text-xs mt-1">{errors.dueDate}</p>}
              </div>
            </div>
          </div>

          {/* Product Items Details and Math */}
          <div className="space-y-4 pt-4 border-t border-[#1F1F1F]" id="form-items-container">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">
                  Invoice Line Items
                </h3>
                <button
                  type="button"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="cursor-pointer text-[10px] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 flex items-center gap-1 transition-all"
                >
                  <Sparkles size={11} /> Load Template
                </button>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="cursor-pointer text-indigo-405 hover:text-indigo-305 text-xs font-semibold inline-flex items-center gap-1 hover:underline select-none"
              >
                <Plus size={14} /> Add Item
              </button>
            </div>

            <AnimatePresence>
              {showTemplates && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 bg-[#141414] border border-[#1F1F1F] rounded-xl mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1F1F1F] pb-1">Supply Templates</p>
                      {SUPPLY_TEMPLATES.map((t) => (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => handleLoadTemplate(t)}
                          className="w-full text-left p-2 hover:bg-[#1C1C1C] rounded group transition-all"
                        >
                          <p className="text-xs font-semibold text-white group-hover:text-indigo-400">{t.name}</p>
                          <p className="text-[9px] text-zinc-500 italic">{t.description}</p>
                        </button>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-[#1F1F1F] pb-1">Delivery Templates</p>
                      {DELIVERY_TEMPLATES.map((t) => (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => handleLoadTemplate(t)}
                          className="w-full text-left p-2 hover:bg-[#1C1C1C] rounded group transition-all"
                        >
                          <p className="text-xs font-semibold text-white group-hover:text-indigo-400">{t.name}</p>
                          <p className="text-[9px] text-zinc-500 italic">{t.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Line items table list */}
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="p-4 bg-[#141414] border border-[#1F1F1F] rounded-xl space-y-3 relative group"
                >
                  <div className="flex items-start gap-3">
                    {/* Description */}
                    <div className="flex-1">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                        Item Description
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Technical UI Consultation Hours"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#0C0C0C] border border-[#1F1F1F] rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-505 focus:outline-hidden"
                      />
                      {errors[`item-${index}`] && (
                        <p className="text-rose-450 text-xs mt-1">{errors[`item-${index}`]}</p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="w-20">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="1"
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-[#0C0C0C] border border-[#1F1F1F] rounded-lg text-sm transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10 text-center text-white"
                      />
                      {errors[`item-qty-${index}`] && (
                        <p className="text-rose-450 text-xs mt-1">{errors[`item-qty-${index}`]}</p>
                      )}
                    </div>

                    {/* Price */}
                    <div className="w-28">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                        Price ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={item.price || ''}
                        onChange={(e) => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-1.5 bg-[#0C0C0C] border border-[#1F1F1F] rounded-lg text-sm text-right text-white transition-all focus:outline-hidden focus:ring-2 focus:ring-indigo-500/10"
                      />
                      {errors[`item-price-${index}`] && (
                        <p className="text-rose-450 text-xs mt-1">{errors[`item-price-${index}`]}</p>
                      )}
                    </div>

                    {/* Weights */}
                    <div className="w-24">
                      <label className="block text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">
                        Supply (KG)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={item.supplyWeight || ''}
                        onChange={(e) => handleItemChange(item.id, 'supplyWeight', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-[#0C0C0C] border border-emerald-500/20 rounded-lg text-[13px] text-right text-emerald-400 transition-all focus:outline-hidden focus:ring-1 focus:ring-emerald-500/30"
                      />
                    </div>

                    <div className="w-24">
                      <label className="block text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">
                        Delivery (KG)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={item.deliveryWeight || ''}
                        onChange={(e) => handleItemChange(item.id, 'deliveryWeight', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 bg-[#0C0C0C] border border-indigo-400/20 rounded-lg text-[13px] text-right text-indigo-300 transition-all focus:outline-hidden focus:ring-1 focus:ring-indigo-500/30"
                      />
                    </div>

                    {/* Trash/Delete action */}
                    {items.length > 1 && (
                      <div className="self-end pb-1.5">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 rounded-lg border border-transparent hover:border-[#1F1F1F] transition-all cursor-pointer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Realtime sum helper */}
                  <div className="flex justify-end text-xs text-zinc-500 font-mono">
                    Total: <strong className="ml-1 text-white font-bold">${((item.quantity || 0) * (item.price || 0)).toFixed(2)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax, Discounts & Notes */}
          <div className="space-y-4 pt-4 border-t border-[#1F1F1F]">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">
              Adjustments
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="form-tax-rate" className="block text-xs font-semibold text-zinc-400 mb-1">
                  Tax Rate (%)
                </label>
                <input
                  id="form-tax-rate"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="0"
                  value={taxRate || ''}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label htmlFor="form-discount" className="block text-xs font-semibold text-zinc-400 mb-1">
                  Flat Discount ($)
                </label>
                <input
                  id="form-discount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  value={discount || ''}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Notes & payment details */}
            <div className="pt-2">
              <label htmlFor="form-notes" className="block text-xs font-semibold text-zinc-400 mb-1">
                Terms and Notes
              </label>
              <textarea
                id="form-notes"
                rows={3}
                placeholder="Declare bank swift numbers, delay clauses, or polite custom greetings."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Delivery Details */}
            <div className="space-y-4 pt-4 border-t border-[#1F1F1F]">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">
                Delivery Documentation
              </h3>
              
              <div>
                <label htmlFor="form-delivery-person" className="block text-xs font-semibold text-zinc-400 mb-1">
                  Delivery Personnel
                </label>
                <div className="flex gap-2">
                  <select
                    id="form-delivery-person-select"
                    value={deliveryUsers.some(u => u.displayName === deliveryPerson) ? deliveryPerson : ''}
                    onChange={(e) => setDeliveryPerson(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="">-- Select Personnel --</option>
                    {deliveryUsers.map(user => (
                      <option key={user.uid} value={user.displayName || ''}>
                        {user.displayName}
                      </option>
                    ))}
                    {!deliveryUsers.some(u => u.displayName === deliveryPerson) && deliveryPerson && (
                      <option value={deliveryPerson}>{deliveryPerson} (Custom)</option>
                    )}
                  </select>
                  <input
                    id="form-delivery-person-custom"
                    type="text"
                    placeholder="Or enter custom name..."
                    value={deliveryPerson}
                    onChange={(e) => setDeliveryPerson(e.target.value)}
                    className="flex-1 px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-lg text-sm text-white placeholder-zinc-550 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="form-delivery-note" className="block text-xs font-semibold text-zinc-400 mb-1">
                  Delivery Note to Client
                </label>
                <textarea
                  id="form-delivery-note"
                  rows={2}
                  placeholder="e.g. Left at side gate, confirmed temperature at 4°C."
                  value={deliveryNote}
                  onChange={(e) => setDeliveryNote(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Supplier Details */}
            <div className="space-y-4 pt-4 border-t border-[#1F1F1F]">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono">
                Supplier Documentation
              </h3>
              
              <div>
                <label htmlFor="form-supplier-note" className="block text-xs font-semibold text-zinc-400 mb-1">
                  Supplier Meat KGs / Supply Note
                </label>
                <textarea
                  id="form-supplier-note"
                  rows={2}
                  placeholder="e.g. Supplier to deliver 50kg beef, 20kg chicken."
                  value={supplierNote}
                  onChange={(e) => setSupplierNote(e.target.value)}
                  className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-lg text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Math Summary and Form Footer Action buttons */}
        <div className="border-t border-[#1F1F1F] bg-[#141414] p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex md:items-end justify-between md:flex-col font-mono text-sm">
            <span className="text-zinc-500 text-xs">Calculated Total</span>
            <div className="text-xl font-bold text-white">
              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total)}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="cancel-form-btn"
              type="button"
              onClick={onClose}
              className="cursor-pointer flex-1 md:flex-none border border-[#1F1F1F] bg-[#0C0C0C] hover:bg-[#1C1C1C] text-zinc-300 font-semibold px-4 py-2 rounded-lg text-sm transition-colors text-center shadow-xs"
            >
              Cancel
            </button>
            <button
              id="save-invoice-btn"
              type="button"
              onClick={handleFormSubmit}
              className="cursor-pointer flex-1 md:flex-none bg-indigo-650 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm transition-all text-center shadow-lg"
            >
              {invoice ? 'Save Changes' : 'Issue Invoice'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
