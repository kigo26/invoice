import React, { useState } from 'react';
import { Invoice, AppUser, InvoiceStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Search, Clock, CheckCircle2, ChevronRight, Camera, FileText, Scale } from 'lucide-react';
import { formatDate, formatCurrency } from '../utils';

interface SupplierDashboardProps {
  invoices: Invoice[];
  appUser: AppUser;
  onSelectInvoice: (invoice: Invoice) => void;
  onUpdateInvoice: (id: string, updates: Partial<Invoice>) => void;
}

export default function SupplierDashboard({ invoices, appUser, onSelectInvoice, onUpdateInvoice }: SupplierDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter invoices for suppliers to see (usually Pending or Draft)
  const supplierInvoices = invoices.filter(inv => 
    (inv.status === 'Pending' || inv.status === 'Draft') &&
    (inv.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
     inv.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

  return (
    <div className="space-y-8">
      {/* Header Stat Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#141414] border border-[#1F1F1F] p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 text-amber-500 mb-2">
            <Clock size={16} />
            <h3 className="text-[10px] font-bold uppercase tracking-widest font-mono">Pending Supply</h3>
          </div>
          <p className="text-3xl font-bold text-white font-mono">
            {invoices.filter(i => i.status === 'Pending').length}
          </p>
        </div>
        <div className="bg-[#141414] border border-[#1F1F1F] p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 text-indigo-500 mb-2">
            <Package size={16} />
            <h3 className="text-[10px] font-bold uppercase tracking-widest font-mono">Total Active Jobs</h3>
          </div>
          <p className="text-3xl font-bold text-white font-mono">
            {supplierInvoices.length}
          </p>
        </div>
        <div className="bg-[#141414] border border-[#1F1F1F] p-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3 text-emerald-500 mb-2">
            <CheckCircle2 size={16} />
            <h3 className="text-[10px] font-bold uppercase tracking-widest font-mono">Completed Today</h3>
          </div>
          <p className="text-3xl font-bold text-white font-mono">
            {invoices.filter(i => i.status === 'Delivered' && i.issueDate === new Date().toISOString().split('T')[0]).length}
          </p>
        </div>
      </div>

      <div className="bg-[#0C0C0C] border border-[#1F1F1F] rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-[#1F1F1F] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Scale size={20} className="text-emerald-500" />
              Supply Queue
            </h2>
            <p className="text-xs text-zinc-500 font-mono mt-1">Document KGs and upload weighing scale proofs</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search ID or Client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#141414] border border-[#1F1F1F] rounded-lg text-xs text-white placeholder-zinc-550 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        <div className="divide-y divide-[#1F1F1F]">
          {supplierInvoices.map((inv) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="group hover:bg-[#141414] p-6 cursor-pointer transition-all border-l-2 border-transparent hover:border-emerald-500"
              onClick={() => onSelectInvoice(inv)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#0A0A0A] border border-[#1F1F1F] flex items-center justify-center text-zinc-650 group-hover:text-emerald-500 group-hover:border-emerald-500/30 transition-all">
                    <Scale size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors uppercase tracking-tight">
                      {inv.id}
                    </h4>
                    <p className="text-[10px] font-mono text-zinc-500 mt-0.5">{inv.clientName}</p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="hidden lg:block text-right mr-4">
                    <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">Est. Volume</p>
                    <p className="text-sm font-bold text-white font-mono">
                      {inv.items.reduce((sum, item) => sum + item.quantity, 0)} KGs
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {inv.status !== 'READY_FOR_PICKUP' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpdateInvoice(inv.id, {
                            status: "READY_FOR_PICKUP",
                            supplierUID: appUser.uid,
                            supplierConfirmedAt: new Date().toISOString(),
                            supplierName: appUser.displayName || undefined,
                            supplierEmail: appUser.email || undefined
                          });
                        }}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                      >
                        <CheckCircle2 size={14} />
                        Confirm & Set Ready
                      </button>
                    ) : (
                      <div className="px-4 py-2 bg-zinc-800 text-zinc-500 text-[10px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-2 border border-zinc-700">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                        Ready for Pickup
                      </div>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectInvoice(inv);
                      }}
                      className="px-4 py-2 bg-[#141414] border border-[#1F1F1F] text-zinc-400 hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2"
                    >
                      <Camera size={14} />
                      Document
                    </button>
                    <div className="p-2 text-zinc-600 group-hover:text-white group-hover:translate-x-1 transition-all">
                      <ChevronRight size={20} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick info badges */}
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-2 py-0.5 bg-[#0A0A0A] border border-[#1F1F1F] rounded text-[9px] text-zinc-500 font-mono flex items-center gap-1.5">
                  <FileText size={10} />
                  {inv.items.length} Items Listed
                </span>
                {inv.supplierNote ? (
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[9px] text-emerald-400 font-mono flex items-center gap-1.5">
                    <CheckCircle2 size={10} />
                    Supply Note Attached
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[9px] text-amber-500 font-mono flex items-center gap-1.5">
                    <Clock size={10} />
                    Awaiting Documentation
                  </span>
                )}
              </div>
            </motion.div>
          ))}

          {supplierInvoices.length === 0 && (
            <div className="py-20 text-center">
              <div className="w-16 h-16 rounded-3xl bg-[#141414] border border-dashed border-[#1F1F1F] flex items-center justify-center text-zinc-700 mx-auto mb-4">
                <Scale size={32} />
              </div>
              <p className="text-sm font-bold text-zinc-400">No Pending Supply Tasks</p>
              <p className="text-[10px] text-zinc-600 font-mono mt-1">All orders are currently documented or not yet in supply phase.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
