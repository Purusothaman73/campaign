import { useStore } from '../store/useStore';
import { 
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip, 
  ResponsiveContainer,
} from 'recharts';
import { Share2, X, ShieldCheck, Activity, Download, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { useState, useEffect, useMemo } from 'react';
import { format, subDays, isWithinInterval, parseISO, startOfDay, endOfDay, min as minDate, max as maxDate, isValid } from 'date-fns';
import yugamLogo from '../asset/yugamlogo.png';

const toDateKey = (value?: string) => {
  if (!value) return null;
  const key = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const parsed = parseISO(key);
  return isValid(parsed) ? key : null;
};

export const ClientReport = ({ campaignId, onClose }: { campaignId: string, onClose: () => void }) => {
  const { getCampaignsWithStats, spendEntries, currentUser, addToast } = useStore();
  
  const [dateRange, setDateRange] = useState({
    start: format(subDays(new Date(), 7), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [dateRangeReady, setDateRangeReady] = useState(false);

  const campaign = getCampaignsWithStats().find(c => c.id === campaignId);

  const campaignSpendEntries = useMemo(
    () =>
      spendEntries
        .filter(s => s.campaignId === campaignId && s.amount > 0)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [spendEntries, campaignId]
  );

  useEffect(() => {
    if (campaignSpendEntries.length > 0) {
      const dates = campaignSpendEntries
        .map(s => toDateKey(s.date))
        .filter((d): d is string => !!d)
        .map(d => parseISO(d));

      if (dates.length > 0) {
        setDateRange({
          start: format(minDate(dates), 'yyyy-MM-dd'),
          end: format(maxDate(dates), 'yyyy-MM-dd'),
        });
      }
    } else if (campaign) {
      const start = toDateKey(campaign.startDate) || format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const end = toDateKey(campaign.endDate) || format(new Date(), 'yyyy-MM-dd');
      setDateRange(
        parseISO(start) <= parseISO(end)
          ? { start, end }
          : { start: end, end: start }
      );
    }
    setDateRangeReady(true);
  }, [campaignId, campaignSpendEntries, campaign?.startDate, campaign?.endDate]);

  if (!campaign || !dateRangeReady) return null;

  const objective = campaign.objective;
  const getPrimaryMetric = (s: any) => {
    switch(objective) {
      case 'Awareness': return s.metrics?.reach || s.metrics?.views || 0;
      case 'Engagement': return s.metrics?.conversions || s.metrics?.messages || 0; 
      case 'Traffic': return s.metrics?.clicks || 0;
      case 'Lead Gen': return s.metrics?.leads || s.metrics?.messages || 0;
      case 'Sales': return s.metrics?.conversions || 0;
      default: return s.metrics?.leads || Object.values(s.metrics || {}).find(v => typeof v === 'number') || 0;
    }
  };

  const getEfficiencyMetric = (s: any) => {
    const m = s.metrics || {};
    const primary = getPrimaryMetric(s);
    switch(objective) {
      case 'Lead Gen':
        return m.cpl ?? (primary > 0 ? s.amount / primary : 0);
      case 'Sales':
        return m.costPerConversion ?? (primary > 0 ? s.amount / primary : 0);
      case 'Traffic':
        return m.cpc ?? m.avgCpc ?? (primary > 0 ? s.amount / primary : 0);
      case 'Awareness':
        return m.cpm ?? (m.impressions > 0 ? (s.amount / m.impressions) * 1000 : 0);
      case 'Engagement':
        return m.cpa ?? (primary > 0 ? s.amount / primary : 0);
      default:
        return m.cpl ?? m.cpc ?? 0;
    }
  };

  const getMetricLabel = () => {
    switch(objective) {
      case 'Awareness': return 'Reach';
      case 'Engagement': return 'Engagement';
      case 'Traffic': return 'Clicks';
      case 'Lead Gen': return 'Leads';
      case 'Sales': return 'Sales';
      default: return 'Results';
    }
  };

  const getEfficiencyLabel = () => {
    switch(objective) {
      case 'Lead Gen': return 'CPL';
      case 'Sales': return 'Cost/Conv';
      case 'Traffic': return 'CPC';
      case 'Awareness': return 'CPM';
      case 'Engagement': return 'CPA';
      default: return 'Efficiency';
    }
  };

  const filteredEntries = campaignSpendEntries.filter(s => {
    const entryKey = toDateKey(s.date);
    if (!entryKey) return false;
    const entryDate = parseISO(entryKey);
    const rangeStart = startOfDay(parseISO(dateRange.start));
    const rangeEnd = endOfDay(parseISO(dateRange.end));
    if (!isValid(rangeStart) || !isValid(rangeEnd) || rangeStart > rangeEnd) return false;
    return isWithinInterval(entryDate, { start: rangeStart, end: rangeEnd });
  });

  const chartEntries = filteredEntries.length > 0 ? filteredEntries : campaignSpendEntries;

  const toHistoryPoint = (s: typeof campaignSpendEntries[number]) => ({
    date: new Date(toDateKey(s.date) || s.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    spend: s.amount,
    primaryMetric: getPrimaryMetric(s),
    efficiency: Math.round(getEfficiencyMetric(s)),
    reach: s.metrics?.reach || 0,
    impr: s.metrics?.impressions || 0,
  });

  const history = chartEntries.map(toHistoryPoint);
  const reportStats = filteredEntries.map(toHistoryPoint);

  const totalResults = reportStats.reduce((sum, h) => sum + h.primaryMetric, 0);
  const totalSpent = reportStats.reduce((sum, h) => sum + h.spend, 0);
  const totalReach = reportStats.reduce((sum, h) => sum + h.reach, 0);
  const totalImpr = reportStats.reduce((sum, h) => sum + h.impr, 0);
  
  const metricLabel = getMetricLabel();
  const efficiencyLabel = getEfficiencyLabel();
  const balanceValue = Math.max(0, campaign.remainingBalance);
  const timeInfo = campaign.isEvergreen
    ? 'Ongoing'
    : !Number.isFinite(campaign.remainingDays)
      ? 'Active'
      : campaign.remainingDays === 0
        ? 'Ended'
        : `${campaign.remainingDays}d Left`;
  const startDate = campaign.startDate
    ? new Date(toDateKey(campaign.startDate) || campaign.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    : '—';

  const handleCapture = async (mode: 'share' | 'download') => {
    const element = document.getElementById('report-card');
    if (!element) {
      console.error('Report element not found');
      addToast('Report card element missing', 'error');
      return;
    }

    console.log('Starting report capture...');
    addToast('Generating report...', 'warning');

    try {
      // Create a clone and convert modern CSS colors to hex
      const clonedElement = element.cloneNode(true) as HTMLElement;
      clonedElement.style.position = 'absolute';
      clonedElement.style.left = '-9999px';
      clonedElement.style.top = '-9999px';
      clonedElement.style.width = '420px';
      clonedElement.style.height = 'auto';
      clonedElement.style.display = 'block';
      
      // Convert modern CSS to compatible colors recursively
      const convertCSSColors = (el: HTMLElement) => {
        // Get computed style and convert all colors to hex
        const computed = window.getComputedStyle(el);
        
        // Convert color properties that might contain oklab/oklch/color-mix (kebab-case for getPropertyValue)
        const colorProps = ['color', 'background-color', 'border-color', 'fill', 'stroke'];
        colorProps.forEach(prop => {
          const value = computed.getPropertyValue(prop);
          if (value && (value.includes('oklab') || value.includes('oklch') || value.includes('color-mix'))) {
            try {
              // Convert any color to hex/rgba using a 1x1 canvas
              const canvas = document.createElement('canvas');
              canvas.width = 1;
              canvas.height = 1;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.fillStyle = value;
                ctx.fillRect(0, 0, 1, 1); // CRITICAL: Draw the pixel so the color gets rasterized!
                const imageData = ctx.getImageData(0, 0, 1, 1);
                const [r, g, b, a] = imageData.data;
                
                if (a === 255) {
                  const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
                  el.style.setProperty(prop, hex, 'important');
                } else {
                  const rgba = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
                  el.style.setProperty(prop, rgba, 'important');
                }
              }
            } catch (e) {
              console.error('Failed to convert color:', value, e);
              // Fallback to standard color
              if (prop === 'color') {
                el.style.setProperty(prop, '#000000', 'important');
              } else {
                el.style.setProperty(prop, '#ffffff', 'important');
              }
            }
          }
        });
        
        // Set explicit dimensions on containers to fix Recharts -1 issue
        if (el.className && typeof el.className === 'string' && (el.className.includes('ResponsiveContainer') || el.className.includes('container'))) {
          el.style.width = '100%';
          el.style.height = '300px';
          el.style.minWidth = '100%';
          el.style.minHeight = '300px';
        }
        
        // Recursively apply to all children
        Array.from(el.children).forEach((child) => {
          convertCSSColors(child as HTMLElement);
        });
      };
      
      // Temporarily add to document to compute styles
      clonedElement.style.position = 'absolute';
      clonedElement.style.left = '-9999px';
      clonedElement.style.visibility = 'hidden';
      document.body.appendChild(clonedElement);
      
      convertCSSColors(clonedElement);
      
      clonedElement.style.visibility = 'visible';

      console.log('Element prepared, starting html2canvas...');

      let canvas;
      try {
        canvas = await html2canvas(clonedElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          ignoreElements: (element: Element) => {
            // Ignore problematic elements
            if (!element || typeof element.className !== 'string') {
              return false;
            }
            return element.className.includes('report-nav') || element.className.includes('responsive');
          }
        });
      } catch (renderError) {
        console.warn('html2canvas rendering error, trying with strip styles:', renderError);
        // Fallback: strip all classes that might have problematic styles
        clonedElement.querySelectorAll('*').forEach(el => {
          if (el instanceof HTMLElement) {
            el.className = '';
          }
        });
        canvas = await html2canvas(clonedElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false
        });
      }

      document.body.removeChild(clonedElement);
      console.log('Canvas created successfully');

      if (!canvas) {
        throw new Error('Canvas creation failed');
      }

      const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).replace(/ /g, '_');
      const fileName = `${campaign.brandName}_Report_${dateStr}.png`;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            console.error('Blob creation failed');
            addToast('Failed to create image', 'error');
            return;
          }

          console.log('Blob created, size:', blob.size);
          const url = URL.createObjectURL(blob);

          if (mode === 'download') {
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }, 100);
            console.log('Download triggered');
            addToast('Report downloaded!', 'success');
          } else {
            // Try share API
            if (navigator.share) {
              const file = new File([blob], fileName, { type: 'image/png' });
              const shareData = {
                title: `${campaign.brandName} Report`,
                text: `Campaign report for ${campaign.brandName}`,
                files: [file]
              };

              if (navigator.canShare && navigator.canShare(shareData)) {
                navigator.share(shareData)
                  .then(() => {
                    console.log('Share successful');
                    URL.revokeObjectURL(url);
                    addToast('Report shared!', 'success');
                  })
                  .catch((err) => {
                    console.log('Share failed or cancelled', err);
                    if (err.name !== 'AbortError') {
                      console.log('Share failed, downloading');
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = fileName;
                      link.style.display = 'none';
                      document.body.appendChild(link);
                      link.click();
                      setTimeout(() => {
                        document.body.removeChild(link);
                        URL.revokeObjectURL(url);
                      }, 100);
                      addToast('Report downloaded!', 'success');
                    }
                  });
              } else {
                console.log('Share not supported for files, downloading');
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                setTimeout(() => {
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }, 100);
                addToast('Report downloaded!', 'success');
              }
            } else {
              const link = document.createElement('a');
              link.href = url;
              link.download = fileName;
              link.style.display = 'none';
              document.body.appendChild(link);
              link.click();
              setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              }, 100);
              addToast('Report downloaded!', 'success');
            }
          }
        },
        'image/png',
        0.95
      );
    } catch (err) {
      console.error('Report failed:', err);
      addToast('Unable to generate report', 'error');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="fixed inset-0 bg-brand-navy/90 backdrop-blur-xl z-[600] flex items-center justify-center p-2 lg:p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-[420px] my-auto">
        
        {/* Navigation - Forced to fit desktop/mobile neatly */}
        <div className="report-nav flex justify-between items-center mb-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 p-2 shadow-xl">
            <div className="flex items-center gap-1.5 px-2">
                <Calendar className="w-3 h-3 text-white/50" />
                <input 
                  type="date" 
                  className="bg-transparent text-[8px] font-black text-white outline-none"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
                <span className="text-[8px] font-black text-white/40">-</span>
                <input 
                  type="date" 
                  className="bg-transparent text-[8px] font-black text-white outline-none"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
            </div>
            <div className="flex gap-1.5">
                <button onClick={() => handleCapture('share')} className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all border border-white/10 shadow-lg">
                  <Share2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleCapture('download')} className="p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all border border-white/10 shadow-lg">
                  <Download className="w-4 h-4" />
                </button>
                <button onClick={onClose} className="p-2 bg-rose-500 text-white rounded-full hover:bg-rose-600 transition-all shadow-lg border border-white/10">
                  <X className="w-4 h-4" />
                </button>
            </div>
        </div>

        {/* THE REPORT CARD - MINIFIED HIGH DENSITY iOS DESIGN */}
        <div id="report-card" className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/20 origin-top">
          
          <div className="p-7 flex-1 flex flex-col bg-white">
            {/* Header: Logo Only + Date Range Pill */}
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-3">
                <img src={yugamLogo} alt="Yugam" className="h-10 w-auto object-contain" />
                <div className="flex flex-wrap gap-1.5">
                  <div className="bg-[#788023] text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-sm">
                    {format(parseISO(dateRange.start), 'dd MMM').toUpperCase()} - {format(parseISO(dateRange.end), 'dd MMM yyyy').toUpperCase()}
                  </div>
                  <div className="bg-[#0a1128] text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-md">
                    {campaign.platform.toUpperCase()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-black text-brand-navy tracking-tighter uppercase italic leading-none">{campaign.brandName}</h1>
                <div className="h-0.5 w-8 bg-[#788023] ml-auto mt-2 rounded-full" />
                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1.5">{campaign.objective}</p>
              </div>
            </div>

            {/* Metrics: Tighter Grid & Smaller Fonts */}
            <div className="space-y-2.5 flex-1">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f3f1eb]/50 rounded-[1.2rem] p-3.5 border border-[#788023]/10">
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest italic mb-1.5 leading-none">Utilized</p>
                  <h3 className="text-xl font-black text-brand-navy tracking-tighter italic leading-none font-mono-numbers">₹{totalSpent.toLocaleString()}</h3>
                </div>
                <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-[1.2rem]">
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest italic mb-1.5 leading-none">Balance</p>
                  <h3 className="text-xl font-black text-brand-navy tracking-tighter italic leading-none font-mono-numbers">₹{balanceValue.toLocaleString()}</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-50 shadow-sm p-3.5 rounded-[1.2rem]">
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1.5 italic leading-none">{metricLabel}</p>
                  <h4 className="text-xl font-black text-brand-navy tracking-tighter italic leading-none font-mono-numbers">{totalResults.toLocaleString()}</h4>
                </div>
                <div className="bg-white border border-slate-50 shadow-sm p-3.5 rounded-[1.2rem]">
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mb-1.5 italic leading-none">Status</p>
                  <div className="flex flex-col">
                    <span className="text-lg font-black text-[#788023] italic tracking-tight uppercase leading-none font-mono-numbers">{timeInfo}</span>
                    <span className="text-[7px] font-bold text-slate-500 mt-1 uppercase italic leading-none font-mono-numbers">Since {startDate}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#f8faff] border border-blue-50 p-3.5 rounded-[1.2rem]">
                  <p className="text-[7px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 italic leading-none">Total Reach</p>
                  <h4 className="text-xl font-black text-indigo-600 leading-none tracking-tighter italic font-mono-numbers">{totalReach.toLocaleString()}</h4>
                </div>
                <div className="bg-[#f8faff] border border-blue-50 p-3.5 rounded-[1.2rem]">
                  <p className="text-[7px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 italic leading-none">Impressions</p>
                  <h4 className="text-xl font-black text-indigo-600 leading-none tracking-tighter italic font-mono-numbers">{totalImpr.toLocaleString()}</h4>
                </div>
              </div>

              {/* Chart: Compact View */}
              <div className="bg-white rounded-[1.5rem] p-4 border border-slate-50 shadow-sm h-36 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5">
                    <Activity size={10} className="text-[#788023]" />
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest italic leading-none">Performance Pulse</span>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-slate-300 rounded-sm"/>
                      <span className="text-[7px] font-black text-slate-500 uppercase">Spend</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-0.5 bg-[#788023]"/>
                      <span className="text-[7px] font-black text-[#788023] uppercase">{metricLabel}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-0.5 bg-indigo-500"/>
                      <span className="text-[7px] font-black text-indigo-500 uppercase">{efficiencyLabel}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 w-full min-h-0">
                  {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-1">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">No spend updates yet</p>
                      <p className="text-[7px] font-medium text-slate-300 text-center px-4">Add daily spend from Campaigns to populate this graph</p>
                    </div>
                  ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={history} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 7, fill: '#64748b', fontWeight: 700 }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis yAxisId="spend" hide domain={[0, 'auto']} />
                      <YAxis yAxisId="leads" orientation="right" hide domain={[0, 'auto']} />
                      <YAxis yAxisId="efficiency" orientation="right" hide domain={[0, 'auto']} />
                      <Tooltip
                        contentStyle={{ fontSize: 10, borderRadius: 8, border: '1px solid #e2e8f0' }}
                        formatter={(value: number, name: string) => {
                          if (name === 'spend') return [`₹${value.toLocaleString()}`, 'Spend'];
                          if (name === 'primaryMetric') return [value.toLocaleString(), metricLabel];
                          if (name === 'efficiency') return [`₹${value.toLocaleString()}`, efficiencyLabel];
                          return [value, name];
                        }}
                      />
                      <Bar yAxisId="spend" dataKey="spend" fill="#94a3b8" radius={[2, 2, 0, 0]} barSize={14} />
                      <Line
                        yAxisId="leads"
                        type="monotone"
                        dataKey="primaryMetric"
                        stroke="#788023"
                        strokeWidth={2}
                        dot={{ r: 2.5, fill: '#788023', stroke: '#fff', strokeWidth: 1 }}
                        activeDot={{ r: 4 }}
                      />
                      <Line
                        yAxisId="efficiency"
                        type="monotone"
                        dataKey="efficiency"
                        stroke="#6366f1"
                        strokeWidth={1.5}
                        strokeDasharray="4 3"
                        dot={{ r: 2, fill: '#6366f1', stroke: '#fff', strokeWidth: 1 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Verification & Agency Footer */}
              <div className="pt-2 border-t border-slate-50 flex items-center">
                <div className="flex items-center gap-1.5 ml-1">
                  <ShieldCheck size={9} className="text-brand-green" />
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest italic">
                    Verified by {currentUser?.name || 'Authorized'}
                  </p>
                </div>
              </div>

            </div>
          </div>

          <div className="bg-[#0a1128] py-3">
            <p className="text-[7px] font-black text-white/90 text-center uppercase tracking-[0.35em] leading-relaxed">
              PRECISION CAMPAIGN CONTROL CENTER
            </p>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
