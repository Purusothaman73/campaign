import { useStore } from '../store/useStore';
import { formatCurrency } from '../lib/utils';
import { Calendar, Download, Target, MousePointer2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { EmptyState } from '../components/EmptyState';

export const HistoryPage = () => {
  const { spendEntries, campaigns, users } = useStore();
  
  const entriesWithDetails = spendEntries.map(entry => {
    const campaign = campaigns.find(c => c.id === entry.campaignId);
    const user = users.find(u => u.name === entry.enteredBy);
    return {
      ...entry,
      campaignName: campaign?.campaignName || 'Unknown Campaign',
      brandName: campaign?.brandName || 'Unknown Brand',
      platform: campaign?.platform || 'Unknown',
      userColor: user?.color || '#cbd5e1'
    };
  }).sort((a, b) => b.id.localeCompare(a.id));

  const exportHistory = () => {
    const data = entriesWithDetails.map(entry => ({
      'Date': new Date(entry.date).toLocaleDateString('en-IN'),
      'Campaign': entry.campaignName,
      'Brand': entry.brandName,
      'Platform': entry.platform,
      'Amount': entry.amount,
      'Entered By': entry.enteredBy,
      'Note': entry.note || '',
      'Ref ID': entry.id,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Spend History');
    XLSX.writeFile(wb, `Yugam_SpendHistory_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-brand-navy italic tracking-tighter uppercase">Spend History</h1>
          <p className="text-slate-500 font-medium text-sm">All spend entries across every campaign.</p>
        </div>
        <button onClick={exportHistory} className="neo-btn-secondary h-11 px-6 w-full sm:w-auto justify-center">
          <Download className="w-4 h-4" />
          Export History
        </button>
      </div>

      {/* Desktop table */}
      <div className="neo-card overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[720px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 xl:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Date</th>
                <th className="px-4 xl:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Campaign / Brand</th>
                <th className="px-4 xl:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Team Member</th>
                <th className="px-4 xl:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {entriesWithDetails.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState 
                      icon={<Calendar className="w-8 h-8" />}
                      title="No Entries Yet"
                      description="All spend entries will be recorded here as campaigns are updated."
                    />
                  </td>
                </tr>
              ) : (
                entriesWithDetails.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 xl:px-8 py-6">
                      <div className="flex items-center gap-3 text-slate-400">
                        <Calendar className="w-4 h-4 opacity-30 shrink-0" />
                        <div className="space-y-0.5">
                          <span className="text-xs font-black text-slate-600 block">{new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Ref: {entry.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 xl:px-8 py-6">
                      <p className="font-black text-brand-navy uppercase tracking-tight">{entry.campaignName}</p>
                      <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-0.5">{entry.brandName} • {entry.platform}</p>
                    </td>
                    <td className="px-4 xl:px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-white text-[10px] shrink-0" style={{ backgroundColor: entry.userColor }}>
                          {entry.enteredBy.charAt(0)}
                        </div>
                        <span className="text-xs font-black italic uppercase tracking-tighter" style={{ color: entry.userColor }}>{entry.enteredBy}</span>
                      </div>
                    </td>
                    <td className="px-4 xl:px-8 py-6 text-right">
                      <div className="space-y-1">
                        <p className="text-sm font-black text-brand-navy">{formatCurrency(entry.amount)}</p>
                        {entry.metrics && (
                          <div className="flex items-center justify-end gap-3 opacity-60">
                            {entry.metrics.leads && (
                              <div className="flex items-center gap-1">
                                <Target className="w-2.5 h-2.5" />
                                <span className="text-[9px] font-black">{entry.metrics.leads}</span>
                              </div>
                            )}
                            {entry.metrics.clicks && (
                              <div className="flex items-center gap-1">
                                <MousePointer2 className="w-2.5 h-2.5" />
                                <span className="text-[9px] font-black">{entry.metrics.clicks}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile / tablet cards */}
      <div className="lg:hidden space-y-3">
        {entriesWithDetails.length === 0 ? (
          <div className="neo-card">
            <EmptyState 
              icon={<Calendar className="w-8 h-8" />}
              title="No Entries Yet"
              description="All spend entries will be recorded here as campaigns are updated."
            />
          </div>
        ) : (
          entriesWithDetails.map((entry) => (
            <div key={entry.id} className="neo-card p-4 sm:p-5 space-y-3">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="font-black text-brand-navy uppercase tracking-tight text-sm">{entry.campaignName}</p>
                  <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">{entry.brandName} • {entry.platform}</p>
                </div>
                <p className="text-sm font-black text-brand-navy shrink-0">{formatCurrency(entry.amount)}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="font-bold">{new Date(entry.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-white text-[9px]" style={{ backgroundColor: entry.userColor }}>
                    {entry.enteredBy.charAt(0)}
                  </div>
                  <span className="font-black uppercase" style={{ color: entry.userColor }}>{entry.enteredBy}</span>
                </div>
              </div>
              {(entry.metrics?.leads || entry.metrics?.clicks) && (
                <div className="flex gap-4 pt-2 border-t border-slate-50">
                  {entry.metrics.leads && (
                    <div className="flex items-center gap-1 text-slate-500">
                      <Target className="w-3 h-3" />
                      <span className="text-[9px] font-black">{entry.metrics.leads} leads</span>
                    </div>
                  )}
                  {entry.metrics.clicks && (
                    <div className="flex items-center gap-1 text-slate-500">
                      <MousePointer2 className="w-3 h-3" />
                      <span className="text-[9px] font-black">{entry.metrics.clicks} clicks</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
