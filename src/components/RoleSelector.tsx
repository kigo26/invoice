import { motion } from 'motion/react';
import { UserRole } from '../types';
import { Shield, Truck, Factory } from 'lucide-react';

interface RoleSelectorProps {
  onSelect: (role: UserRole) => void;
  isProcessing: boolean;
}

export default function RoleSelector({ onSelect, isProcessing }: RoleSelectorProps) {
  const roles: { role: UserRole; title: string; description: string; icon: any; color: string }[] = [
    {
      role: 'ADMIN',
      title: 'Administrator',
      description: 'Full access to create, edit, manage invoices and financial datasets.',
      icon: Shield,
      color: 'bg-indigo-500',
    },
    {
      role: 'DELIVERY',
      title: 'Delivery Personnel',
      description: 'Fill delivery weights and notes via automated Google Sheets.',
      icon: Truck,
      color: 'bg-emerald-500',
    },
    {
      role: 'SUPPLIER',
      title: 'Supplier (Slaughterhouse)',
      description: 'Log initial supply weights and quality notes at source.',
      icon: Factory,
      color: 'bg-amber-500',
    }
  ];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#141414] border border-[#1F1F1F] rounded-2xl shadow-2xl max-w-3xl w-full p-8"
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2 italic">Select Your Operational Role</h2>
          <p className="text-zinc-400 text-sm">Please identify your duty to proceed with restricted ledger access.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((item) => (
            <button
              key={item.role}
              onClick={() => onSelect(item.role)}
              disabled={isProcessing}
              className="group flex flex-col items-center p-6 bg-[#0C0C0C] border border-[#1F1F1F] rounded-xl hover:border-indigo-500/50 transition-all cursor-pointer text-left disabled:opacity-50"
            >
              <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <item.icon size={22} className="text-white" />
              </div>
              <h3 className="text-sm font-bold text-white mb-2 uppercase tracking-widest font-mono">{item.title}</h3>
              <p className="text-[10px] text-zinc-500 leading-relaxed text-center italic">{item.description}</p>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
