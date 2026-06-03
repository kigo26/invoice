import { useState, useEffect } from 'react';
import { AppUser, AuditLog, UserRole } from '../types';
import { subscribeToUsers, subscribeToAuditLogs, updateUserAccountStatus, updateUserRole } from '../lib/db';
import { X, Shield, User as UserIcon, CheckCircle2, XCircle, Loader2, Search, History, Crown, Ban, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDate } from '../utils';

interface UserManagementProps {
  onClose: () => void;
  currentUser: AppUser;
}

type TabType = 'PERSONNEL' | 'AUDIT_LOGS';

export default function UserManagement({ onClose, currentUser }: UserManagementProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('PERSONNEL');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingUid, setProcessingUid] = useState<string | null>(null);

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

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN' || ['liliprovisions@gmail.com', 'jamenya1988@gmail.com', 'skigo5917@gmail.com'].includes(currentUser.email || '');

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

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => {
    // Hierarchy sorting
    const order: Record<UserRole, number> = { 'SUPER_ADMIN': 0, 'ADMIN': 1, 'SUPPLIER': 2, 'DELIVERY': 3 };
    return (order[a.role || 'DELIVERY'] || 99) - (order[b.role || 'DELIVERY'] || 99);
  });

  const filteredLogs = auditLogs.filter(log =>
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-y-0 right-0 w-full max-w-2xl bg-[#0C0C0C] border-l border-[#1F1F1F] shadow-2xl z-[60] flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-[#1F1F1F] flex items-center justify-between bg-[#0F0F0F]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Security Hub</h2>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-tighter">
              {isSuperAdmin ? 'Super Administrative Privilege Active' : 'System Administration Ledger'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-[#1C1C1C] text-zinc-500 hover:text-white rounded-xl transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#0A0A0A] border-b border-[#1F1F1F]">
        <button
          onClick={() => setActiveTab('PERSONNEL')}
          className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${
            activeTab === 'PERSONNEL' ? 'text-indigo-400 border-indigo-500 bg-indigo-500/5' : 'text-zinc-600 border-transparent hover:text-zinc-400'
          }`}
        >
          Personnel Control
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('AUDIT_LOGS')}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-all border-b-2 ${
              activeTab === 'AUDIT_LOGS' ? 'text-indigo-400 border-indigo-500 bg-indigo-500/5' : 'text-zinc-600 border-transparent hover:text-zinc-400'
            }`}
          >
            Audit Ledger
          </button>
        )}
      </div>

      {/* Search */}
      <div className="p-4 bg-[#0A0A0A] border-b border-[#1F1F1F]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
          <input
            type="text"
            placeholder={activeTab === 'PERSONNEL' ? "FILTER PERSONNEL..." : "SEARCH AUDIT EVENTS..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141414] border border-[#1F1F1F] rounded-lg py-2 pl-9 pr-4 text-xs font-mono text-zinc-300 focus:outline-none focus:border-indigo-500/50 transition-colors uppercase placeholder:text-zinc-700"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-[10px] font-mono text-zinc-500 uppercase">Synchronizing Security Core...</p>
          </div>
        ) : activeTab === 'PERSONNEL' ? (
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-xs text-zinc-600 font-mono uppercase">No personnel records found</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div 
                  key={user.uid}
                  className={`p-4 bg-[#141414] border border-[#1F1F1F] rounded-2xl flex items-center justify-between gap-4 group transition-all ${user.isDisabled ? 'opacity-60 grayscale' : 'hover:border-[#2A2A2A]'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border border-[#1F1F1F]" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#1C1C1C] flex items-center justify-center border border-[#1F1F1F]">
                          <UserIcon size={16} className="text-zinc-500" />
                        </div>
                      )}
                      {user.role === 'SUPER_ADMIN' && (
                        <div className="absolute -top-1 -right-1 bg-amber-500 text-white rounded-full p-0.5 shadow-lg shadow-amber-500/20">
                          <Crown size={8} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white leading-none mb-1 flex items-center gap-2">
                        {user.displayName || 'Unnamed User'}
                        {user.isDisabled && <span className="bg-rose-500/20 text-rose-400 text-[8px] px-1 rounded uppercase">Disabled</span>}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-mono">{user.email}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Role Control */}
                    <select
                      disabled={processingUid === user.uid || (user.role === 'SUPER_ADMIN' && !isSuperAdmin) || user.isDisabled || (user.role === 'ADMIN' && !isSuperAdmin)}
                      value={user.role || ''}
                      onChange={(e) => handleUpdateRole(user, e.target.value as UserRole)}
                      className="bg-[#0C0C0C] border border-[#1F1F1F] rounded px-2 py-1 text-[10px] font-mono text-zinc-400 focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                    >
                      <option value="" disabled>Awaiting Role Assignment</option>
                      <option value="DELIVERY">Scout (Delivery)</option>
                      <option value="SUPPLIER">Provider (Supplier)</option>
                      {isSuperAdmin && <option value="ADMIN">System Admin</option>}
                      {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
                    </select>

                    {/* Disable Toggle (Only Super Admin can disable accounts) */}
                    {isSuperAdmin && (
                      <button
                        onClick={() => handleToggleDisabled(user)}
                        disabled={processingUid === user.uid || user.uid === currentUser.uid}
                        className={`p-2 rounded-lg border transition-all cursor-pointer disabled:opacity-50 ${
                          user.isDisabled 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                        }`}
                        title={user.isDisabled ? "Enable User" : "Disable User"}
                      >
                        {processingUid === user.uid ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : user.isDisabled ? (
                          <UserCheck size={12} />
                        ) : (
                          <Ban size={12} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-3 bg-[#0A0A0A] border border-[#1F1F1F] rounded-xl space-y-2">
                <div className="flex items-center justify-between text-[9px] font-mono">
                  <span className="text-zinc-650">{formatDate(log.timestamp)}</span>
                  <span className={`px-1.5 py-0.5 rounded ${
                    log.action.includes('ENABLED') ? 'text-emerald-400 bg-emerald-400/5' :
                    log.action.includes('DISABLED') ? 'text-rose-400 bg-rose-400/5' :
                    'text-indigo-400 bg-indigo-500/5'
                  }`}>
                    {log.action}
                  </span>
                </div>
                <p className="text-xs text-white flex items-center gap-2">
                  <span className="text-zinc-500">By:</span>
                  <span className="font-bold">{log.actorName}</span>
                </p>
                {log.details && (
                  <p className="text-[10px] text-zinc-500 italic bg-[#141414] p-2 rounded border border-[#1F1F1F]">
                    {log.details}
                  </p>
                )}
              </div>
            ))}
            {filteredLogs.length === 0 && (
              <div className="text-center py-20">
                <History className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                <p className="text-xs text-zinc-600 font-mono uppercase">Audit ledger is empty</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#1F1F1F] bg-[#0F0F0F]">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-tight">
            Node Protection: Active {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[9px] text-zinc-500 font-mono uppercase">Encrypted</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
