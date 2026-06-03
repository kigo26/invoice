import { Receipt, Shield, Truck, Factory } from 'lucide-react';
import { motion } from 'motion/react';
import { UserRole } from '../types';

interface LoginScreenProps {
  onLogin: () => void;
  isLoggingIn: boolean;
  onRolePreselect: (role: UserRole) => void;
  preselectedRole: UserRole;
}

export default function LoginScreen({ onLogin, isLoggingIn, onRolePreselect, preselectedRole }: LoginScreenProps) {
  const roles: { id: UserRole; label: string; color: string; icon: any }[] = [
    { id: 'ADMIN', label: 'Admin', color: 'bg-indigo-500', icon: Shield },
    { id: 'DELIVERY', label: 'Delivery', color: 'bg-emerald-500', icon: Truck },
    { id: 'SUPPLIER', label: 'Supplier', color: 'bg-amber-500', icon: Factory },
  ];
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full"></div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-md w-full"
      >
        <div className="bg-[#141414] border border-[#1F1F1F] rounded-3xl p-10 shadow-2xl relative z-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/20 mx-auto mb-8">
            <Receipt size={32} className="stroke-[2.5]" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">Liliprovisions Ltd Ledger Secure Access</h1>
          <p className="text-zinc-500 text-sm mb-10 leading-relaxed italic">
            "Every gram of meat accounted for. Every credit verified."
          </p>

          <div className="space-y-3">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Select Authorized Role to Sign In</p>
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => {
                  onRolePreselect(role.id);
                  onLogin();
                }}
                disabled={isLoggingIn}
                className="w-full group relative flex items-center p-4 rounded-2xl bg-[#1C1C1C]/50 border border-[#1F1F1F] hover:bg-[#222222] hover:border-indigo-500/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <div className={`w-12 h-12 rounded-xl ${role.color} flex items-center justify-center mr-4 shadow-lg shadow-${role.id === 'ADMIN' ? 'indigo' : role.id === 'DELIVERY' ? 'emerald' : 'amber'}-500/20`}>
                  <role.icon size={24} className="text-white" />
                </div>
                <div className="text-left flex-1">
                  <span className="block text-xs font-bold text-white uppercase tracking-[0.2em]">{role.label}</span>
                  <span className="text-[10px] text-zinc-500 font-medium">Click to Sign in with Google</span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity pr-2">
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <p className="mt-6 text-center text-[10px] text-zinc-600 font-mono tracking-tighter uppercase">
          Authorized personnel only • Ledger Chain Protocol v4.0.2
        </p>
      </motion.div>
    </div>
  );
}
