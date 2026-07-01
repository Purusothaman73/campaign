import { useStore } from '../store/useStore';
import { formatCurrency, cn } from '../lib/utils';
import { AlertTriangle, AlertCircle, Clock, BatteryLow, CheckCircle2, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';

export const AlertsPage = () => {
  const { getCampaignsWithStats, users, addToast, currentUser } = useStore();
  const campaigns = getCampaignsWithStats();
  const navigate = useNavigate();
  const isAdmin = currentUser?.role === 'Admin';

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || 'Unknown';

  const alerts = [
    ...campaigns
      .filter(c => (c.remainingBalance / c.netBudget) < 0.2 && c.status === 'Active')
      .map(c => ({
        type: 'low-budget',
        campaign: c,
        title: 'Low Budget',
        message: `Only ${Math.round((c.remainingBalance / c.netBudget) * 100)}% budget remaining.`,
        icon: BatteryLow,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200'
      })),
    ...campaigns
      .filter(c => c.remainingDays === 0 && c.status === 'Active')
      .map(c => ({
        type: 'ending',
        campaign: c,
        title: 'Ending Today',
        message: `End date reached. Campaign requires immediate review or extension.`,
        icon: Clock,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      })),
    ...campaigns
      .filter(c => c.topupRequired)
      .map(c => ({
        type: 'recharge',
        campaign: c,
        title: 'Recharge Needed',
        message: `Campaign marked as requiring a budget top-up.`,
        icon: AlertCircle,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      })),
    ...campaigns
      .filter(c => c.totalSpent > c.netBudget)
      .map(c => ({
        type: 'overspending',
        campaign: c,
        title: 'Overspending Warning',
        message: `Actual spend exceeds allocated budget by ${formatCurrency(c.totalSpent - c.netBudget)}.`,
        icon: AlertTriangle,
        color: 'text-red-800',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-300'
      })),
    ...campaigns
      .filter(c => {
        if (c.isEvergreen || !c.endDate) return false;
        const start = new Date(c.startDate).getTime();
        const end = new Date(c.endDate).getTime();
        const now = new Date().getTime();
        const totalDuration = end - start;
        const elapsed = now - start;
        const expectedPacing = (elapsed / totalDuration) * 100;
        return c.pacing > (expectedPacing + 15) && c.status === 'Active'; // 15% threshold
      })
      .map(c => ({
        type: 'pacing',
        campaign: c,
        title: 'High Pacing Alert',
        message: `Campaign is spending faster than scheduled. Current: ${Math.round(c.pacing)}%.`,
        icon: Zap,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200'
      }))
  ];

  const copyAlerts = () => {
    const text = alerts.map(a => 
      `🚨 *${a.title}*\nCampaign: ${a.campaign.campaignName}\nIssue: ${a.message}\nAssigned to: ${getUserName(a.campaign.assignedTo)}\n---`
    ).join('\n');
    navigator.clipboard.writeText(text);
    addToast('Alert summary copied to clipboard.', 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Alerts</h1>
          <p className="text-slate-500 text-sm">Campaigns that need your attention.</p>
        </div>
        {alerts.length > 0 && (
          <button onClick={copyAlerts} className="neo-btn-secondary h-11 px-6 text-[10px] font-black uppercase tracking-widest w-full sm:w-auto justify-center">
            Copy Summary for Team
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {campaigns.filter(c => c.isPendingUpdate && (isAdmin || c.assignedTo === currentUser?.id)).length > 0 && (
          <div className="neo-card p-6 border-l-8 border-brand-green bg-brand-green/5">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-brand-green" />
              <div>
                <p className="text-[10px] font-black text-brand-navy uppercase tracking-widest">Campaign Update</p>
                <p className="text-sm font-bold text-brand-green mt-0.5">
                  {isAdmin ? 'Team has' : 'You have'} {campaigns.filter(c => c.isPendingUpdate && (isAdmin || c.assignedTo === currentUser?.id)).length} pending updates.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {alerts.length === 0 ? (
        <EmptyState 
          icon={<CheckCircle2 className="w-8 h-8 text-emerald-500" />}
          title="All Clear"
          description="No campaigns require attention right now."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {alerts.map((alert, i) => (
            <div key={i} className={cn(
              "p-6 rounded-[2.5rem] border-l-8 shadow-xl shadow-slate-200/50 animate-in slide-in-from-bottom-2 duration-300 bg-white",
              alert.borderColor
            )}>
              <div className="flex items-start gap-5">
                <div className={cn("p-3 rounded-2xl bg-white shadow-sm border border-slate-50", alert.color)}>
                  <alert.icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h3 className={cn("font-black text-xs uppercase tracking-widest", alert.color)}>{alert.title}</h3>
                  </div>
                  <p className="text-lg font-black text-brand-navy uppercase italic tracking-tighter mt-2 leading-none">{alert.campaign.campaignName}</p>
                  <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest leading-none">
                    Brand: {alert.campaign.brandName} • Owner: {getUserName(alert.campaign.assignedTo)}
                  </p>
                  <div className={cn("mt-4 p-4 rounded-2xl text-xs font-bold leading-relaxed", alert.bgColor, alert.color)}>
                    {alert.message}
                  </div>
                  <button 
                    onClick={() => navigate('/campaigns')}
                    className="mt-6 text-[10px] font-black uppercase tracking-widest text-brand-navy hover:text-brand-green transition-colors flex items-center gap-2"
                  >
                    Resolve Issue <Clock className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
