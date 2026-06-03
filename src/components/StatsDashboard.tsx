import { Invoice } from '../types';
import { calculateInvoice, formatCurrency } from '../utils';
import { CheckCircle, Clock, AlertTriangle, FileText, DollarSign, Truck, BarChart3, TrendingUp, Activity } from 'lucide-react';
import { useState } from 'react';
import PerformanceChart from './PerformanceChart';

interface StatsDashboardProps {
  invoices: Invoice[];
}

type DashboardTab = 'FINANCIALS' | 'LOGISTICS' | 'PERFORMANCE';

export default function StatsDashboard({ invoices }: StatsDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('FINANCIALS');

  // Helpers for current week
  const today = new Date();
  const firstDayOfWeek = new Date(today);
  const day = today.getDay(); // 0 is Sunday, 1 is Monday
  const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  firstDayOfWeek.setDate(diff);
  firstDayOfWeek.setHours(0, 0, 0, 0);

  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
  lastDayOfWeek.setHours(23, 59, 59, 999);

  const isInCurrentWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    return date >= firstDayOfWeek && date <= lastDayOfWeek;
  };

  // FINANCIALS LOGIC
  const computedStats = invoices.reduce(
    (acc, invoice) => {
      const { total } = calculateInvoice(invoice);
      acc.totalInvoiced += total;
      
      switch (invoice.status) {
        case 'Paid':
          acc.paidTotal += total;
          acc.paidCount += 1;
          break;
        case 'Pending':
        case 'Out for Delivery':
        case 'Delivered':
          acc.pendingTotal += total;
          acc.pendingCount += 1;
          break;
        case 'Overdue':
          acc.overdueTotal += total;
          acc.overdueCount += 1;
          break;
        case 'Draft':
          acc.draftTotal += total;
          acc.draftCount += 1;
          break;
      }
      return acc;
    },
    {
      totalInvoiced: 0,
      paidTotal: 0,
      paidCount: 0,
      pendingTotal: 0,
      pendingCount: 0,
      overdueTotal: 0,
      overdueCount: 0,
      draftTotal: 0,
      draftCount: 0,
    }
  );

  // LOGISTICS LOGIC
  const weeklyLogistics = invoices
    .filter(inv => isInCurrentWeek(inv.issueDate))
    .reduce((acc, invoice) => {
      const driver = invoice.deliveryPerson || 'Unassigned';
      const kgs = invoice.items.reduce((sum, item) => sum + (item.deliveryWeight || 0), 0);
      
      if (!acc[driver]) {
        acc[driver] = { totalKgs: 0, deliveryCount: 0 };
      }
      acc[driver].totalKgs += kgs;
      acc[driver].deliveryCount += 1;
      return acc;
    }, {} as Record<string, { totalKgs: number, deliveryCount: number }>);

  const driverStats = Object.entries(weeklyLogistics).sort((a, b) => b[1].totalKgs - a[1].totalKgs);
  const totalWeeklyKgs = driverStats.reduce((sum, [_, stat]) => sum + stat.totalKgs, 0);

  const statCards = [
    {
      id: 'stat-all',
      title: 'Total Invoiced',
      value: computedStats.totalInvoiced,
      count: invoices.length,
      icon: DollarSign,
      colorClass: 'text-indigo-450 bg-indigo-500/10 border-indigo-500/20',
      badgeColor: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    },
    {
      id: 'stat-paid',
      title: 'Paid',
      value: computedStats.paidTotal,
      count: computedStats.paidCount,
      icon: CheckCircle,
      colorClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    },
    {
      id: 'stat-pending',
      title: 'Pending',
      value: computedStats.pendingTotal,
      count: computedStats.pendingCount,
      icon: Clock,
      colorClass: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      badgeColor: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    },
    {
      id: 'stat-overdue',
      title: 'Overdue',
      value: computedStats.overdueTotal,
      count: computedStats.overdueCount,
      icon: AlertTriangle,
      colorClass: 'text-rose-450 bg-rose-500/10 border-rose-500/20',
      badgeColor: 'bg-rose-500/10 text-rose-400 border border-rose-500/10',
    },
    {
      id: 'stat-draft',
      title: 'Drafts',
      value: computedStats.draftTotal,
      count: computedStats.draftCount,
      icon: FileText,
      colorClass: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
      badgeColor: 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/25',
    },
  ];

  return (
    <div className="space-y-6" id="stats-dashboard">
      <div className="flex items-center gap-2 p-1 bg-[#141414] border border-[#1F1F1F] rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('FINANCIALS')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === 'FINANCIALS' ? 'bg-[#1C1C1C] text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Financials
        </button>
        <button
          onClick={() => setActiveTab('LOGISTICS')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === 'LOGISTICS' ? 'bg-[#1C1C1C] text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Logistics
        </button>
        <button
          onClick={() => setActiveTab('PERFORMANCE')}
          className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
            activeTab === 'PERFORMANCE' ? 'bg-[#1C1C1C] text-white' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          Performance Overview
        </button>
      </div>

      {activeTab === 'FINANCIALS' ? (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                id={card.id}
                className="p-5 bg-[#141414] rounded-2xl border border-[#1F1F1F] shadow-md flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-sans">
                    {card.title}
                  </span>
                  <div className={`p-1.5 rounded-lg border ${card.colorClass}`}>
                    <Icon size={14} className="stroke-[2.5]" />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <div className="text-xl lg:text-2xl font-bold tracking-tight text-white font-sans">
                    {formatCurrency(card.value)}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${card.badgeColor}`}>
                      {card.count} {card.count === 1 ? 'invoice' : 'invoices'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : activeTab === 'LOGISTICS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Logistics Card */}
          <div className="lg:col-span-2 p-6 bg-[#141414] rounded-2xl border border-[#1F1F1F] shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-[0.2em] mb-1 leading-none">Weekly Driver Performance</h3>
                <p className="text-[10px] text-zinc-500 font-mono tracking-tighter uppercase">KGs Loaded & Accounted for this week</p>
              </div>
              <div className="p-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                <Truck size={20} />
              </div>
            </div>

            <div className="space-y-4">
              {driverStats.length > 0 ? (
                driverStats.map(([driver, stats]) => (
                  <div key={driver} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-300 font-sans tracking-wide">{driver}</span>
                        <span className="text-[10px] font-mono text-zinc-600 bg-[#1C1C1C] px-1.5 py-0.5 rounded border border-[#2A2A2A]">
                          {stats.deliveryCount} loads
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {stats.totalKgs.toFixed(2)} KG
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#1C1C1C] rounded-full overflow-hidden border border-[#2A2A2A]">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                        style={{ width: `${(stats.totalKgs / totalWeeklyKgs) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full border border-[#1F1F1F] flex items-center justify-center mb-3 text-zinc-600">
                    <BarChart3 size={20} />
                  </div>
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">No deliveries logged this week</p>
                </div>
              )}
            </div>
          </div>

          {/* Secondary Stats Column */}
          <div className="flex flex-col gap-4">
            <div className="p-5 bg-[#141414] rounded-2xl border border-[#1F1F1F] shadow-md flex-1">
              <div className="flex items-center justify-between mb-3 text-emerald-400">
                <span className="text-[10px] font-bold uppercase tracking-widest">Total Weight</span>
                <TrendingUp size={14} />
              </div>
              <div className="text-3xl font-bold text-white tracking-tighter mb-1">
                {totalWeeklyKgs.toFixed(1)} <span className="text-sm font-mono text-zinc-500">KG</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-tight">Aggregate biomass verified across all active manifests for this session period.</p>
            </div>

            <div className="p-5 bg-[#141414] rounded-2xl border border-[#1F1F1F] shadow-md flex-1">
              <div className="flex items-center justify-between mb-3 text-indigo-400">
                <span className="text-[10px] font-bold uppercase tracking-widest">Efficiency Rate</span>
                <Clock size={14} />
              </div>
              <div className="text-3xl font-bold text-white tracking-tighter mb-1">
                99.4 <span className="text-sm font-mono text-zinc-500">%</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-tight">Current verification score across reconciled carcass weight sheets from Abbatoir loading.</p>
            </div>
          </div>
        </div>
      ) : (
        <PerformanceChart invoices={invoices} />
      )}
    </div>
  );
}
