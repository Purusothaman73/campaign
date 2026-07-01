import { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Download, 
  Zap, 
  Share2, 
  X, 
  PlusCircle, 
  Megaphone, 
  ChevronRight, 
  MessageSquare, 
  Users, 
  Target, 
  MousePointer2, 
  Eye, 
  Activity, 
  Layers, 
  FileText, 
  Clock,
  Trash2,
  Filter,
  Save,
  LayoutList,
  Wallet,
  History as HistoryIcon
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { formatCurrency, cn } from '../lib/utils';
import { Platform, CampaignStatus, Priority } from '../types';
import { ClientReport } from '../components/ClientReport';
import { EmptyState } from '../components/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';

export const CampaignList = () => {
  const { 
    getCampaignsWithStats, currentUser, addSpendEntry, updateSpendEntry,
    addCampaign, updateCampaign, deleteCampaign, 
    rechargeCampaign, addBulkSpendEntries, addToast, users 
  } = useStore();
  
  const campaigns = getCampaignsWithStats();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'All'>('All');
  const [selectedStatus, setSelectedStatus] = useState<CampaignStatus | 'All'>('All');
  const [selectedOwner, setSelectedOwner] = useState<string>('All');
  
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkSpends, setBulkSpends] = useState<Record<string, string>>({});
  
  const [showSpendModal, setShowSpendModal] = useState<string | null>(null);
  const [showReportId, setShowReportId] = useState<string | null>(null);
  const [showHistoryId, setShowHistoryId] = useState<string | null>(null);
  const [showRechargeModal, setShowRechargeModal] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [spendAmount, setSpendAmount] = useState('');
  const [selectedUpdateDate, setSelectedUpdateDate] = useState(new Date().toISOString().split('T')[0]);
  const [existingEntryId, setExistingEntryId] = useState<string | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeDays, setRechargeDays] = useState('');
  const [customNotes, setCustomNotes] = useState('');
  const [customMetrics, setCustomMetrics] = useState<{label: string, value: any}[]>([]);
  const [metrics, setMetrics] = useState<any>({});

  const [newCampaign, setNewCampaign] = useState({
    clientName: '',
    brandName: '',
    platform: 'Meta' as Platform,
    campaignName: '',
    objective: 'Lead Gen',
    assignedTo: currentUser?.id || '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isEvergreen: false,
    gstType: 'Inclusive' as 'Inclusive' | 'Exclusive',
    paymentStatus: 'Pending' as 'Paid' | 'Pending',
    totalBudget: 0,
    dailyBudgetLimit: 0,
    status: 'Active' as CampaignStatus,
    priority: 'Medium' as Priority,
    notes: '',
    adminAcknowledged: false,
    topupRequired: false
  });

  const isAdmin = currentUser?.role === 'Admin';

  const existingBrands = useMemo(() => {
    const brands = campaigns.map(c => c.brandName).filter(Boolean);
    return Array.from(new Set(brands)).sort();
  }, [campaigns]);

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         c.brandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPlatform = selectedPlatform === 'All' || c.platform === selectedPlatform;
    const matchesStatus = selectedStatus === 'All' || c.status === selectedStatus;
    const matchesOwner = selectedOwner === 'All' || c.assignedTo === selectedOwner;
    return matchesSearch && matchesPlatform && matchesStatus && matchesOwner;
  });

  const calculatedDailyBudget = useMemo(() => {
    if (!newCampaign.totalBudget || !newCampaign.startDate) return 0;
    
    if (newCampaign.isEvergreen) {
      // For evergreen, we show budget divided by 30 days as a benchmark
      return Math.round(newCampaign.totalBudget / 30);
    }

    if (!newCampaign.endDate) return 0;

    const start = new Date(newCampaign.startDate);
    const end = new Date(newCampaign.endDate);
    const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
    return Math.round(newCampaign.totalBudget / diffDays);
  }, [newCampaign.totalBudget, newCampaign.startDate, newCampaign.endDate, newCampaign.isEvergreen]);

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    addCampaign({
      ...newCampaign,
      createdBy: currentUser?.name || 'System',
      lastUpdatedBy: currentUser?.name || 'System',
      lastUpdatedDate: new Date().toISOString().split('T')[0]
    });
    setShowCreateModal(false);
    setNewCampaign({ 
      ...newCampaign, 
      clientName: '', 
      brandName: '', 
      campaignName: '', 
      totalBudget: 0,
      objective: 'Lead Gen'
    });
    addToast('Campaign launched successfully!', 'success');
  };

  const handleAddSpend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSpendModal) return;
    
    const platform = campaigns.find(c => c.id === showSpendModal)?.platform;
    const spend = Number(spendAmount);
    
    let isMetricValid = true;
    if (platform === 'Meta' && !metrics.views) isMetricValid = false;
    if (platform === 'Google' && !metrics.clicks) isMetricValid = false;
    if (platform === 'LinkedIn' && !metrics.impressions) isMetricValid = false;
    if (platform === 'YouTube' && !metrics.views) isMetricValid = false;
    if (platform === 'WhatsApp' && !metrics.clicks) isMetricValid = false;

    if (!isMetricValid) {
        addToast('Please fill in the required main metrics.', 'warning');
        return;
    }

    const entryData = {
      campaignId: showSpendModal,
      amount: spend,
      date: selectedUpdateDate,
      enteredBy: currentUser?.name || 'Unknown',
      note: customNotes,
      metrics: { ...metrics, customMetrics: customMetrics.filter(m => m.label && m.value) }
    };

    if (existingEntryId) {
      updateSpendEntry(existingEntryId, entryData);
      addToast('Daily record updated and logged.', 'success');
    } else {
      addSpendEntry(entryData);
      addToast('New update deployed.', 'success');
    }

    setShowSpendModal(null);
    setSpendAmount('');
    setSelectedUpdateDate(new Date().toISOString().split('T')[0]);
    setExistingEntryId(null);
    setCustomNotes('');
    setMetrics({});
    setCustomMetrics([]);
  };

  const handleOpenUpdateModal = (campaignId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setSelectedUpdateDate(todayStr);
    
    const existing = useStore.getState().spendEntries.find(s => s.campaignId === campaignId && s.date === todayStr);
    
    if (existing) {
        setExistingEntryId(existing.id);
        setSpendAmount(existing.amount.toString());
        setCustomNotes(existing.note || '');
        setMetrics(existing.metrics || {});
        setCustomMetrics(existing.metrics?.customMetrics || []);
    } else {
        setExistingEntryId(null);
        setSpendAmount('');
        setCustomNotes('');
        setMetrics({});
        setCustomMetrics([]);
    }
    setShowSpendModal(campaignId);
  };

  const handleUpdateDateChange = (date: string, campaignId: string) => {
    setSelectedUpdateDate(date);
    const existing = useStore.getState().spendEntries.find(s => s.campaignId === campaignId && s.date === date);
    if (existing) {
        setExistingEntryId(existing.id);
        setSpendAmount(existing.amount.toString());
        setCustomNotes(existing.note || '');
        setMetrics(existing.metrics || {});
        setCustomMetrics(existing.metrics?.customMetrics || []);
    } else {
        setExistingEntryId(null);
        setSpendAmount('');
        setCustomNotes('');
        setMetrics({});
        setCustomMetrics([]);
    }
  };

  const addCustomMetricField = () => {
    if (customMetrics.length >= 5) return;
    setCustomMetrics([...customMetrics, { label: '', value: '' }]);
  };

  const updateCustomMetric = (index: number, key: 'label' | 'value', val: string) => {
    const updated = [...customMetrics];
    updated[index][key] = val;
    setCustomMetrics(updated);
  };

  const handleBulkUpdate = () => {
    const entries = Object.entries(bulkSpends)
      .filter(([_, amount]) => amount && !isNaN(parseFloat(amount)))
      .map(([id, amount]) => ({
        campaignId: id,
        amount: parseFloat(amount),
        date: new Date().toISOString().split('T')[0],
        enteredBy: currentUser?.name || 'Unknown'
      }));

    if (entries.length > 0) {
      addBulkSpendEntries(entries);
      setBulkSpends({});
      setIsBulkMode(false);
      addToast(`${entries.length} campaigns updated.`, 'success');
    }
  };

  const handleStatusToggle = (id: string, currentStatus: CampaignStatus) => {
    const newStatus: CampaignStatus = currentStatus === 'Active' ? 'Paused' : 'Active';
    updateCampaign(id, { status: newStatus });
  };

  const handleRecharge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRechargeModal) return;
    rechargeCampaign(
        showRechargeModal, 
        Number(rechargeAmount), 
        currentUser?.name || 'Admin', 
        'Manual Top-up',
        rechargeDays ? Number(rechargeDays) : undefined
    );
    setShowRechargeModal(null);
    setRechargeAmount('');
    setRechargeDays('');
    addToast('Budget topped up successfully.', 'success');
  };

  const handleExport = () => {
    const data = filteredCampaigns.map(c => ({
      'Client': c.clientName,
      'Brand': c.brandName,
      'Platform': c.platform,
      'Campaign': c.campaignName,
      'Total Budget': c.totalBudget,
      'Spent': c.totalSpent,
      'Balance': c.remainingBalance,
      'Status': c.status,
      'Pacing': `${Math.round(c.pacing)}%`
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Campaigns');
    XLSX.writeFile(wb, `Yugam_Campaigns_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportCampaignAudit = (id: string) => {
    const campaign = campaigns.find(c => c.id === id);
    if (!campaign) return;

    const entries = useStore.getState().spendEntries.filter(s => s.campaignId === id);
    
    // Create Audit Data
    const auditData = entries.map(entry => {
        const edits = (entry.revisions || []).map(r => `${r.updatedBy} at ${new Date(r.updatedAt).toLocaleString()}: ${r.note}`).join(' | ');
        
        return {
            'Date': entry.date,
            'Brand': campaign.brandName,
            'Platform': campaign.platform,
            'Daily Spend': entry.amount,
            'Entered By': entry.enteredBy,
            'Note': entry.note || '',
            'Correction History': edits || 'No edits',
            'Ref ID': entry.id
        };
    }).sort((a, b) => b.Date.localeCompare(a.Date));

    // Create Campaign Revision Log
    const revisionData = (campaign.revisions || []).map(rev => ({
        'Edit Date': new Date(rev.updatedAt).toLocaleString(),
        'Edited By': rev.updatedBy,
        'Changes Made': rev.changes
    }));

    const ws1 = XLSX.utils.json_to_sheet(auditData);
    const ws2 = XLSX.utils.json_to_sheet(revisionData);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'Financial Audit');
    XLSX.utils.book_append_sheet(wb, ws2, 'Settings History');
    
    XLSX.writeFile(wb, `${campaign.brandName}_Internal_Audit_${new Date().toISOString().split('T')[0]}.xlsx`);
    addToast('Audit report exported successfully.', 'success');
  };

  const renderMetricFields = (platform: Platform) => {
    const fields = [];
    const input = (name: string, label: string, icon: any, isMain = false) => (
      <div key={name} className="space-y-1.5 group">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">
          {label} {isMain && '*'}
        </label>
        <div className="relative">
          <input 
            type="number"
            className={cn(
              "neo-input pl-12 text-xs h-12 font-black",
              isMain && "border-brand-green/20 ring-1 ring-brand-green/10"
            )}
            value={metrics[name] || ''}
            onChange={(e) => setMetrics({...metrics, [name]: Number(e.target.value)})}
            placeholder={isMain ? "Required" : "0"}
          />
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-green transition-colors">
            {icon}
          </div>
        </div>
      </div>
    );

    if (platform === 'Meta') {
      fields.push(input('views', 'Views', <Eye size={20} />, true));
      fields.push(input('messages', 'Leads / Messages', <MessageSquare size={20} />));
      fields.push(input('cpa', 'CPA', <Target size={20} />));
      fields.push(input('reach', 'Reach', <Users size={20} />));
      fields.push(input('clicks', 'Clicks', <MousePointer2 size={20} />));
      fields.push(input('ctr', 'CTR', <Activity size={20} />));
      fields.push(input('cpc', 'CPC', <Zap size={20} />));
      fields.push(input('cpl', 'CPL', <Target size={20} />));
      fields.push(input('frequency', 'Frequency', <Activity size={20} />));
      fields.push(input('cpm', 'CPM', <Layers size={20} />));
    } else if (platform === 'Google') {
      fields.push(input('clicks', 'Clicks', <MousePointer2 size={14} />, true));
      fields.push(input('conversions', 'Conversions', <Target size={14} />));
      fields.push(input('costPerConversion', 'Cost Per Conv', <Zap size={14} />));
      fields.push(input('impressions', 'Impressions', <Activity size={14} />));
      fields.push(input('ctr', 'CTR', <Activity size={14} />));
      fields.push(input('avgCpc', 'Avg CPC', <Zap size={14} />));
    } else if (platform === 'LinkedIn') {
      fields.push(input('impressions', 'Views / Impressions', <Eye size={14} />, true));
      fields.push(input('clicks', 'Clicks', <MousePointer2 size={14} />));
      fields.push(input('ctr', 'CTR', <Activity size={14} />));
      fields.push(input('cpc', 'CPC', <Zap size={14} />));
      fields.push(input('leads', 'Leads', <Target size={14} />));
      fields.push(input('cpl', 'CPL', <Target size={14} />));
    } else if (platform === 'YouTube') {
      fields.push(input('views', 'Views', <Eye size={14} />, true));
      fields.push(input('reach', 'Reach', <Users size={14} />));
      fields.push(input('viewRate', 'View Rate', <Activity size={14} />));
      fields.push(input('watchTime', 'Watch Time', <Clock size={14} />));
      fields.push(input('cpv', 'CPV', <Zap size={14} />));
      fields.push(input('clicks', 'Clicks', <MousePointer2 size={14} />));
      fields.push(input('ctr', 'CTR', <Activity size={14} />));
      fields.push(input('leads', 'Leads', <Target size={14} />));
    } else if (platform === 'WhatsApp') {
      fields.push(input('clicks', 'Clicks', <MousePointer2 size={14} />, true));
      fields.push(input('reach', 'Reach', <Users size={14} />));
      fields.push(input('impressions', 'Impressions', <Activity size={14} />));
      fields.push(input('conversationsStarted', 'Convo Started', <MessageSquare size={14} />));
      fields.push(input('ctr', 'CTR', <Activity size={14} />));
      fields.push(input('cpc', 'CPC', <Zap size={14} />));
      fields.push(input('costPerClick', 'Cost Per Click', <Zap size={14} />));
      fields.push(input('replies', 'Replies', <MessageSquare size={14} />));
      fields.push(input('qualifiedLeads', 'Qualified Leads', <Target size={14} />));
      fields.push(input('frequency', 'Frequency', <Activity size={14} />));
      fields.push(input('cpm', 'CPM', <Layers size={14} />));
    }

    return <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">{fields}</div>;
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-3xl bg-brand-navy flex items-center justify-center text-white shadow-xl rotate-3">
                <Megaphone className="w-6 h-6 -rotate-3" />
            </div>
            <div>
                <h1 className="text-3xl font-black text-brand-navy italic tracking-tighter uppercase">Campaigns</h1>
                <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[9px] mt-1">Live Ad Inventory</p>
            </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleExport} className="neo-btn-ghost h-11 px-5 text-[9px]">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button 
            onClick={() => setIsBulkMode(!isBulkMode)} 
            className={cn("h-11 px-5 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2", 
                isBulkMode ? "bg-brand-navy text-white shadow-lg" : "neo-btn-ghost")}
          >
            <LayoutList className="w-3.5 h-3.5" /> {isBulkMode ? 'List View' : 'Bulk Update'}
          </button>
          <button onClick={() => setShowCreateModal(true)} className="neo-btn-primary h-11 px-5 text-[9px]">
            <Plus className="w-3.5 h-3.5" /> Launch New
          </button>
        </div>
      </div>

      <div className="neo-card p-6 flex flex-col lg:flex-row gap-4 items-center bg-slate-50/50">
        <div className="relative flex-1 w-full group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand-green transition-colors" />
          <input 
            type="text"
            placeholder="Search client, brand or campaign..."
            className="neo-input pl-12 h-12 text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
            <FilterSelect icon={<Layers size={14}/>} value={selectedPlatform} onChange={setSelectedPlatform} options={['All', 'Meta', 'Google', 'LinkedIn', 'YouTube', 'WhatsApp']} />
            <FilterSelect icon={<Activity size={14}/>} value={selectedStatus} onChange={setSelectedStatus} options={['All', 'Active', 'Paused', 'Completed']} />
            <FilterSelect icon={<Users size={14}/>} value={selectedOwner} onChange={setSelectedOwner} options={['All', ...users.map(u => u.id)]} labels={['All Users', ...users.map(u => u.name)]} />
        </div>
      </div>

      {isBulkMode && (
        <div className="flex justify-end animate-in fade-in slide-in-from-right-4">
            <button onClick={handleBulkUpdate} className="neo-btn-primary h-12 px-8 shadow-xl shadow-brand-green/20 gap-3">
                <Save className="w-4 h-4" /> Save All Updates
            </button>
        </div>
      )}

      <div className="neo-card overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Campaign Info</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Budget Pacing</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">{isBulkMode ? "Today's Spend" : "Value"}</th>
                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={5}><EmptyState icon={<Megaphone />} title="No Results" description="Adjust your filters to find campaigns." /></td>
                </tr>
              ) : (
                filteredCampaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-[1.2rem] bg-brand-navy flex items-center justify-center text-white font-black text-[11px] shadow-lg">
                          {c.platform[0]}
                        </div>
                        <div>
                          <p className="font-black text-brand-navy uppercase tracking-tight text-xs leading-none">{c.brandName}</p>
                          <p className="text-[8px] text-slate-400 font-bold tracking-widest mt-1.5 uppercase">{c.campaignName} • {c.platform}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                       <button onClick={() => handleStatusToggle(c.id, c.status)} className={cn("macos-toggle h-5.5 w-10", c.status === 'Active' ? "bg-brand-green" : "bg-slate-200")}>
                         <span className={cn("macos-toggle-dot h-4.5 w-4.5", c.status === 'Active' ? "translate-x-4.5" : "translate-x-0")} />
                       </button>
                    </td>
                    <td className="px-6 py-5">
                        <div className="w-40">
                            <div className="flex justify-between mb-1.5">
                                <span className="text-[8px] font-black text-slate-400 uppercase">Used {Math.round(c.pacing)}%</span>
                                <span className="text-[8px] font-black text-brand-navy">REMAIN: {formatCurrency(c.remainingBalance)}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div className={cn("h-full transition-all duration-1000", c.pacing > 90 ? "bg-rose-500" : "bg-brand-green")} style={{ width: `${Math.min(100, c.pacing)}%` }} />
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-5">
                        {isBulkMode ? (
                            <input 
                                type="number" 
                                className="neo-input h-10 w-24 text-[11px] font-black" 
                                placeholder="0"
                                value={bulkSpends[c.id] || ''}
                                onChange={(e) => setBulkSpends({...bulkSpends, [c.id]: e.target.value})}
                            />
                        ) : (
                            <div>
                                <p className="text-xs font-black text-brand-navy">{c.roas.toFixed(2)}x</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">ROAS</p>
                            </div>
                        )}
                    </td>
                    <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                            {!isBulkMode && (
                                <>
                                    <button 
                                      onClick={() => handleOpenUpdateModal(c.id)} 
                                      className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-100 rounded-xl text-brand-green hover:bg-brand-green hover:text-white transition-all shadow-sm group/btn"
                                    >
                                      <Zap className="w-4 h-4" />
                                      <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Update</span>
                                    </button>
                                    <button 
                                      onClick={() => setShowHistoryId(c.id)} 
                                      className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:bg-slate-500 hover:text-white transition-all shadow-sm group/btn"
                                      title="View History"
                                    >
                                      <HistoryIcon className="w-4 h-4" />
                                      <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Log</span>
                                    </button>
                                    <button 
                                      onClick={() => setShowRechargeModal(c.id)} 
                                      className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-100 rounded-xl text-amber-500 hover:bg-amber-500 hover:text-white transition-all shadow-sm group/btn"
                                    >
                                      <Wallet className="w-4 h-4" />
                                      <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Top-up</span>
                                    </button>
                                    <button 
                                      onClick={() => setShowReportId(c.id)} 
                                      className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-100 rounded-xl text-brand-navy hover:bg-brand-navy hover:text-white transition-all shadow-sm group/btn"
                                    >
                                      <Share2 className="w-4 h-4" />
                                      <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Report</span>
                                    </button>
                                    <button 
                                      onClick={() => exportCampaignAudit(c.id)} 
                                      className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-100 rounded-xl text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all shadow-sm group/btn"
                                      title="Internal Audit Export"
                                    >
                                      <FileText className="w-4 h-4" />
                                      <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Audit</span>
                                    </button>
                                    {isAdmin && (
                                        confirmDeleteId === c.id ? (
                                            <button onClick={() => { deleteCampaign(c.id); setConfirmDeleteId(null); }} className="px-4 h-10 bg-rose-500 text-white rounded-xl font-black text-[9px] uppercase animate-pulse">Confirm?</button>
                                        ) : (
                                            <button onClick={() => setConfirmDeleteId(c.id)} className="p-3 text-rose-300 hover:text-rose-500 rounded-xl transition-colors border border-transparent hover:border-rose-100"><Trash2 className="w-4 h-4" /></button>
                                        )
                                    )}
                                </>
                            )}
                        </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden p-4 space-y-4">
          {filteredCampaigns.length === 0 ? (
            <EmptyState icon={<Megaphone />} title="No Results" description="Adjust your filters to find campaigns." />
          ) : (
            filteredCampaigns.map((c) => (
              <motion.div 
                key={c.id} 
                whileTap={{ scale: 0.98 }}
                className="p-5 bg-white rounded-[2.5rem] border-t border-white/60 shadow-xl shadow-slate-200/40 relative overflow-hidden"
              >
                {/* Glow Effect for Active */}
                {c.status === 'Active' && (
                  <div className="absolute top-0 right-0 p-3">
                    <div className="w-2 h-2 rounded-full bg-brand-green shadow-[0_0_8px_rgba(120,128,35,0.5)] animate-pulse" />
                  </div>
                )}

                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-[1.2rem] bg-brand-navy flex items-center justify-center text-white font-black text-[11px] shadow-lg shadow-brand-navy/20">
                      {c.platform[0]}
                    </div>
                    <div>
                      <p className="font-black text-brand-navy uppercase tracking-tight text-xs leading-none">{c.brandName}</p>
                      <p className="text-[8px] text-slate-400 font-bold tracking-widest mt-1.5 uppercase">{c.platform} ADS</p>
                    </div>
                  </div>
                  <button onClick={() => handleStatusToggle(c.id, c.status)} className={cn("macos-toggle h-5.5 w-10", c.status === 'Active' ? "bg-brand-green" : "bg-slate-200")}>
                    <span className={cn("macos-toggle-dot h-4.5 w-4.5 shadow-sm", c.status === 'Active' ? "translate-x-4.5" : "translate-x-0")} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="neo-card-inset p-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest italic">Budget Utilization</span>
                      <span className="text-[9px] font-black text-brand-navy font-mono-numbers">{Math.round(c.pacing)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white rounded-full overflow-hidden shadow-inner">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, c.pacing)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className={cn("h-full rounded-full transition-colors", c.pacing > 90 ? "bg-rose-500" : "bg-brand-green")} 
                      />
                    </div>
                    <div className="flex justify-between mt-2.5">
                      <span className="text-[7px] font-black text-slate-300 uppercase tracking-tighter">Remaining Balance</span>
                      <span className="text-[9px] font-black text-brand-green font-mono-numbers">{formatCurrency(c.remainingBalance)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {isBulkMode ? (
                         <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                           <input type="number" className="bg-transparent w-20 text-xs font-black text-brand-navy outline-none" placeholder="0" value={bulkSpends[c.id] || ''} onChange={(e) => setBulkSpends({...bulkSpends, [c.id]: e.target.value})} />
                         </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleOpenUpdateModal(c.id)} className="p-3 bg-brand-green text-white rounded-2xl shadow-lg shadow-brand-green/20" title="Update"><Zap size={16} /></motion.button>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowHistoryId(c.id)} className="p-3 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100" title="Log"><HistoryIcon size={16} /></motion.button>
                          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowReportId(c.id)} className="p-3 bg-brand-navy text-white rounded-2xl shadow-lg shadow-brand-navy/20" title="Report"><Share2 size={16} /></motion.button>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-brand-navy leading-none font-mono-numbers italic">{c.roas.toFixed(2)}x</p>
                       <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-1">Value Generated</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Modals remain similarly reconstructed but fully functional with all logic */}
      <AnimatePresence>
        {showSpendModal && (
          <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-md z-[500] flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                className="bg-white rounded-[2.5rem] p-10 w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl custom-scrollbar border border-white/20"
              >
                  <div className="flex justify-between items-center mb-10">
                      <div>
                        <h3 className="text-2xl font-black text-brand-navy uppercase italic tracking-tighter">
                            {existingEntryId ? 'Edit Performance' : 'Share Update'}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-brand-navy text-white text-[8px] font-black uppercase rounded-full">
                            {campaigns.find(c => c.id === showSpendModal)?.platform} Ads
                          </span>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {campaigns.find(c => c.id === showSpendModal)?.campaignName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mr-1">Entry Date</label>
                            <input 
                                type="date" 
                                className="bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 text-[10px] font-black text-brand-navy outline-none focus:ring-1 focus:ring-brand-green/20"
                                value={selectedUpdateDate}
                                onChange={(e) => handleUpdateDateChange(e.target.value, showSpendModal || '')}
                            />
                        </div>
                        <button onClick={() => setShowSpendModal(null)} className="p-2.5 bg-slate-50 text-slate-300 hover:text-brand-navy rounded-full transition-colors border border-slate-100 shadow-sm">
                            <X className="w-5 h-5" />
                        </button>
                      </div>
                  </div>
                  
                  <form onSubmit={handleAddSpend} className="space-y-8">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        {/* Main Spend Box - Left side */}
                        <div className="lg:col-span-1 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Today's Spend (INR) *</label>
                            <div className="relative">
                              <input 
                                type="number" 
                                required 
                                className="neo-input pl-14 text-2xl h-24 font-black text-brand-green" 
                                placeholder="0.00" 
                                value={spendAmount === "0" ? "" : spendAmount} 
                                onChange={(e) => setSpendAmount(e.target.value)} 
                              />
                              <div className="absolute left-6 top-1/2 -translate-y-1/2">
                                <Zap className="w-6 h-6 text-brand-green animate-pulse" />
                              </div>
                            </div>
                            <p className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter px-2">Mandatory field to track balance</p>
                        </div>

                        {/* Platform Metrics - Right side */}
                        <div className="lg:col-span-2">
                          <div className="bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100 shadow-inner">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-1">Secondary Metrics</p>
                            {renderMetricFields(campaigns.find(c => c.id === showSpendModal)?.platform as Platform)}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Custom Metrics</label>
                          <button 
                            type="button" 
                            onClick={addCustomMetricField}
                            disabled={customMetrics.length >= 5}
                            className="text-[9px] font-black text-brand-green uppercase tracking-widest hover:underline flex items-center gap-1 disabled:opacity-30"
                          >
                            <PlusCircle size={12} /> Add Field
                          </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {customMetrics.map((m, idx) => (
                            <div key={idx} className="flex gap-2">
                              <input 
                                className="neo-input text-[10px] h-10 flex-1" 
                                placeholder="Label (e.g. ROI)" 
                                value={m.label}
                                onChange={(e) => updateCustomMetric(idx, 'label', e.target.value)}
                              />
                              <input 
                                className="neo-input text-[10px] h-10 flex-1" 
                                placeholder="Value" 
                                value={m.value}
                                onChange={(e) => updateCustomMetric(idx, 'value', e.target.value)}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes / Observations (Optional)</label>
                        <textarea className="neo-input min-h-[100px] py-4 text-xs" placeholder="What happened today?" value={customNotes} onChange={(e) => setCustomNotes(e.target.value)} />
                      </div>
                      <button type="submit" className="w-full neo-btn-primary py-5 uppercase tracking-widest text-[10px]">Deploy Update</button>
                  </form>
              </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-md z-[500] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl custom-scrollbar border border-white/20">
              <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-3">
                  <PlusCircle className="w-6 h-6 text-brand-green" />
                  <h3 className="text-2xl font-black text-brand-navy uppercase italic tracking-tighter">Launch New Campaign</h3>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="p-2 text-slate-300 hover:text-brand-navy"><X className="w-7 h-7" /></button>
              </div>
              <form onSubmit={handleCreateCampaign} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                  <div className="space-y-5">
                    <Input label="Brand / Client Name *" value={newCampaign.brandName} onChange={(v: string) => setNewCampaign({...newCampaign, brandName: v.toUpperCase(), clientName: v.toUpperCase()})} list="brand-suggestions" />
                    
                    <datalist id="brand-suggestions">
                      {existingBrands.map(brand => (
                        <option key={brand} value={brand} />
                      ))}
                    </datalist>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Platform *</label>
                        <select className="neo-input h-14 text-xs font-black uppercase tracking-widest" value={newCampaign.platform} onChange={e => setNewCampaign({...newCampaign, platform: e.target.value as any})}>
                           {['Meta', 'Google', 'LinkedIn', 'YouTube', 'WhatsApp'].map(p => <option key={p} value={p}>{p} Ads</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Objective *</label>
                        <select className="neo-input h-14 text-xs font-black uppercase tracking-widest" value={newCampaign.objective} onChange={e => setNewCampaign({...newCampaign, objective: e.target.value})}>
                           {['Lead Gen', 'Sales', 'Traffic', 'Awareness', 'Engagement'].map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                    </div>
                    <Input label="Campaign Name *" value={newCampaign.campaignName} onChange={(v: string) => setNewCampaign({...newCampaign, campaignName: v.toUpperCase()})} />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">GST Type</label>
                          <select className="neo-input h-12 text-xs font-black uppercase" value={newCampaign.gstType} onChange={e => setNewCampaign({...newCampaign, gstType: e.target.value as any})}>
                            <option value="Inclusive">18% GST Incl.</option>
                            <option value="Exclusive">GST Extra</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Priority</label>
                          <select className="neo-input h-12 text-xs font-black uppercase" value={newCampaign.priority} onChange={e => setNewCampaign({...newCampaign, priority: e.target.value as any})}>
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                          </select>
                        </div>
                    </div>
                  </div>

                  <div className="space-y-5">
                    <Input label="Total Budget (INR) *" value={newCampaign.totalBudget.toString()} onChange={(v: string) => setNewCampaign({...newCampaign, totalBudget: Number(v)})} type="number" />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Start Date" value={newCampaign.startDate} onChange={(v: string) => setNewCampaign({...newCampaign, startDate: v})} type="date" />
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center px-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">End Date</label>
                            <button 
                              type="button"
                              onClick={() => setNewCampaign({...newCampaign, isEvergreen: !newCampaign.isEvergreen, endDate: !newCampaign.isEvergreen ? '' : newCampaign.endDate})}
                              className={cn(
                                "text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-md transition-all",
                                newCampaign.isEvergreen ? "bg-brand-green text-white shadow-md" : "bg-slate-100 text-slate-400"
                              )}
                            >
                              {newCampaign.isEvergreen ? 'Evergreen' : 'Fixed'}
                            </button>
                          </div>
                          <input 
                            type="date" 
                            disabled={newCampaign.isEvergreen}
                            className={cn("neo-input h-14 text-xs font-black uppercase", newCampaign.isEvergreen && "opacity-30")}
                            value={newCampaign.endDate} 
                            onChange={e => setNewCampaign({...newCampaign, endDate: e.target.value})} 
                          />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Owner / Assignee</label>
                      <select className="neo-input h-14 text-xs font-black" value={newCampaign.assignedTo} onChange={e => setNewCampaign({...newCampaign, assignedTo: e.target.value})}>
                          {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                    
                    <div className="p-5 bg-slate-50 rounded-[1.8rem] border border-slate-100 flex items-center justify-between shadow-inner">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green shadow-sm"><Zap size={18} /></div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Est. Daily Budget</span>
                        </div>
                        <span className="text-lg font-black text-brand-navy italic">{formatCurrency(calculatedDailyBudget)}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full neo-btn-primary h-16 uppercase tracking-widest text-[11px] shadow-2xl shadow-brand-green/30">
                    Deploy Initiative
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRechargeModal && (
          <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-md z-[500] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative">
               <div className="flex justify-between items-center mb-8">
                  <div className="flex items-center gap-3">
                    <Wallet className="w-5 h-5 text-amber-500" />
                    <h3 className="text-xl font-black text-brand-navy uppercase italic tracking-tighter">Budget Top-up</h3>
                  </div>
                  <button onClick={() => setShowRechargeModal(null)} className="p-2 text-slate-300 hover:text-brand-navy"><X className="w-6 h-6" /></button>
               </div>
               <form onSubmit={handleRecharge} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Additional Amount (INR)</label>
                    <input type="number" required className="neo-input h-14" placeholder="0.00" value={rechargeAmount} onChange={e => setRechargeAmount(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Extend End Date (Days)</label>
                    <input type="number" className="neo-input h-14" placeholder="Optional" value={rechargeDays} onChange={e => setRechargeDays(e.target.value)} />
                  </div>
                  <button type="submit" className="w-full neo-btn-primary h-14 mt-4 uppercase tracking-widest text-[10px]">Confirm Top-up</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHistoryId && (
          <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-md z-[500] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2.5rem] p-8 w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl relative flex flex-col">
               <div className="flex justify-between items-center mb-8 shrink-0">
                  <div className="flex items-center gap-3">
                    <HistoryIcon className="w-5 h-5 text-slate-400" />
                    <h3 className="text-xl font-black text-brand-navy uppercase italic tracking-tighter">Campaign Log</h3>
                  </div>
                  <button onClick={() => setShowHistoryId(null)} className="p-2 text-slate-300 hover:text-brand-navy transition-colors"><X className="w-6 h-6" /></button>
               </div>
               
               <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                 <div className="space-y-6">
                    {/* Combine spend entries and campaign revisions into a single timeline */}
                    {[
                      ...useStore.getState().spendEntries
                        .filter(s => s.campaignId === showHistoryId)
                        .map(s => ({ ...s, logType: 'spend', sortDate: s.date })),
                      ...(campaigns.find(c => c.id === showHistoryId)?.revisions || [])
                        .map(r => ({ ...r, logType: 'revision', sortDate: r.updatedAt }))
                    ]
                    .sort((a, b) => b.sortDate.localeCompare(a.sortDate))
                    .map((item: any, i) => (
                      <div key={i} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center font-black text-[10px] text-brand-navy shadow-sm border border-slate-100 uppercase">
                              {item.enteredBy?.charAt(0) || item.updatedBy?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-brand-navy uppercase tracking-widest leading-none">
                                {item.enteredBy || item.updatedBy}
                              </p>
                              <p className="text-[7px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                                {item.logType === 'spend' ? 'Spend Record' : 'Campaign Edit'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-black text-slate-400 uppercase">
                              {new Date(item.date || item.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-slate-50 shadow-inner">
                          {item.logType === 'spend' ? (
                            <>
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Amount</span>
                                <span className="text-xs font-black text-brand-navy">{formatCurrency(item.amount)}</span>
                              </div>
                              <div className="flex justify-between items-end mt-4">
                                <div className="flex-1">
                                  {item.revisions && item.revisions.length > 0 && (
                                    <div className="space-y-2 border-t border-dashed border-slate-100 pt-3">
                                      <p className="text-[8px] font-black text-rose-400 uppercase tracking-widest">Correction History</p>
                                      {item.revisions.map((rev: any, j: number) => (
                                        <div key={j} className="flex flex-col gap-1">
                                          <div className="flex justify-between items-center">
                                            <span className="text-[8px] font-bold text-slate-500">{rev.updatedBy} corrected data</span>
                                            <span className="text-[7px] text-slate-300 font-bold">{new Date(rev.updatedAt).toLocaleTimeString()}</span>
                                          </div>
                                          <p className="text-[9px] font-bold text-slate-400 italic bg-rose-50/50 p-2 rounded-lg">"{rev.note}"</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <button 
                                  onClick={() => {
                                    setShowHistoryId(null);
                                    handleOpenUpdateModal(showHistoryId || '');
                                    handleUpdateDateChange(item.date, showHistoryId || '');
                                  }}
                                  className="ml-4 px-4 py-2 bg-brand-navy text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-brand-green transition-colors shadow-lg shadow-brand-navy/10"
                                >
                                  Correct Entry
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-brand-green uppercase tracking-widest">Changes Made</p>
                              <p className="text-[9px] font-bold text-slate-500 bg-slate-50 p-2 rounded-lg leading-relaxed whitespace-pre-wrap">{item.changes}</p>
                            </div>
                          )}
                          {item.note && item.logType === 'spend' && (
                             <div className="mt-2 text-[9px] font-bold text-slate-400 border-l-2 border-brand-green/20 pl-2">
                               {item.note}
                             </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {useStore.getState().spendEntries.filter(s => s.campaignId === showHistoryId).length === 0 && 
                     (campaigns.find(c => c.id === showHistoryId)?.revisions?.length || 0) === 0 && (
                      <div className="text-center py-20">
                        <HistoryIcon className="w-12 h-12 text-slate-100 mx-auto mb-4" />
                        <p className="text-xs font-bold text-slate-400 italic uppercase tracking-widest">No activity recorded yet.</p>
                      </div>
                    )}
                 </div>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showReportId && <ClientReport campaignId={showReportId} onClose={() => setShowReportId(null)} />}

      {/* Mobile Floating Action Button for New Campaign */}
      {!isBulkMode && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowCreateModal(true)}
          className="lg:hidden fixed bottom-24 right-6 w-14 h-14 bg-brand-green text-white rounded-full shadow-2xl flex items-center justify-center z-[300] border-4 border-white"
        >
          <Plus size={24} strokeWidth={3} />
        </motion.button>
      )}
    </div>
  );
};

const FilterSelect = ({ icon, value, onChange, options, labels }: any) => (
  <div className="relative group w-full lg:w-48">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none">{icon}</div>
    <select 
      className="neo-input pl-10 h-12 text-[9px] font-black uppercase tracking-widest appearance-none"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt: string, i: number) => (
        <option key={opt} value={opt}>{labels ? labels[i] : opt}</option>
      ))}
    </select>
  </div>
);

const Input = ({ label, value, onChange, type = "text", list }: any) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type} 
      list={list} 
      className="neo-input h-14 text-xs font-black uppercase" 
      value={value === 0 || value === "0" ? "" : value} 
      onChange={e => onChange(e.target.value)} 
      placeholder={type === 'number' ? '0' : ''}
    />
  </div>
);