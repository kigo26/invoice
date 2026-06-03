import { useState, useMemo } from 'react';
import { Invoice, AppUser, InvoiceStatus } from '../types';
import { calculateInvoice, formatCurrency, formatDate } from '../utils';
import { 
  Truck, 
  Package, 
  MapPin, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ChevronRight, 
  Search,
  CheckCircle2,
  Calendar,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DeliveryDashboardProps {
  invoices: Invoice[];
  appUser: AppUser;
  onSelectInvoice: (invoice: Invoice) => void;
  onQuickStatusChange: (id: string, newStatus: InvoiceStatus) => void;
}

export default function DeliveryDashboard({ 
  invoices, 
  appUser, 
  onSelectInvoice,
  onQuickStatusChange 
}: DeliveryDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<'Active' | 'Delivered' | 'All'>('Active');

  // Filter invoices for this delivery person
  const myInvoices = useMemo(() => {
    return invoices.filter(inv => {
      // For now, we match by name or if strictly assigned. 
      // In a real app, we might use a deliveryUID field.
      const isAssigned = inv.deliveryPerson?.toLowerCase() === appUser.displayName?.toLowerCase();
      
      const matchesSearch = 
        inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.clientName.toLowerCase().includes(searchTerm.toLowerCase());
      
      let matchesFilter = true;
      if (filterMode === 'Active') {
        matchesFilter = inv.status !== 'Delivered' && inv.status !== 'Paid';
      } else if (filterMode === 'Delivered') {
        matchesFilter = inv.status === 'Delivered' || inv.status === 'Paid';
      }

      return isAssigned && matchesSearch && matchesFilter;
    });
  }, [invoices, appUser.displayName, searchTerm, filterMode]);

  const stats = useMemo(() => {
    const assigned = invoices.filter(inv => inv.deliveryPerson?.toLowerCase() === appUser.displayName?.toLowerCase());
    return {
      total: assigned.length,
      pending: assigned.filter(inv => inv.status === 'Pending' || inv.status === 'Overdue').length,
      inTransit: assigned.filter(inv => inv.status === 'Out for Delivery').length,
      delivered: assigned.filter(inv => inv.status === 'Delivered' || inv.status === 'Paid').length
    };
  }, [invoices, appUser.displayName]);

  return (
    <div className="space-y-6">
      {/* Welcome & Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-600/10 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-xl font-bold">Hello, {appUser.displayName}</h2>
            <p className="text-indigo-100 text-xs mt-1 font-medium opacity-80">You have {stats.pending + stats.inTransit} active assignments today.</p>
            <div className="mt-4 flex gap-3">
               <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
                 <span className="block text-[10px] uppercase font-bold text-indigo-200">Active</span>
                 <span className="text-lg font-bold">{stats.pending + stats.inTransit}</span>
               </div>
               <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2">
                 <span className="block text-[10px] uppercase font-bold text-indigo-200">Delivered</span>
                 <span className="text-lg font-bold">{stats.delivered}</span>
               </div>
            </div>
          </div>
          <Truck size={120} className="absolute -right-4 -bottom-4 text-white/10 -rotate-12" />
        </div>

        <div className="bg-[#141414] border border-[#1F1F1F] rounded-3xl p-6 flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-4">
            <Clock size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Pending Load</span>
            <div className="text-2xl font-bold text-white leading-tight">{stats.pending}</div>
          </div>
        </div>

        <div className="bg-[#141414] border border-[#1F1F1F] rounded-3xl p-6 flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 mb-4">
            <Truck size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">In Transit</span>
            <div className="text-2xl font-bold text-white leading-tight">{stats.inTransit}</div>
          </div>
        </div>
      </div>

      {/* List Section */}
      <div className="bg-[#141414] border border-[#1F1F1F] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
        <div className="p-5 border-b border-[#1F1F1F] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 px-1 bg-[#0C0C0C] p-1 rounded-xl border border-[#1F1F1F]">
            {(['Active', 'Delivered', 'All'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setFilterMode(mode)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  filterMode === mode ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-400'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-550" size={16} />
            <input
              type="text"
              placeholder="Filter assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0C0C0C] border border-[#1F1F1F] rounded-xl pl-10 pr-4 py-1.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 w-full sm:w-64"
            />
          </div>
        </div>

        <div className="divide-y divide-[#1F1F1F]">
          {myInvoices.length > 0 ? (
            myInvoices.map((inv) => {
              const { total } = calculateInvoice(inv);
              const itemsCount = inv.items.reduce((acc, item) => acc + item.quantity, 0);
              const isOut = inv.status === 'Out for Delivery';
              const isDelivered = inv.status === 'Delivered' || inv.status === 'Paid';

              return (
                <div 
                  key={inv.id}
                  onClick={() => onSelectInvoice(inv)}
                  className="p-5 hover:bg-white/[0.02] transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center gap-4"
                >
                  <div className="flex-1 flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-colors ${
                      isDelivered ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                      isOut ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' :
                      'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'
                    }`}>
                      {isDelivered ? <CheckCircle size={24} /> :
                       isOut ? <Truck size={24} /> : <Package size={24} />}
                    </div>
                    
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-white truncate">{inv.clientName}</h3>
                        <span className="text-[10px] font-mono text-zinc-600 px-1.5 py-0.5 rounded bg-[#1C1C1C]">{inv.id}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500 font-medium">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={12} className="text-zinc-600" />
                          <span className="truncate">Client Location</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Package size={12} className="text-zinc-600" />
                          <span>{itemsCount} items • {formatCurrency(total)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-zinc-600" />
                          <span>Due {formatDate(inv.dueDate)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 ml-auto px-4 sm:px-0">
                    {!isDelivered && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onQuickStatusChange(inv.id, isOut ? 'Delivered' : 'Out for Delivery');
                        }}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg ${
                          isOut 
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' 
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                        }`}
                      >
                        {isOut ? 'Mark Delivered' : 'Start Delivery'}
                      </button>
                    )}
                    
                    {isDelivered && (
                      <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-widest px-4">
                        <CheckCircle2 size={16} />
                        Completed
                      </div>
                    )}
                    
                    <ChevronRight size={20} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-[#1C1C1C] border border-[#1F1F1F] flex items-center justify-center text-zinc-600 mx-auto">
                <Truck size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white">No assignments found</h3>
                <p className="text-zinc-500 text-xs font-medium max-w-xs mx-auto">You don't have any {filterMode.toLowerCase()} delivery assignments matching your search.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
