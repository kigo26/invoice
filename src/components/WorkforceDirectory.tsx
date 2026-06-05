import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppUser, Supplier, DeliveryPerson, UserRole } from '../types';
import { X, Shield, Truck, Navigation, Search, Mail, Phone, MapPin, Users, Loader2, Download } from 'lucide-react';
import { formatDate } from '../utils';
import { updateUserRole } from '../lib/db';

interface WorkforceDirectoryProps {
  users: AppUser[];
  suppliers: Supplier[];
  deliveryPartners: DeliveryPerson[];
  currentUser: AppUser;
  onClose: () => void;
}

export default function WorkforceDirectory({ users, suppliers, deliveryPartners, currentUser, onClose }: WorkforceDirectoryProps) {
  const [activeTab, setActiveTab] = useState<'PERSONNEL' | 'DELIVERY' | 'SUPPLIERS'>('PERSONNEL');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingUid, setProcessingUid] = useState<string | null>(null);

  const isSuperAdmin = currentUser.role === 'super_admin' || ['liliprovisions@gmail.com', 'jamenya1988@gmail.com', 'skigo5917@gmail.com', 'gabriel.mugi66@gmail.com'].includes(currentUser.email || '');

  const filteredUsers = users.filter(u => u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredDelivery = deliveryPartners.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.email.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredSuppliers = suppliers.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleUpdateRole = async (targetUser: AppUser, newRole: UserRole) => {
    if (processingUid) return;
    setProcessingUid(targetUser.uid);
    try {
      await updateUserRole(currentUser, targetUser.uid, newRole, true);
    } catch (error) {
      console.error('Failed to update role:', error);
    } finally {
      setProcessingUid(null);
    }
  };

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (activeTab === 'PERSONNEL') {
      csvContent += "Name,Email,Role,Status\n";
      users.forEach(user => {
        csvContent += `"${user.displayName || ''}","${user.email || ''}","${user.role || 'Unassigned'}","${user.isDisabled ? 'Disabled' : 'Active'}"\n`;
      });
    } else if (activeTab === 'DELIVERY') {
      csvContent += "Name,Email,Phone,Vehicle ID\n";
      deliveryPartners.forEach(partner => {
        csvContent += `"${partner.name || ''}","${partner.email || ''}","${partner.phone || ''}","${partner.vehicleId || ''}"\n`;
      });
    } else if (activeTab === 'SUPPLIERS') {
      csvContent += "Name,Email,Phone,Category,Address\n";
      suppliers.forEach(supplier => {
        csvContent += `"${supplier.name || ''}","${supplier.email || ''}","${supplier.phone || ''}","${supplier.category || ''}","${supplier.address || ''}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `workforce_${activeTab.toLowerCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-[#0C0C0C] border border-[#1F1F1F] rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#1F1F1F] flex items-start sm:items-center justify-between relative bg-[#0C0C0C]">
          <div className="flex items-center gap-3 pr-10">
            <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Users size={20} className="sm:hidden" />
              <Users size={24} className="hidden sm:block" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight">Liliprovisions Workforce</h2>
              <p className="text-[10px] sm:text-xs text-zinc-500 font-mono mt-0.5">Unified Personnel Directory</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#1F1F1F] text-zinc-500 hover:text-white rounded-lg transition-colors absolute top-4 right-4 sm:top-6 sm:right-6"
          >
             <X size={20} className="sm:hidden" />
             <X size={24} className="hidden sm:block" />
          </button>
        </div>

        {/* Tabs & Search */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-[#1F1F1F] flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-[#0A0A0A]">
          <div className="flex gap-2 p-1 bg-[#141414] border border-[#1F1F1F] rounded-xl w-full xl:w-auto overflow-x-auto scroller-hide shrink-0 pb-2 xl:pb-1">
            <button
              onClick={() => setActiveTab('PERSONNEL')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'PERSONNEL' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-md shadow-indigo-500/5' : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1A1A1A] border border-transparent'
              }`}
            >
              <Shield size={14} /> System Personnel ({users.length})
            </button>
            <button
              onClick={() => setActiveTab('DELIVERY')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'DELIVERY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-md shadow-emerald-500/5' : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1A1A1A] border border-transparent'
              }`}
            >
              <Navigation size={14} /> Delivery Scouts ({deliveryPartners.length})
            </button>
            <button
              onClick={() => setActiveTab('SUPPLIERS')}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'SUPPLIERS' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-md shadow-amber-500/5' : 'text-zinc-500 hover:text-zinc-300 hover:bg-[#1A1A1A] border border-transparent'
              }`}
            >
              <Truck size={14} /> Suppliers ({suppliers.length})
            </button>
          </div>
          <div className="flex items-center gap-3 w-full xl:w-auto shrink-0">
            <div className="relative flex-1 w-full xl:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search directory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#141414] border border-[#1F1F1F] rounded-lg text-xs text-white placeholder-zinc-550 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#0C0C0C]">
          <AnimatePresence mode="wait">
            {activeTab === 'PERSONNEL' && (
              <motion.div
                key="personnel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {filteredUsers.map(user => (
                  <div key={user.uid} className="bg-[#141414] border border-[#1F1F1F] rounded-xl p-5 hover:border-indigo-500/30 transition-all flex flex-col group shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      {user.photoURL ? (
                         <img src={user.photoURL} alt={user.displayName || 'Personnel'} className="w-12 h-12 rounded-full border border-[#2A2A2A]" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                          <Users size={20} className="group-hover:scale-110 transition-transform" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm truncate">{user.displayName || 'Unnamed Personnel'}</h3>
                        {isSuperAdmin && currentUser.uid !== user.uid ? (
                          <div className="relative mt-1">
                            <select
                              disabled={processingUid === user.uid || (user.role === 'super_admin' && !isSuperAdmin) || user.isDisabled}
                              value={user.role || ''}
                              onChange={(e) => handleUpdateRole(user, e.target.value as UserRole)}
                              className="appearance-none bg-[#0C0C0C] border border-[#2A2A2A] rounded-md px-2 py-0.5 pr-6 text-[9px] font-mono text-zinc-300 hover:border-indigo-500/50 focus:outline-none focus:border-indigo-500 transition-colors uppercase tracking-widest cursor-pointer w-full disabled:opacity-50"
                            >
                              <option value="" disabled>No Role</option>
                              <option value="delivery">Delivery Scout</option>
                              <option value="supplier">Provider</option>
                              <option value="admin">Admin</option>
                              <option value="super_admin">Super Admin</option>
                            </select>
                            {processingUid === user.uid ? (
                              <Loader2 size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400 animate-spin pointer-events-none" />
                            ) : (
                              <div className="absolute right-2 top-1/2 -translate-y-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-zinc-500 pointer-events-none origin-center" />
                            )}
                          </div>
                        ) : (
                          <span className={`text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border mt-1 inline-block ${
                            user.role === 'super_admin' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-[#1A1A1A] text-zinc-400 border-[#2A2A2A]'
                          }`}>
                            {user.role === 'super_admin' ? 'Super Admin' : user.role || 'No Role'}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-auto space-y-2 pt-4 border-t border-[#1F1F1F]">
                       <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono bg-[#0C0C0C] p-2 rounded-lg border border-[#1A1A1A] truncate">
                          <Mail size={12} className="text-zinc-600 shrink-0" />
                          <span className="truncate">{user.email}</span>
                       </div>
                    </div>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="col-span-full py-20 text-center flex flex-col items-center">
                    <Shield size={40} className="text-[#1F1F1F] mb-4" />
                    <span className="text-zinc-500 font-mono text-sm">No personnel matched your search.</span>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'DELIVERY' && (
              <motion.div
                key="delivery"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {filteredDelivery.map(scout => (
                  <div key={scout.id} className="bg-[#141414] border border-[#1F1F1F] rounded-xl p-5 hover:border-emerald-500/30 transition-all flex flex-col group shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <Navigation size={20} className="group-hover:rotate-12 transition-transform" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-sm truncate">{scout.name}</h3>
                        <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 mt-1 inline-block">
                          Field Scout
                        </span>
                      </div>
                    </div>
                    <div className="mt-auto space-y-2 pt-4 border-t border-[#1F1F1F]">
                       <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono bg-[#0C0C0C] p-2 rounded-lg border border-[#1A1A1A] truncate">
                          <Mail size={12} className="text-emerald-500/50 shrink-0" />
                          <span className="truncate">{scout.email}</span>
                       </div>
                       {scout.phone && (
                         <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono bg-[#0C0C0C] p-2 rounded-lg border border-[#1A1A1A]">
                            <Phone size={12} className="text-emerald-500/50 shrink-0" />
                            <span className="truncate">{scout.phone}</span>
                         </div>
                       )}
                       {scout.vehicleId && (
                         <div className="mt-3 pt-3 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                            <span className="uppercase tracking-widest">Vehicle ID</span>
                            <span className="font-bold text-white px-2 py-0.5 rounded bg-[#1A1A1A] border border-[#2A2A2A]">{scout.vehicleId}</span>
                         </div>
                       )}
                    </div>
                  </div>
                ))}
                {filteredDelivery.length === 0 && (
                  <div className="col-span-full py-20 text-center flex flex-col items-center">
                    <Navigation size={40} className="text-[#1F1F1F] mb-4" />
                    <span className="text-zinc-500 font-mono text-sm">No delivery scouts matched your search.</span>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'SUPPLIERS' && (
              <motion.div
                key="suppliers"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {filteredSuppliers.map(supplier => (
                  <div key={supplier.id} className="bg-[#141414] border border-[#1F1F1F] rounded-xl p-5 hover:border-amber-500/30 transition-all flex flex-col group shadow-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                        <Truck size={20} className="group-hover:-scale-x-100 transition-transform" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-white text-sm truncate">{supplier.name}</h3>
                        <span className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border border-amber-500/20 bg-amber-500/10 text-amber-400 mt-1 inline-block">
                          Supply Partner
                        </span>
                      </div>
                    </div>
                    <div className="mt-auto space-y-2 pt-4 border-t border-[#1F1F1F]">
                       <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono bg-[#0C0C0C] p-2 rounded-lg border border-[#1A1A1A] truncate">
                          <Mail size={12} className="text-amber-500/50 shrink-0" />
                          <span className="truncate">{supplier.email}</span>
                       </div>
                       {supplier.phone && (
                         <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono bg-[#0C0C0C] p-2 rounded-lg border border-[#1A1A1A]">
                            <Phone size={12} className="text-amber-500/50 shrink-0" />
                            <span className="truncate">{supplier.phone}</span>
                         </div>
                       )}
                       {supplier.address && (
                         <div className="flex items-start gap-2 text-xs text-zinc-400 font-mono mt-1 bg-[#0C0C0C] p-2 rounded-lg border border-[#1A1A1A]">
                            <MapPin size={12} className="text-amber-500/50 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 leading-relaxed">{supplier.address}</span>
                         </div>
                       )}
                       {supplier.category && (
                         <div className="mt-3 pt-3 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                            <span className="uppercase tracking-widest">Category</span>
                            <span className="font-bold text-white px-2 py-0.5 rounded bg-[#1A1A1A] border border-[#2A2A2A] uppercase">{supplier.category}</span>
                         </div>
                       )}
                    </div>
                  </div>
                ))}
                {filteredSuppliers.length === 0 && (
                  <div className="col-span-full py-20 text-center flex flex-col items-center">
                    <Truck size={40} className="text-[#1F1F1F] mb-4" />
                    <span className="text-zinc-500 font-mono text-sm">No suppliers matched your search.</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 sm:py-4 border-t border-[#1F1F1F] bg-[#0C0C0C] flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#141414] hover:bg-[#1A1A1A] border border-[#2A2A2A] text-zinc-400 hover:text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-colors hidden sm:block"
          >
            Close
          </button>
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-[#1A1A1A] hover:bg-[#2A2A2A] border border-[#2A2A2A] text-zinc-300 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors"
            title="Export List to CSV"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export</span> CSV
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
