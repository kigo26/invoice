import React, { useState } from 'react';
import { DeliveryPerson, Invoice } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Mail, Phone, Truck, History, Plus, X, UserPlus, Search, Receipt, Navigation, PackageCheck } from 'lucide-react';
import { formatDate, formatCurrency } from '../utils';
import { saveDeliveryPartnerToDb, deleteDeliveryPartnerFromDb } from '../lib/db';

interface DeliveryManagementProps {
  partners: DeliveryPerson[];
  onClose: () => void;
}

export default function DeliveryManagement({ partners, onClose }: DeliveryManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPartner, setSelectedPartner] = useState<DeliveryPerson | null>(null);
  const [isAddingPartner, setIsAddingPartner] = useState(false);
  
  const [newPartner, setNewPartner] = useState({
    name: '',
    email: '',
    phone: '',
    vehicleId: ''
  });

  const filteredPartners = partners.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.vehicleId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `DLV-${Date.now()}`;
    const partnerData: DeliveryPerson = {
      ...newPartner,
      id,
      createdAt: new Date().toISOString()
    };
    
    await saveDeliveryPartnerToDb(partnerData);
    setIsAddingPartner(false);
    setNewPartner({ name: '', email: '', phone: '', vehicleId: '' });
  };

  const handleDeletePartner = async (id: string) => {
    if (confirm('Are you sure you want to remove this delivery scout?')) {
      await deleteDeliveryPartnerFromDb(id);
      if (selectedPartner?.id === id) setSelectedPartner(null);
    }
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
        className="bg-[#0C0C0C] border border-[#1F1F1F] rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 border-b border-[#1F1F1F] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <PackageCheck size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Delivery Management</h2>
              <p className="text-xs text-zinc-500 font-mono">Monitor courier network and logistics assets</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#1F1F1F] text-zinc-500 hover:text-white rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-80 border-r border-[#1F1F1F] flex flex-col bg-[#0A0A0A]">
            <div className="p-4 space-y-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search scouts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#141414] border border-[#1F1F1F] rounded-lg text-xs text-white placeholder-zinc-550 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <button
                onClick={() => setIsAddingPartner(!isAddingPartner)}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isAddingPartner ? <X size={14} /> : <UserPlus size={14} />}
                {isAddingPartner ? 'Cancel' : 'Register New Scout'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredPartners.map(partner => (
                <button
                  key={partner.id}
                  onClick={() => {
                    setSelectedPartner(partner);
                    setIsAddingPartner(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedPartner?.id === partner.id 
                    ? 'bg-emerald-600/10 border border-emerald-500/20' 
                    : 'hover:bg-[#141414] border border-transparent'
                  }`}
                >
                  <p className={`text-sm font-bold ${selectedPartner?.id === partner.id ? 'text-emerald-400' : 'text-white'}`}>
                    {partner.name}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-zinc-500 font-mono">{partner.email}</p>
                    {partner.vehicleId && (
                      <span className="text-[8px] px-1 py-0.5 rounded border border-zinc-800 text-zinc-650 font-mono">
                        {partner.vehicleId}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto bg-[#0C0C0C]">
            <AnimatePresence mode="wait">
              {isAddingPartner ? (
                <motion.div
                  key="add-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8 max-w-2xl mx-auto"
                >
                  <div className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-8 space-y-6">
                    <h3 className="text-lg font-bold text-white mb-6">Authorize Delivery Scout</h3>
                    <form onSubmit={handleAddPartner} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest font-mono">Personnel Name</label>
                          <input
                            required
                            type="text"
                            value={newPartner.name}
                            onChange={e => setNewPartner({...newPartner, name: e.target.value})}
                            className="w-full px-4 py-2.5 bg-[#0C0C0C] border border-[#1F1F1F] rounded-xl text-sm text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                            placeholder="Full Name"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest font-mono">Email Identifier</label>
                          <input
                            required
                            type="email"
                            value={newPartner.email}
                            onChange={e => setNewPartner({...newPartner, email: e.target.value})}
                            className="w-full px-4 py-2.5 bg-[#0C0C0C] border border-[#1F1F1F] rounded-xl text-sm text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                            placeholder="scout@provision.com"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest font-mono">Phone Number</label>
                          <input
                            type="tel"
                            value={newPartner.phone}
                            onChange={e => setNewPartner({...newPartner, phone: e.target.value})}
                            className="w-full px-4 py-2.5 bg-[#0C0C0C] border border-[#1F1F1F] rounded-xl text-sm text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                            placeholder="+254 700 000000"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest font-mono">Vehicle ID / Plate</label>
                          <input
                            type="text"
                            value={newPartner.vehicleId}
                            onChange={e => setNewPartner({...newPartner, vehicleId: e.target.value})}
                            className="w-full px-4 py-2.5 bg-[#0C0C0C] border border-[#1F1F1F] rounded-xl text-sm text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none"
                            placeholder="KXX 000X"
                          />
                        </div>
                      </div>
                      <div className="pt-4 flex gap-3">
                        <button
                          type="submit"
                          className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                        >
                          Complete Registration
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingPartner(false)}
                          className="px-6 py-3 bg-[#1C1C1C] border border-[#2A2A2A] text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                        >
                          Discard
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              ) : selectedPartner ? (
                <motion.div
                  key={selectedPartner.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8 space-y-8"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-3xl bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg">
                        <ShieldCheck size={40} />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">{selectedPartner.name}</h2>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono bg-[#141414] px-2 py-1 rounded-md border border-[#1F1F1F]">
                            <Mail size={12} />
                            {selectedPartner.email}
                          </span>
                          {selectedPartner.phone && (
                            <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono bg-[#141414] px-2 py-1 rounded-md border border-[#1F1F1F]">
                              <Phone size={12} />
                              {selectedPartner.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePartner(selectedPartner.id)}
                      className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all"
                    >
                      Revoke Authorization
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-6 space-y-4 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                         <Truck size={80} />
                      </div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
                        <Navigation size={14} className="text-emerald-400" />
                        Logistics Details
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">Assigned Vehicle</p>
                          <p className="text-lg font-bold text-white tracking-widest">{selectedPartner.vehicleId || 'UNASSIGNED'}</p>
                        </div>
                        <div className="pt-4 border-t border-[#1F1F1F]">
                           <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">Status</p>
                           <div className="flex items-center gap-2 mt-1">
                              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                              <span className="text-xs font-bold text-emerald-400 font-mono">ACTIVE SCANNABLE</span>
                           </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                      <div className="space-y-4">
                         <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
                            <ShieldCheck size={14} className="text-emerald-400" />
                            Identity Verified
                         </h4>
                         <p className="text-sm text-zinc-500 font-mono leading-relaxed">
                            Personnel authorized for node delivery entry. Multi-factor authentication required for weighing scale sync.
                         </p>
                      </div>
                      <div className="mt-8 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">Registered On</p>
                          <p className="text-sm text-white font-bold">{formatDate(selectedPartner.createdAt)}</p>
                        </div>
                        <div className="w-12 h-12 rounded-lg bg-emerald-500/5 flex items-center justify-center text-emerald-500/20">
                           <ShieldCheck size={24} />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-4 max-w-xs">
                    <div className="w-16 h-16 rounded-3xl bg-[#141414] border border-[#1F1F1F] flex items-center justify-center text-zinc-700 mx-auto">
                      <Navigation size={32} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-400">No Scout Selected</p>
                      <p className="text-[10px] text-zinc-600 font-mono mt-1">Select a delivery scout from the list to view operational credentials.</p>
                    </div>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
