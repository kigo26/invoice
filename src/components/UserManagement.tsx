import { useState, useEffect } from 'react';
import { AppUser } from '../types';
import { subscribeToUsers, updateUserAuthorization } from '../lib/db';
import { X, Shield, User as UserIcon, CheckCircle2, XCircle, Loader2, Search } from 'lucide-react';
import { motion } from 'motion/react';

interface UserManagementProps {
  onClose: () => void;
}

export default function UserManagement({ onClose }: UserManagementProps) {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [processingUid, setProcessingUid] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToUsers((data) => {
      setUsers(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleAuth = async (uid: string, currentStatus: boolean) => {
    setProcessingUid(uid);
    try {
      await updateUserAuthorization(uid, !currentStatus);
    } catch (error) {
      console.error('Failed to update user auth:', error);
    } finally {
      setProcessingUid(null);
    }
  };

  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      className="fixed inset-y-0 right-0 w-full max-w-xl bg-[#0C0C0C] border-l border-[#1F1F1F] shadow-2xl z-[60] flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-[#1F1F1F] flex items-center justify-between bg-[#0F0F0F]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Shield size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Authority Control</h2>
            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-tighter">Authorize suppliers & delivery scouts</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-[#1C1C1C] text-zinc-500 hover:text-white rounded-xl transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 bg-[#0A0A0A] border-b border-[#1F1F1F]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
          <input
            type="text"
            placeholder="FILTER PERSONNEL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#141414] border border-[#1F1F1F] rounded-lg py-2 pl-9 pr-4 text-xs font-mono text-zinc-300 focus:outline-none focus:border-indigo-500/50 transition-colors uppercase placeholder:text-zinc-700"
          />
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-[10px] font-mono text-zinc-500 uppercase">Synchronizing Personnel Ledger...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xs text-zinc-600 font-mono uppercase">No personnel found matching query</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div 
              key={user.uid}
              className="p-4 bg-[#141414] border border-[#1F1F1F] rounded-2xl flex items-center justify-between gap-4 group hover:border-[#2A2A2A] transition-all"
            >
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full border border-[#1F1F1F]" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#1C1C1C] flex items-center justify-center border border-[#1F1F1F]">
                    <UserIcon size={16} className="text-zinc-500" />
                  </div>
                )}
                <div>
                  <h3 className="text-xs font-bold text-white leading-none mb-1">{user.displayName || 'Unnamed User'}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 font-mono">{user.email}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                      user.role === 'ADMIN' ? 'text-indigo-400 border-indigo-400/20 bg-indigo-400/5' :
                      user.role === 'DELIVERY' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' :
                      'text-amber-400 border-amber-400/20 bg-amber-400/5'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleAuth(user.uid, !!user.isAuthorized)}
                  disabled={processingUid === user.uid}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50 ${
                    user.isAuthorized 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-rose-500/10 hover:border-rose-500/30 hover:text-rose-400 group/btn'
                      : 'bg-[#1C1C1C] border-[#2A2A2A] text-zinc-500 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400'
                  }`}
                >
                  {processingUid === user.uid ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : user.isAuthorized ? (
                    <>
                      <CheckCircle2 size={12} className="group-hover/btn:hidden" />
                      <XCircle size={12} className="hidden group-hover/btn:block text-rose-400" />
                      <span className="group-hover/btn:hidden">Authorized</span>
                      <span className="hidden group-hover/btn:block text-rose-400">Revoke</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={12} />
                      <span>Authorize</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[#1F1F1F] bg-[#0F0F0F]">
        <p className="text-[10px] text-zinc-600 font-mono text-center uppercase leading-tight">
          System Guard: Revoking authority will immediately restrict personnel from accessing synced ledger nodes.
        </p>
      </div>
    </motion.div>
  );
}
