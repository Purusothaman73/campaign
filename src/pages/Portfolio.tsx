import { useStore } from '../store/useStore';
import { formatCurrency, cn } from '../lib/utils';
import { 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Award, Briefcase, TrendingUp, Globe } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export const Portfolio = () => {
  const { getCampaignsWithStats, spendEntries, users } = useStore();
  const campaigns = getCampaignsWithStats();
  
  const totalLeads = spendEntries.reduce((sum, s) => sum + (s.metrics?.leads || 0), 0);
  const cumulativeSpent = spendEntries.reduce((sum, s) => sum + s.amount, 0);
  
  const clients = Array.from(new Set(campaigns.map(c => c.clientName)));
  const brands = Array.from(new Set(campaigns.map(c => c.brandName)));
  const locations = Array.from(new Set(users.map(u => u.location).filter(Boolean)));

  const PLATFORM_CONFIG: Record<string, { name: string; color: string }> = {
    Meta: { name: 'Meta Ads', color: '#4f46e5' },
    Google: { name: 'Google Ads', color: '#788023' },
    YouTube: { name: 'YouTube Ads', color: '#ff0000' },
    LinkedIn: { name: 'LinkedIn Ads', color: '#0077B5' },
    WhatsApp: { name: 'WhatsApp Ads', color: '#25d366' },
  };

  const platformsFound = Array.from(new Set(campaigns.map(c => c.platform)));
  
  const platformData = platformsFound.map(p => ({
    name: PLATFORM_CONFIG[p]?.name || p,
    value: campaigns.filter(c => c.platform === p).length,
    color: PLATFORM_CONFIG[p]?.color || '#94a3b8'
  })).filter(d => d.value > 0);

  const highlights = [
    { label: 'Total Clients', value: clients.length, icon: Briefcase, color: 'text-indigo-600' },
    { label: 'Total Ad Spend', value: formatCurrency(cumulativeSpent), icon: TrendingUp, color: 'text-slate-800' },
    { label: 'Total Conversions', value: totalLeads, icon: Award, color: 'text-rose-600' },
    { label: 'Office Locations', value: `${locations.length} Offices`, icon: Globe, color: 'text-brand-green' },
  ];

  return (
    <div className="space-y-5 pb-16 min-w-0 w-full">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 shrink-0 rounded-2xl bg-brand-navy flex items-center justify-center text-white shadow-lg">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-black text-brand-navy italic tracking-tighter uppercase">Performance</h1>
          <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[9px] mt-0.5">Campaign Portfolio Summary</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {highlights.map((h, i) => (
          <div key={i} className="neo-card p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className={cn("w-9 h-9 shrink-0 bg-slate-50 rounded-xl flex items-center justify-center shadow-inner", h.color)}>
                <h.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{h.label}</p>
                <h3 className="text-base sm:text-lg font-black text-brand-navy tracking-tighter uppercase italic truncate">{h.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="neo-card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award className="text-brand-green w-4 h-4 shrink-0" />
            <h3 className="text-sm font-black text-brand-navy italic tracking-tighter uppercase">Our Brands</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {brands.map((brand, i) => (
              <span key={i} className="px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 text-[10px] font-black text-brand-navy uppercase tracking-widest">
                {brand}
              </span>
            ))}
            {brands.length === 0 && (
              <EmptyState 
                icon={<Award className="w-6 h-6" />}
                title="No Brands Yet"
                description="Your managed brands will appear here."
              />
            )}
          </div>
        </div>

        <div className="neo-card p-4 sm:p-5">
          <h3 className="text-sm font-black text-brand-navy italic tracking-tighter uppercase mb-4">Platform Split</h3>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-2/5 h-[140px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={platformData}
                    innerRadius={42}
                    outerRadius={58}
                    paddingAngle={6}
                    dataKey="value"
                  >
                    {platformData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:flex-1 space-y-2">
              {platformData.map((p, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-[9px] font-black text-brand-navy uppercase tracking-widest truncate">{p.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400 shrink-0 ml-2">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
