import { useState } from 'react';
import { Invoice, InvoiceStatus, AppUser } from '../types';
import { calculateInvoice, formatCurrency, formatDate } from '../utils';
import { Search, Filter, Trash2, Edit2, Eye, CheckCircle, Clock, AlertTriangle, FileText, ArrowUpDown, Receipt } from 'lucide-react';

interface InvoiceListProps {
  invoices: Invoice[];
  appUser: AppUser | null;
  onSelectInvoice: (invoice: Invoice) => void;
  onEditInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (id: string) => void;
  onQuickStatusChange: (id: string, newStatus: InvoiceStatus) => void;
  onCreateInvoiceTrigger: () => void;
}

type SortField = 'dueDate' | 'issueDate' | 'total' | 'clientName' | 'id';
type SortOrder = 'asc' | 'desc';

export default function InvoiceList({
  invoices,
  appUser,
  onSelectInvoice,
  onEditInvoice,
  onDeleteInvoice,
  onQuickStatusChange,
  onCreateInvoiceTrigger,
}: InvoiceListProps) {
  const isAdmin = appUser?.role === 'ADMIN';
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortField>('issueDate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Multi-field search (id, clientName, clientEmail)
  const filteredInvoices = invoices.filter((invoice) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      invoice.id.toLowerCase().includes(searchLower) ||
      invoice.clientName.toLowerCase().includes(searchLower) ||
      invoice.clientEmail.toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'All' || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Sort logic
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    let comparison = 0;

    if (sortBy === 'id') {
      comparison = a.id.localeCompare(b.id);
    } else if (sortBy === 'clientName') {
      comparison = a.clientName.localeCompare(b.clientName);
    } else if (sortBy === 'issueDate') {
      comparison = a.issueDate.localeCompare(b.issueDate);
    } else if (sortBy === 'dueDate') {
      comparison = a.dueDate.localeCompare(b.dueDate);
    } else if (sortBy === 'total') {
      const totalA = calculateInvoice(a).total;
      const totalB = calculateInvoice(b).total;
      comparison = totalA - totalB;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc'); // Default to descending
    }
  };

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'Paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Paid
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Pending
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/10 text-rose-450 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            Overdue
          </span>
        );
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-450"></span>
            Draft
          </span>
        );
      case 'Out for Delivery':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            Out for Delivery
          </span>
        );
      case 'Delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Delivered
          </span>
        );
    }
  };

  return (
    <div className="bg-[#141414] rounded-2xl border border-[#1F1F1F] shadow-xl overflow-hidden flex flex-col h-full" id="invoice-list-container">
      {/* Filters and Search Bar */}
      <div className="p-6 border-b border-[#1F1F1F] flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            id="invoice-search-input"
            type="text"
            placeholder="Search by client name, email or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0C0C0C] border border-[#1F1F1F] rounded-lg text-sm text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-zinc-550 font-sans"
          />
        </div>

        {/* Action Button & Filtering Tabs Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Select Filter */}
          <div className="flex items-center gap-1 p-1 bg-[#0C0C0C] border border-[#1F1F1F] rounded-lg">
            {(['All', 'Paid', 'Pending', 'Out for Delivery', 'Delivered', 'Overdue', 'Draft'] as const).map((status) => (
              <button
                key={status}
                id={`filter-btn-${status.toLowerCase().replace(/ /g, '-')}`}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer transition-colors ${
                  statusFilter === status
                    ? 'bg-[#1C1C1C] text-white shadow-xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* New Invoice Trigger - Premium styling */}
          {isAdmin && (
            <button
              id="create-new-invoice-btn"
              type="button"
              onClick={onCreateInvoiceTrigger}
              className="cursor-pointer bg-white hover:bg-zinc-200 text-black font-bold text-sm px-4 py-2.5 rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-sm"
            >
              <Receipt size={15} />
              New Invoice
            </button>
          )}
        </div>
      </div>

      {/* Invoice Table view */}
      <div className="overflow-x-auto flex-1 h-full min-h-[300px]">
        {sortedInvoices.length > 0 ? (
          <table className="w-full text-left border-collapse" id="invoice-table">
            <thead>
              <tr className="border-b border-[#1F1F1F] bg-[#0C0C0C]/40 text-[11px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                <th
                  className="py-3 px-6 cursor-pointer hover:bg-white/[0.02] select-none"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center gap-1">
                    Invoice ID
                    <ArrowUpDown size={12} className={sortBy === 'id' ? 'text-indigo-400' : 'text-zinc-550'} />
                  </div>
                </th>
                <th
                  className="py-3 px-6 cursor-pointer hover:bg-white/[0.02] select-none"
                  onClick={() => handleSort('clientName')}
                >
                  <div className="flex items-center gap-1">
                    Client
                    <ArrowUpDown size={12} className={sortBy === 'clientName' ? 'text-indigo-400' : 'text-zinc-550'} />
                  </div>
                </th>
                <th
                  className="py-3 px-6 cursor-pointer hover:bg-white/[0.02] select-none"
                  onClick={() => handleSort('issueDate')}
                >
                  <div className="flex items-center gap-1">
                    Issued
                    <ArrowUpDown size={12} className={sortBy === 'issueDate' ? 'text-indigo-400' : 'text-zinc-550'} />
                  </div>
                </th>
                <th
                  className="py-3 px-6 cursor-pointer hover:bg-white/[0.02] select-none"
                  onClick={() => handleSort('dueDate')}
                >
                  <div className="flex items-center gap-1">
                    Due Date
                    <ArrowUpDown size={12} className={sortBy === 'dueDate' ? 'text-indigo-400' : 'text-zinc-550'} />
                  </div>
                </th>
                <th
                  className="py-3 px-6 cursor-pointer hover:bg-white/[0.02] select-none text-right"
                  onClick={() => handleSort('total')}
                >
                  <div className="flex items-center gap-1 justify-end">
                    Amount
                    <ArrowUpDown size={12} className={sortBy === 'total' ? 'text-indigo-400' : 'text-zinc-550'} />
                  </div>
                </th>
                <th className="py-3 px-6 text-zinc-500">Status</th>
                <th className="py-3 px-6 text-right no-print text-zinc-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F1F]/60">
              {sortedInvoices.map((invoice) => {
                const { total } = calculateInvoice(invoice);
                return (
                  <tr
                    key={invoice.id}
                    className="hover:bg-white/[0.02] transition-colors group text-sm text-zinc-300 cursor-pointer"
                    onClick={() => onSelectInvoice(invoice)}
                  >
                    {/* ID */}
                    <td className="py-4 px-6 font-mono text-xs font-semibold text-white group-hover:text-indigo-400">
                      {invoice.id}
                    </td>

                    {/* Client Name & Email */}
                    <td className="py-4 px-6 select-none">
                      <div className="font-semibold text-white">{invoice.clientName}</div>
                      <div className="text-xs text-zinc-500">{invoice.clientEmail}</div>
                    </td>

                    {/* Issue Date */}
                    <td className="py-4 px-6 font-sans whitespace-nowrap text-zinc-450">
                      {formatDate(invoice.issueDate)}
                    </td>

                    {/* Due Date & Alert */}
                    <td className="py-4 px-6 font-sans whitespace-nowrap text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <span className={invoice.status === 'Overdue' ? 'text-rose-400 font-semibold' : ''}>
                          {formatDate(invoice.dueDate)}
                        </span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-6 text-right font-mono font-bold text-white">
                      {formatCurrency(total)}
                    </td>

                    {/* Status badge */}
                    <td className="py-4 px-6">
                      {getStatusBadge(invoice.status)}
                    </td>

                    {/* Row Quick actions */}
                    <td className="py-4 px-6 text-right no-print" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Mark Paid quick action if status isn't paid */}
                        {isAdmin && invoice.status !== 'Paid' && (
                          <button
                            id={`quick-status-${invoice.id}`}
                            title="Quick Mark as Paid"
                            type="button"
                            onClick={() => onQuickStatusChange(invoice.id, 'Paid')}
                            className="cursor-pointer p-1.5 hover:bg-emerald-500/10 text-emerald-400 rounded-md border border-transparent transition-all flex items-center justify-center h-8 w-8"
                          >
                            <CheckCircle size={14} />
                          </button>
                        )}
                        <button
                          id={`view-btn-${invoice.id}`}
                          title="View Details"
                          type="button"
                          onClick={() => onSelectInvoice(invoice)}
                          className="cursor-pointer p-1.5 hover:bg-[#1C1C1C] text-zinc-400 hover:text-white rounded-md transition-colors h-8 w-8 inline-flex items-center justify-center"
                        >
                          <Eye size={14} />
                        </button>
                        {isAdmin && (
                          <>
                            <button
                              id={`edit-btn-${invoice.id}`}
                              title="Edit Invoice"
                              type="button"
                              onClick={() => onEditInvoice(invoice)}
                              className="cursor-pointer p-1.5 hover:bg-[#1C1C1C] text-indigo-400 hover:text-indigo-300 rounded-md transition-colors h-8 w-8 inline-flex items-center justify-center"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              id={`delete-btn-${invoice.id}`}
                              title="Delete Invoice"
                              type="button"
                              onClick={() => onDeleteInvoice(invoice.id)}
                              className="cursor-pointer p-1.5 hover:bg-rose-500/10 text-rose-400 hover:text-rose-300 rounded-md transition-colors h-8 w-8 inline-flex items-center justify-center"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#1C1C1C] flex items-center justify-center text-zinc-500 mb-4 border border-[#1F1F1F]">
              <Search size={22} />
            </div>
            <h3 className="font-semibold text-white text-base">No invoices indexed</h3>
            <p className="text-zinc-500 text-sm mt-1.5 max-w-sm">
              We couldn't find any documents matching your active filtering selection. Reset to show all ledgers or issue a new bill.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
