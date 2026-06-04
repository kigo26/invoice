import React, { useState } from 'react';
import { Supplier, Invoice } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Truck, Mail, Phone, MapPin, History, Plus, X, UserPlus, Search, Receipt, Tag } from 'lucide-react';
import { formatDate, formatCurrency } from '../utils';
import { saveSupplierToDb, deleteSupplierFromDb } from '../lib/db';

interface SupplierManagementProps {
  suppliers: Supplier[];
  onClose: () => void;
}

export default function SupplierManagement({ suppliers, onClose }: SupplierManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isAddingSupplier, setIsAddingSupplier] = useState(false);
  
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    category: ''
  });

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `SUP-${Date.now()}`;
    const supplierData: Supplier = {
      ...newSupplier,
      id,
      createdAt: new Date().toISOString()
    };
    
    await saveSupplierToDb(supplierData);
    setIsAddingSupplier(false);
    setNewSupplier({ name: '', email: '', phone: '', address: '', category: '' });
  };

  const handleDeleteSupplier = async (id: string) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      await deleteSupplierFromDb(id);
      if (selectedSupplier?.id === id) setSelectedSupplier(null);
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
            <div className="w-10 h-10 rounded-xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Truck size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Supplier Management</h2>
              <p className="text-xs text-zinc-500 font-mono">Manage supply partners and procurement channels</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#1F1F1F] text-zinc-500 hover:text-white rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Sidebar */}
          <div className={`w-full md:w-80 border-r border-[#1F1F1F] flex flex-col bg-[#0A0A0A] ${(selectedSupplier || isAddingSupplier) ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 space-y-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#141414] border border-[#1F1F1F] rounded-lg text-xs text-white placeholder-zinc-550 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <button
                onClick={() => setIsAddingSupplier(!isAddingSupplier)}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isAddingSupplier ? <X size={14} /> : <UserPlus size={14} />}
                {isAddingSupplier ? 'Cancel' : 'Add New Supplier'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredSuppliers.map(supplier => (
                <button
                  key={supplier.id}
                  onClick={() => {
                    setSelectedSupplier(supplier);
                    setIsAddingSupplier(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedSupplier?.id === supplier.id 
                    ? 'bg-amber-600/10 border border-amber-500/20' 
                    : 'hover:bg-[#141414] border border-transparent'
                  }`}
                >
                  <p className={`text-sm font-bold ${selectedSupplier?.id === supplier.id ? 'text-amber-400' : 'text-white'}`}>
                    {supplier.name}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-zinc-500 font-mono">{supplier.email}</p>
                    {supplier.category && (
                      <span className="text-[8px] px-1 py-0.5 rounded border border-zinc-800 text-zinc-650 uppercase font-mono">
                        {supplier.category}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div className={`flex-1 overflow-y-auto bg-[#0C0C0C] ${(selectedSupplier || isAddingSupplier) ? 'block' : 'hidden md:block'}`}>
            <AnimatePresence mode="wait">
              {isAddingSupplier ? (
                <motion.div
                  key="add-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8 max-w-2xl mx-auto"
                >
                  <div className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-6 sm:p-8 space-y-6">
                    <div className="flex items-center gap-4 mb-6">
                      <button 
                        onClick={() => setIsAddingSupplier(false)} 
                        className="md:hidden p-2 bg-[#1A1A1A] text-zinc-400 rounded-lg shrink-0 border border-[#2A2A2A]"
                      >
                        <X size={18} />
                      </button>
                      <h3 className="text-lg font-bold text-white mb-0">Onboard New Supplier</h3>
                    </div>
                    <form onSubmit={handleAddSupplier} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest font-mono">Partner Name</label>
                          <input
                            required
                            type="text"
                            value={newSupplier.name}
                            onChange={e => setNewSupplier({...newSupplier, name: e.target.value})}
                            className="w-full px-4 py-2.5 bg-[#0C0C0C] border border-[#1F1F1F] rounded-xl text-sm text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                            placeholder="Provision Logistics Ltd"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest font-mono">Email Contact</label>
                          <input
                            required
                            type="email"
                            value={newSupplier.email}
                            onChange={e => setNewSupplier({...newSupplier, email: e.target.value})}
                            className="w-full px-4 py-2.5 bg-[#0C0C0C] border border-[#1F1F1F] rounded-xl text-sm text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                            placeholder="supply@provision.com"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest font-mono">Phone Number</label>
                          <input
                            type="tel"
                            value={newSupplier.phone}
                            onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})}
                            className="w-full px-4 py-2.5 bg-[#0C0C0C] border border-[#1F1F1F] rounded-xl text-sm text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                            placeholder="+254 700 000000"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest font-mono">Category</label>
                          <input
                            type="text"
                            value={newSupplier.category}
                            onChange={e => setNewSupplier({...newSupplier, category: e.target.value})}
                            className="w-full px-4 py-2.5 bg-[#0C0C0C] border border-[#1F1F1F] rounded-xl text-sm text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                            placeholder="Meat, Grains, etc."
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest font-mono">Base of Operations</label>
                        <textarea
                          rows={3}
                          value={newSupplier.address}
                          onChange={e => setNewSupplier({...newSupplier, address: e.target.value})}
                          className="w-full px-4 py-2.5 bg-[#0C0C0C] border border-[#1F1F1F] rounded-xl text-sm text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:outline-none"
                          placeholder="Facility Address"
                        />
                      </div>
                      <div className="pt-4 flex gap-3">
                        <button
                          type="submit"
                          className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-amber-600/20"
                        >
                          Complete Onboarding
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingSupplier(false)}
                          className="px-6 py-3 bg-[#1C1C1C] border border-[#2A2A2A] text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                        >
                          Discard
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              ) : selectedSupplier ? (
                <motion.div
                  key={selectedSupplier.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8 space-y-8"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <button 
                        onClick={() => setSelectedSupplier(null)} 
                        className="md:hidden p-2 bg-[#1A1A1A] text-zinc-400 rounded-lg shrink-0 border border-[#2A2A2A]"
                      >
                        <X size={18} />
                      </button>
                      <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-3xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Truck size={32} className="sm:hidden" />
                        <Truck size={40} className="hidden sm:block" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight truncate">{selectedSupplier.name}</h2>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                          <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono bg-[#141414] px-2 py-1 rounded-md border border-[#1F1F1F]">
                            <Mail size={12} />
                            {selectedSupplier.email}
                          </span>
                          {selectedSupplier.phone && (
                            <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono bg-[#141414] px-2 py-1 rounded-md border border-[#1F1F1F]">
                              <Phone size={12} />
                              {selectedSupplier.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteSupplier(selectedSupplier.id)}
                      className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all"
                    >
                      Delete Profile
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-6 space-y-4 shadow-sm">
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
                        <MapPin size={14} className="text-amber-400" />
                        Operation Base
                      </h4>
                      <p className="text-sm text-zinc-400 leading-relaxed italic">
                        {selectedSupplier.address || 'No address provided.'}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-6 flex items-center justify-between group shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/5 flex items-center justify-center text-amber-500/50">
                            <Tag size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">Business category</p>
                            <p className="text-sm text-white font-bold">{selectedSupplier.category || 'General Merchant'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-6 flex items-center justify-between group shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-500/5 flex items-center justify-center text-amber-500/50">
                            <History size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">Onboarded Since</p>
                            <p className="text-sm text-white font-bold">{formatDate(selectedSupplier.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-4 max-w-xs">
                    <div className="w-16 h-16 rounded-3xl bg-[#141414] border border-[#1F1F1F] flex items-center justify-center text-zinc-700 mx-auto">
                      <Truck size={32} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-400">No Supplier Selected</p>
                      <p className="text-[10px] text-zinc-600 font-mono mt-1">Select a partner from the sidebar to view detailed profiles and metadata.</p>
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
