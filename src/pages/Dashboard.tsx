import React from 'react';
import { 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  Wallet, 
  ArrowUpRight, 
  Clock,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, formatPercent, cn } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { EmptyState } from '../components/EmptyState';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const Dashboard = () => {
  const { getCampaignsWithStats, users, spendEntries, campaigns: allCampaigns, currentUser } = useStore();
  const campaigns = getCampaignsWithStats();
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === 'Admin';

  const totalBudget = campaigns.reduce((sum, c) => sum + c.totalBudget, 0);
  const totalSpent = campaigns.reduce((sum, c) => sum + c.totalSpent, 0);
  const totalRemaining = totalBudget - totalSpent;
  
  const lowBudgetCampaigns = campaigns.filter(c => (c.remainingBalance / c.totalBudget) < 0.2 && c.status === 'Active');
  const endingToday = campaigns.filter(c => c.remainingDays === 0 && c.status === 'Active');
  const rechargeNeeded = campaigns.filter(c => c.status === 'Recharge Needed' || c.topupRequired);

  const stats = [
    { label: 'Live Ads', value: campaigns.filter(c => c.status === 'Active').length, icon: TrendingUp, color: 'bg-brand-navy' },
    { label: 'Total Budget', value: formatCurrency(totalBudget), icon: Wallet, color: 'bg-brand-green' },
    { label: 'Money Spent', value: formatCurrency(totalSpent), icon: TrendingUp, color: 'bg-slate-700' },
    { label: 'Balance Left', value: formatCurrency(totalRemaining), icon: ArrowUpRight, color: 'bg-brand-green/70' },
  ];

  const alerts = [
    { label: 'Low Budget', count: lowBudgetCampaigns.length, color: 'text-amber-600', icon: AlertCircle },
    { label: 'Ending Today', count: endingToday.length, color: 'text-rose-600', icon: Clock },
    { label: 'Recharge Needed', count: rechargeNeeded.length, color: 'text-orange-600', icon: Calendar },
  ];

  const chartData = campaigns.slice(0, 5).map(c => ({
    name: c.campaignName.substring(0, 15),
    spent: c.totalSpent,
    budget: c.totalBudget,
  }));

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-brand-navy tracking-tighter italic uppercase">Budget Control</h1>
          <p className="text-slate-500 mt-1 font-black uppercase tracking-[0.2em] text-[10px]">Agency Dashboard</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/campaigns')}
            className="neo-btn-primary h-12 px-6 shadow-xl shadow-brand-green/20"
          >
            <Plus className="w-4 h-4" />
            Launch New
          </button>
          <div className="hidden lg:flex gap-3 bg-white p-5 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Spending Progress</p>
              <p className="text-2xl font-black text-brand-navy leading-none">
                {totalBudget > 0 ? formatPercent((totalSpent / totalBudget) * 100) : '0.0%'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - 2x2 on Mobile, 4x1 on Desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
        {stats.map((stat, i) => (
          <motion.div 
            key={i} 
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            className="neo-card p-5 lg:p-9 flex flex-col justify-between group border-t border-white/80"
          >
            <div className={cn("w-10 lg:w-16 h-10 lg:h-16 rounded-2xl lg:rounded-[1.5rem] text-white flex items-center justify-center shadow-lg lg:shadow-2xl mb-4 lg:mb-10 group-hover:rotate-6 transition-transform duration-500", stat.color)}>
              <stat.icon className="w-5 lg:w-7 h-5 lg:h-7" />
            </div>
            <div>
              <p className="text-[8px] lg:text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{stat.label}</p>
              <h3 className="text-xl lg:text-4xl font-black text-brand-navy tracking-tighter italic uppercase leading-none font-mono-numbers">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Outstanding Payments Section */}
      {campaigns.filter(c => c.paymentStatus === 'Pending').length > 0 && (
        <div className="neo-card p-8 border-l-8 border-rose-500 bg-rose-50/20 animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
              <h3 className="text-lg font-black text-rose-600 uppercase italic tracking-tighter">Payments Due</h3>
            </div>
            {useStore.getState().currentUser?.role === 'Admin' && (
              <span className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Verify receipts to activate budget</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.filter(c => c.paymentStatus === 'Pending').map(c => (
              <div key={c.id} className="p-4 bg-white rounded-2xl border border-rose-100 flex justify-between items-center shadow-sm group">
                <div>
                  <p className="text-[10px] font-black text-brand-navy uppercase">{c.brandName}</p>
                  <p className="text-[8px] font-bold text-slate-400 mt-0.5">{c.platform} Ads</p>
                </div>
                <div className="text-right flex items-center gap-4">
                  <p className="text-sm font-black text-rose-600">{formatCurrency(c.totalBudget)}</p>
                  {useStore.getState().currentUser?.role === 'Admin' && (
                    <button 
                      onClick={() => {
                        const adminName = useStore.getState().currentUser?.name || 'Admin';
                        useStore.getState().updateCampaign(c.id, { paymentStatus: 'Paid', adminAcknowledged: true });
                        // Add a log entry for the confirmation
                        useStore.getState().addSpendEntry({
                          campaignId: c.id,
                          amount: 0,
                          date: new Date().toISOString().split('T')[0],
                          enteredBy: adminName,
                          note: `✅ RECEIPT CONFIRMED BY ADMIN: ${adminName}`
                        });
                        useStore.getState().addToast(`${c.brandName} payment confirmed.`, 'success');
                      }}
                      className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-all opacity-0 group-hover:opacity-100"
                      title="Confirm Receipt"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 neo-card p-10">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-xl font-black text-brand-navy tracking-tighter italic uppercase underline underline-offset-8 decoration-brand-green">Budget vs Spend</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-100" />
                <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Total Budget</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-brand-green" />
                <span className="text-[8px] font-black uppercase text-brand-green tracking-widest">Actual Spend</span>
              </div>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barGap={-40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#cbd5e1', fontSize: 9, fontWeight: 900}} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#cbd5e1', fontSize: 9, fontWeight: 900}} 
                />
                <Tooltip 
                  cursor={{fill: 'transparent'}}
                  contentStyle={{
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 30px 60px rgba(0,0,0,0.1)',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    fontSize: '10px'
                  }}
                />
                <Bar dataKey="budget" fill="#f1f5f9" radius={[12, 12, 0, 0]} name="Budget" barSize={40} opacity={0.5} />
                <Bar dataKey="spent" fill="#788023" radius={[12, 12, 0, 0]} name="Spend" barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="neo-card p-8 flex flex-col bg-slate-50/50">
          <h3 className="text-xl font-black text-brand-navy mb-8 tracking-tighter italic uppercase">Alerts</h3>
          <div className="space-y-6 flex-1">
            {alerts.map((alert, i) => (
              <div key={i} className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-white shadow-md shadow-slate-200/50">
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", alert.color.replace('text', 'bg') + '/10')}>
                    <alert.icon className={cn("w-5 h-5", alert.color)} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{alert.label}</span>
                </div>
                <span className={cn("text-2xl font-black italic", alert.count > 0 ? alert.color : "text-slate-100")}>
                  {alert.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="neo-card p-10">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-3 h-3 rounded-full bg-brand-green animate-ping" />
          <h3 className="text-2xl font-black text-brand-navy italic tracking-tighter uppercase">Recent Updates</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[400px] overflow-y-auto pr-6 custom-scrollbar">
          {[...spendEntries]
            .sort((a, b) => b.id.localeCompare(a.id))
            .slice(0, 12)
            .map((entry, i) => {
              const u = users.find(usr => usr.name === entry.enteredBy);
              const campaign = allCampaigns.find(c => c.id === entry.campaignId);
              return (
                <div key={i} className="flex items-center justify-between p-6 bg-white rounded-3xl border border-slate-50 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-transform">
                  <div 
                    className="absolute top-0 left-0 w-1.5 h-full" 
                    style={{ backgroundColor: u?.color || '#788023' }} 
                  />
                  <div className="flex items-center gap-5">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center font-black text-brand-navy text-xs border border-slate-100 shadow-inner">
                      {entry.enteredBy.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {entry.enteredBy} <span className="opacity-50">updated</span>
                        {entry.revisions && entry.revisions.length > 0 && (
                          <span className="text-rose-500 ml-2 font-black italic underline decoration-rose-200">
                            REVISED BY {entry.revisions[entry.revisions.length - 1].updatedBy}
                          </span>
                        )}
                      </p>
                      <p className="text-sm font-black text-brand-navy uppercase italic tracking-tighter mt-1">
                        {campaign?.campaignName || 'Campaign'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-brand-navy">{formatCurrency(entry.amount)}</p>
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-tighter">{new Date(entry.date).toLocaleDateString()}</p>
                  </div>
                </div>
              );
            })}
          {spendEntries.length === 0 && (
            <div className="col-span-2">
              <EmptyState 
                icon={<TrendingUp className="w-8 h-8" />}
                title="No Updates Yet"
                description="Spend entries will appear here as your team updates campaigns."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};