import React, { useState, useEffect } from 'react';
import { AppUser, AuditLog, UserRole } from '../types';
import { subscribeToUsers, subscribeToAuditLogs, updateUserAccountStatus, updateUserRole, deleteUserAccount } from '../lib/db';
import { X, Shield, User as UserIcon, CheckCircle2, XCircle, Loader2, Search, History, Crown, Ban, UserCheck, ShieldClose, Trash2, ShieldAlert, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate } from '../utils';

interface UserManagementProps {
  onClose: () => void;
  currentUser: AppUser;
}

export default function UserManagement({ onClose, currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'DIRECTORY' | 'INVITE'>('DIRECTORY');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('DELIVERY');
  const [newUserDisplayName, setNewUserDisplayName] = useState('');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [processingUid, setProcessingUid] = useState<string | null>(null);

  const handleAddPersonnel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail) return;
    
    setProcessingUid('add_new');
    try {
      // Create a skeleton/invite record in the users collection with Email as a synthetic ID
      // When they actually sign in, it creates their real UID doc, but this way we can track invites 
      // or at least have a visual representation. 
      // A better approach for this mockup is just to add a fake UID document:
      const syntheticUid = `pending-${Date.now()}`;
      const tempUser: AppUser = {
        uid: syntheticUid,
        email: newUserEmail,
        displayName: newUserDisplayName || newUserEmail.split('@')[0],
        role: newUserRole,
      };
      
      const { setDoc, doc } = await import('firebase/firestore');
      const { db } = await import('../lib/auth');
      await setDoc(doc(db, 'users', syntheticUid), tempUser);
      
      const { createAuditLog } = await import('../lib/db');
      await createAuditLog(currentUser, 'PRE_AUTHORIZED_USER', `Pre-authorized access for ${newUserEmail}`, syntheticUid);
      
      setActiveTab('DIRECTORY');
      setNewUserEmail('');
      setNewUserDisplayName('');
    } catch (error) {
      console.error('Failed to add personnel:', error);
    } finally {
      setProcessingUid(null);
    }
  };

  useEffect(() => {
    const unsubscribeUsers = subscribeToUsers((data) => {
      setUsers(data);
      setLoading(false);
    });

    const unsubscribeLogs = subscribeToAuditLogs((data) => {
      setAuditLogs(data);
    });

    return () => {
      unsubscribeUsers();
      unsubscribeLogs();
    };
  }, []);

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN' || ['liliprovisions@gmail.com', 'jamenya1988@gmail.com', 'skigo5917@gmail.com', 'gabriel.mugi66@gmail.com'].includes(currentUser.email || '');

  const selectedUser = users.find(u => u.uid === selectedUid);

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    const order: Record<string, number> = { 'SUPER_ADMIN': 0, 'ADMIN': 1, 'SUPPLIER': 2, 'DELIVERY': 3 };
    return (order[a.role || ''] || 99) - (order[b.role || ''] || 99);
  });

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

  const handleToggleDisabled = async (targetUser: AppUser) => {
    if (processingUid) return;
    setProcessingUid(targetUser.uid);
    try {
      await updateUserAccountStatus(currentUser, targetUser.uid, !targetUser.isDisabled);
    } catch (error) {
      console.error('Failed to toggle status:', error);
    } finally {
      setProcessingUid(null);
    }
  };

  const handleDeleteUser = async (targetUser: AppUser) => {
    if (!isSuperAdmin) return;
    if (confirm(`Are you sure you want to permanently remove personnel: ${targetUser.email}?`)) {
      if (processingUid) return;
      setProcessingUid(targetUser.uid);
      try {
        await deleteUserAccount(currentUser, targetUser.uid);
        if (selectedUid === targetUser.uid) setSelectedUid(null);
      } catch (error) {
        console.error('Failed to delete user:', error);
      } finally {
        setProcessingUid(null);
      }
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
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Security Access Hub</h2>
              <p className="text-xs text-zinc-500 font-mono">Authorize, Assign, or Remove Personnel</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#1F1F1F] text-zinc-500 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Sidebar */}
          <div className={`w-full md:w-80 border-r border-[#1F1F1F] flex flex-col bg-[#0A0A0A] ${(selectedUser || activeTab === 'INVITE') ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 space-y-4">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search personnel..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#141414] border border-[#1F1F1F] rounded-lg text-xs text-white placeholder-zinc-550 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              {isSuperAdmin && (
                <button
                  onClick={() => {
                    setActiveTab(activeTab === 'INVITE' ? 'DIRECTORY' : 'INVITE');
                    setSelectedUid(null);
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  {activeTab === 'INVITE' ? <X size={14} /> : <UserIcon size={14} />}
                  {activeTab === 'INVITE' ? 'Cancel' : 'Pre-Authorize Personnel'}
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-10">
                   <p className="text-xs text-zinc-600 font-mono">No personnel found.</p>
                </div>
              ) : (
                filteredUsers.map(user => (
                  <button
                    key={user.uid}
                    onClick={() => {
                      setSelectedUid(user.uid);
                      setActiveTab('DIRECTORY');
                    }}
                    className={`w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 ${
                      selectedUid === user.uid && activeTab !== 'INVITE'
                      ? 'bg-indigo-600/10 border border-indigo-500/20' 
                      : 'hover:bg-[#141414] border border-transparent'
                    } ${user.isDisabled ? 'opacity-50 grayscale' : ''}`}
                  >
                    <div className="relative">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-[#1F1F1F]" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#1C1C1C] flex items-center justify-center border border-[#1F1F1F]">
                          <UserIcon size={12} className="text-zinc-500" />
                        </div>
                      )}
                      {user.role === 'SUPER_ADMIN' && (
                        <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-lg shadow-amber-500/20">
                          <Crown size={6} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${selectedUid === user.uid ? 'text-indigo-400' : 'text-white'}`}>
                        {user.displayName || 'Unnamed User'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-zinc-500 font-mono truncate">{user.email}</span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className={`flex-1 overflow-y-auto bg-[#0C0C0C] ${(selectedUser || activeTab === 'INVITE') ? 'block' : 'hidden md:block'}`}>
            <AnimatePresence mode="wait">
              {activeTab === 'INVITE' ? (
                <motion.div
                  key="invite-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-8 max-w-2xl mx-auto"
                >
                  <div className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-6 sm:p-8 space-y-6">
                    <div className="flex items-start gap-4">
                      <button 
                        onClick={() => setActiveTab('DIRECTORY')} 
                        className="md:hidden p-2 bg-[#1A1A1A] text-zinc-400 rounded-lg shrink-0 border border-[#2A2A2A] mt-1"
                      >
                        <X size={18} />
                      </button>
                      <div className="space-y-2">
                         <h3 className="text-lg font-bold text-white flex items-center gap-2">
                           <ShieldAlert size={18} className="text-indigo-400" />
                           Pre-Authorize New Personnel
                         </h3>
                         <p className="text-xs text-zinc-500 font-mono leading-relaxed">
                           Create a provisional record for a team member before their first login. Once they sign in using this Google Account email, they will automatically inherit these authorization parameters.
                         </p>
                      </div>
                    </div>

                    <form onSubmit={handleAddPersonnel} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest font-mono">Google Account Email</label>
                        <input
                          required
                          type="email"
                          value={newUserEmail}
                          onChange={e => setNewUserEmail(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#0C0C0C] border border-[#1F1F1F] rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                          placeholder="personnel@provision.com"
                        />
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest font-mono">Display Name (Optional)</label>
                        <input
                          type="text"
                          value={newUserDisplayName}
                          onChange={e => setNewUserDisplayName(e.target.value)}
                          className="w-full px-4 py-2.5 bg-[#0C0C0C] border border-[#1F1F1F] rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                          placeholder="John Doe"
                        />
                      </div>

                      <div className="space-y-1.5 border-t border-[#1F1F1F] pt-4">
                        <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest font-mono">Initial Authorization Level</label>
                        <select
                          required
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                          className="w-full px-4 py-2.5 bg-[#0C0C0C] border border-[#1F1F1F] rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none appearance-none cursor-pointer"
                        >
                          <option value="DELIVERY">Delivery Scout (Field Operations)</option>
                          <option value="SUPPLIER">Provider (Supplier Partner)</option>
                          <option value="ADMIN">System Administrator</option>
                        </select>
                      </div>

                      <div className="pt-4 flex gap-3">
                        <button
                          type="submit"
                          disabled={processingUid === 'add_new'}
                          className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex justify-center items-center gap-2"
                        >
                          {processingUid === 'add_new' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                          Authorize Entry
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveTab('DIRECTORY')}
                          className="px-6 py-3 bg-[#1C1C1C] border border-[#2A2A2A] text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                        >
                          Discard
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              ) : selectedUser ? (
                <motion.div
                  key={selectedUser.uid}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8 space-y-8"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="flex items-center gap-4 sm:gap-6">
                      <button 
                        onClick={() => setSelectedUid(null)} 
                        className="md:hidden p-2 bg-[#1A1A1A] text-zinc-400 rounded-lg shrink-0 border border-[#2A2A2A]"
                      >
                        <X size={18} />
                      </button>
                      <div className="w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-3xl bg-[#141414] border border-[#1F1F1F] flex items-center justify-center overflow-hidden shadow-lg relative">
                        {selectedUser.photoURL ? (
                          <img src={selectedUser.photoURL} alt={selectedUser.displayName || ''} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <UserIcon size={40} className="text-zinc-600" />
                        )}
                        {selectedUser.isDisabled && (
                           <div className="absolute inset-0 bg-rose-500/20 flex items-center justify-center backdrop-blur-sm">
                             <Ban size={30} className="text-rose-500 drop-shadow-md" />
                           </div>
                        )}
                      </div>
                      <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                          {selectedUser.displayName || 'Unnamed Personnel'}
                          {selectedUser.role === 'SUPER_ADMIN' && <Crown size={20} className="text-amber-400" />}
                        </h2>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono bg-[#141414] px-2 py-1 rounded-md border border-[#1F1F1F]">
                            <Mail size={12} />
                            {selectedUser.email}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isSuperAdmin && currentUser.uid !== selectedUser.uid && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleToggleDisabled(selectedUser)}
                          disabled={processingUid === selectedUser.uid}
                          className={`px-4 py-2 border text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${
                            selectedUser.isDisabled 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white' 
                            : 'bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:bg-zinc-700'
                          }`}
                        >
                          {selectedUser.isDisabled ? <UserCheck size={14} /> : <Ban size={14} />}
                          {selectedUser.isDisabled ? 'Re-Enable Account' : 'Suspend Account'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(selectedUser)}
                          disabled={processingUid === selectedUser.uid}
                          className="px-4 py-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 size={14} /> Remove Personnel
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Role / Authorization Settings */}
                    <div className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-6 space-y-6 shadow-sm">
                      <div className="flex items-center gap-2">
                        <ShieldAlert size={16} className="text-indigo-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono">Authorization Level</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <select
                          disabled={processingUid === selectedUser.uid || (selectedUser.role === 'SUPER_ADMIN' && !isSuperAdmin) || selectedUser.isDisabled || (selectedUser.role === 'ADMIN' && !isSuperAdmin)}
                          value={selectedUser.role || ''}
                          onChange={(e) => handleUpdateRole(selectedUser, e.target.value as UserRole)}
                          className="w-full bg-[#0C0C0C] border border-[#1F1F1F] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors disabled:opacity-50 appearance-none cursor-pointer"
                        >
                          <option value="" disabled>Awaiting Role Assignment</option>
                          <option value="DELIVERY">Delivery Scout (Field Operations)</option>
                          <option value="SUPPLIER">Provider (Supplier Partner)</option>
                          {isSuperAdmin && <option value="ADMIN">System Administrator</option>}
                          {isSuperAdmin && <option value="SUPER_ADMIN">Super Administrator</option>}
                        </select>
                        <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                          Personnel requires authorization to access system nodes. Their Google authentication identity is inherently trusted but strictly isolated to assigned role parameters.
                        </p>
                      </div>
                    </div>

                    {/* Status Overview */}
                    <div className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-6 flex flex-col justify-between shadow-sm">
                      <div className="space-y-4">
                        <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
                          <CheckCircle2 size={14} className={selectedUser.isDisabled ? 'text-rose-500' : 'text-emerald-400'} />
                          Operational Status
                        </h4>
                        <div>
                          {selectedUser.isDisabled ? (
                            <p className="text-sm text-rose-400 font-mono leading-relaxed">
                              This personnel account is currently under suspension. All platform access and verification nodes are blocked.
                            </p>
                          ) : (
                            <p className="text-sm text-emerald-400/80 font-mono leading-relaxed">
                              Account active and secure. Validated via cryptographic handshake.
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-8 flex items-center justify-between pt-4 border-t border-[#1F1F1F]">
                        <div>
                          <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">System ID</p>
                          <p className="text-xs text-zinc-400 font-mono mt-1 blur-[2px] hover:blur-none transition-all">{selectedUser.uid}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Audit Logs (Filtered for this user) */}
                  <div className="bg-[#141414] border border-[#1F1F1F] rounded-2xl p-6 space-y-4">
                    <h4 className="text-xs font-bold text-white uppercase tracking-widest font-mono flex items-center gap-2">
                       <History size={16} className="text-indigo-400" />
                       Recent Activity Ledger
                    </h4>
                    
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                      {auditLogs.filter(log => log.details?.includes(selectedUser.uid) || log.actorName === selectedUser.displayName || log.actorName === selectedUser.email).length === 0 ? (
                        <p className="text-[10px] text-zinc-500 italic">No significant events recorded for this personnel in the current ledger window.</p>
                      ) : (
                        auditLogs.filter(log => log.details?.includes(selectedUser.uid) || log.actorName === selectedUser.displayName || log.actorName === selectedUser.email)
                        .slice(0, 5)
                        .map(log => (
                          <div key={log.id} className="flex items-start justify-between text-xs py-2 border-b border-[#1F1F1F]/50 last:border-0 hover:bg-[#1A1A1A] p-2 rounded transition-colors">
                             <div>
                               <span className="font-bold text-zinc-300">{log.action}</span>
                               <span className="text-zinc-500 ml-2">by {log.actorName}</span>
                             </div>
                             <span className="text-zinc-650 font-mono text-[10px]">{formatDate(log.timestamp)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center space-y-4 max-w-xs">
                    <div className="w-16 h-16 rounded-3xl bg-[#141414] border border-[#1F1F1F] flex items-center justify-center text-zinc-700 mx-auto">
                      <Shield size={32} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-400">Security Terminal</p>
                      <p className="text-[10px] text-zinc-600 font-mono mt-1">Select a personnel profile from the directory to review, authorize, or revoke access nodes.</p>
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
