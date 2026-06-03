import React, { useState } from 'react';
import { Client, Invoice } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Phone, MapPin, History, Plus, X, UserPlus, Search, Receipt } from 'lucide-react';
import { formatDate, formatCurrency } from '../utils';
import { saveClientToDb, deleteClientFromDb } from '../lib/db';

interface ClientManagementProps {
  clients: Client[];
  invoices: Invoice[];
  onClose: () => void;
  onSelectInvoice: (invoice: Invoice) => void;
}

export default function ClientManagement({ clients, invoices, onClose, onSelectInvoice }: ClientManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  
  // New client form state
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClientInvoices = (email: string) => {
    return invoices.filter(inv => inv.clientEmail.toLowerCase() === email.toLowerCase());
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `CLI-${Date.now()}`;
    const clientData: Client = {
      ...newClient,
      id,
      createdAt: new Date().toISOString()
    };
    
    await saveClientToDb(clientData);
    setIsAddingClient(false);
    setNewClient({ name: '', email: '', phone: '', address: '' });
  };

  const handleDeleteClient = async (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      await deleteClientFromDb(id);
      if (selectedClient?.id === id) setSelectedClient(null);
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
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <User size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Client Management</h2>
              <p className="text-xs text-zinc-500 font-mono">Track client profiles and transaction histories</p>
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
          {/* Sidebar: Client List */}
          <div className="w-80 border-r border-[#1F1F1F] flex flex-col bg-[#0A0A0A]">
            <div className="p-4 space-y-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#141414] border border-[#1F1F1F] rounded-lg text-xs text-white placeholder-zinc-550 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <button
                onClick={() => setIsAddingClient(!isAddingClient)}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isAddingClient ? <X size={14} /> : <UserPlus size={14} />}
                {isAddingClient ? 'Cancel' : 'Register New Client'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredClients.map(client => (
                <button
                  key={client.id}
                  onClick={() => {
                    setSelectedClient(client);
                    setIsAddingClient(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all ${
                    selectedClient?.id === client.id 
                    ? 'bg-indigo-600/10 border border-indigo-500/20' 
                    : 'hover:bg-[#141414] border border-transparent'
                  }`}
                >
                  <p className={`text-sm font-bold ${selectedClient?.id === client.id ? 'text-indigo-400' : 'text-white'}`}>
                    {client.name}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1">{client.email}</p>
                </button>
              ))}
              {filteredClients.length === 0 && !isAddingClient && (
                <div className="text-center py-10 px-4">
                  <p className="text-xs text-zinc-600 font-mono">No clients found matching the search criteria.</p>
                </div>
              )}
            </div>
          </div>

          {/* Detailed View */}
          <div className="flex-1 overflow-y-auto bg-[#0C0C0C]">
            <AnimatePresence mode="wait">
              {isAddingClient ? (
                <motion.div
                  key="add-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8 max-w-2xl mx-auto"
                >
                  <div className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-8 space-y-6">
                    <h3 className="text-lg font-bold text-white mb-6">Register New Client</h3>
                    <form onSubmit={handleAddClient} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest font-mono">Full Name</label>
                          <input
                            required
                            type="text"
                            value={newClient.name}
                            onChange={e => setNewClient({...newClient, name: e.target.value})}
                            className="w-full px-4 py-2.5 bg-[#0C0C0C] border border-[#1F1F1F] rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                            placeholder="John Doe"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest font-mono">Email Address</label>
                          <input
                            required
                            type="email"
                            value={newClient.email}
                            onChange={e => setNewClient({...newClient, email: e.target.value})}
                            className="w-full px-4 py-2.5 bg-[#0C0C0C] border border-[#1F1F1F] rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest font-mono">Phone Number</label>
                        <input
                          type="tel"
                          value={newClient.phone}
                          onChange={e => setNewClient({...newClient, phone: e.target.value})}
                          className="w-full px-4 py-2.5 bg-[#0C0C0C] border border-[#1F1F1F] rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                          placeholder="+254 700 000000"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest font-mono">Office Address</label>
                        <textarea
                          rows={3}
                          value={newClient.address}
                          onChange={e => setNewClient({...newClient, address: e.target.value})}
                          className="w-full px-4 py-2.5 bg-[#0C0C0C] border border-[#1F1F1F] rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-hidden"
                          placeholder="Building, Street, City"
                        />
                      </div>
                      <div className="pt-4 flex gap-3">
                        <button
                          type="submit"
                          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
                        >
                          Complete Registration
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAddingClient(false)}
                          className="px-6 py-3 bg-[#1C1C1C] border border-[#2A2A2A] text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                        >
                          Discard
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              ) : selectedClient ? (
                <motion.div
                  key={selectedClient.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8 space-y-8"
                >
                  {/* Profile Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-3xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <User size={40} />
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">{selectedClient.name}</h2>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono bg-[#141414] px-2 py-1 rounded-md border border-[#1F1F1F]">
                            <Mail size={12} />
                            {selectedClient.email}
                          </span>
                          {selectedClient.phone && (
                            <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono bg-[#141414] px-2 py-1 rounded-md border border-[#1F1F1F]">
                              <Phone size={12} />
                              {selectedClient.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteClient(selectedClient.id)}
                      className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all"
                    >
                      Delete Profile
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contact details card */}
                    <div className="space-y-6">
                      <div className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-6 space-y-4">
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
                          <MapPin size={14} className="text-indigo-400" />
                          Corporate Address
                        </h4>
                        <p className="text-sm text-zinc-400 leading-relaxed italic">
                          {selectedClient.address || 'No address provided.'}
                        </p>
                      </div>
                      <div className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-6 space-y-2">
                        <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">Client Registered</p>
                        <p className="text-sm text-white font-bold">{formatDate(selectedClient.createdAt)}</p>
                      </div>
                    </div>

                    {/* Invoice History */}
                    <div className="lg:col-span-2 space-y-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
                        <History size={14} className="text-indigo-400" />
                        Transaction Ledger
                      </h4>
                      <div className="space-y-3">
                        {getClientInvoices(selectedClient.email).map(invoice => (
                          <button
                            key={invoice.id}
                            onClick={() => onSelectInvoice(invoice)}
                            className="w-full bg-[#141414] border border-[#1F1F1F] hover:border-indigo-500/30 rounded-xl p-4 flex items-center justify-between group transition-all"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-[#0C0C0C] border border-[#1F1F1F] flex items-center justify-center text-zinc-500 group-hover:text-indigo-400 transition-colors">
                                <Receipt size={18} />
                              </div>
                              <div className="text-left">
                                <p className="text-sm font-bold text-white">{invoice.id}</p>
                                <p className="text-[10px] text-zinc-500 font-mono">{formatDate(invoice.issueDate)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-indigo-400 font-mono">
                                {formatCurrency(invoice.items.reduce((sum, item) => sum + item.quantity * item.price, 0) * 1.16)}
                              </p>
                              <span className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-sm border mt-1 inline-block ${
                                invoice.status === 'Paid' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' :
                                invoice.status === 'Overdue' ? 'text-rose-400 border-rose-400/20 bg-rose-400/5' :
                                'text-amber-400 border-amber-400/20 bg-amber-400/5'
                              }`}>
                                {invoice.status}
                              </span>
                            </div>
                          </button>
                        ))}
                        {getClientInvoices(selectedClient.email).length === 0 && (
                          <div className="py-12 bg-[#0A0A0A] border border-dashed border-[#1F1F1F] rounded-2xl text-center">
                            <p className="text-xs text-zinc-600 font-mono">No historical transactions associated with this email.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-4 max-w-xs">
                    <div className="w-16 h-16 rounded-3xl bg-[#141414] border border-[#1F1F1F] flex items-center justify-center text-zinc-700 mx-auto">
                      <User size={32} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-400">No Client Selected</p>
                      <p className="text-[10px] text-zinc-600 font-mono mt-1">Select a client from the sidebar or register a new one to view documentation.</p>
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
