import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Megaphone, 
  History, 
  AlertTriangle, 
  Users, 
  LogOut,
  X,
  Menu,
  Award,
  Key,
  Cloud
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import yugamLogo from '../asset/yugamlogo.png';

export const Sidebar = () => {
  const { currentUser, logout, changePassword, pullFromVault, isSyncing, lastSyncedAt, addToast } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showPassModal, setShowPassModal] = useState(false);
  const [newPass, setNewPass] = useState('');
  const isAdmin = currentUser?.role === 'Admin';

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', mobileLabel: 'Home' },
    { icon: Megaphone, label: 'Campaigns', path: '/campaigns', mobileLabel: 'Ads' },
    { icon: Award, label: 'Performance', path: '/portfolio', mobileLabel: 'Stats' },
    { icon: AlertTriangle, label: 'Alerts', path: '/alerts', mobileLabel: 'Alerts' },
  ];

  if (isAdmin) {
    menuItems.push({ icon: Users, label: 'Team', path: '/team', mobileLabel: 'Team' });
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentUser) {
        pullFromVault();
      }
    }, 30000); 
    return () => clearInterval(interval);
  }, [currentUser, pullFromVault]);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 6) {
      addToast('Password must be at least 6 characters.', 'warning');
      return;
    }
    changePassword(newPass);
    setShowPassModal(false);
    setNewPass('');
    addToast('Password updated successfully.', 'success');
  };

  return (
    <>
      {/* MOBILE BOTTOM TAB BAR - Revamped liquid layout */}
      <nav className="lg:hidden fixed bottom-4 left-4 right-4 h-16 bg-white/80 backdrop-blur-2xl rounded-[2rem] border border-white/20 flex items-center justify-between px-2 z-[400] shadow-2xl">
        {menuItems.slice(0, 4).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 h-full transition-all duration-300 relative",
              isActive ? "text-brand-green" : "text-slate-400"
            )}
          >
            {({ isActive }) => (
              <motion.div 
                whileTap={{ scale: 0.9 }}
                className="flex flex-col items-center justify-center"
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-300",
                  isActive ? "bg-brand-green/10" : ""
                )}>
                  <item.icon size={18} strokeWidth={isActive ? 3 : 2.5} />
                </div>
                <span className="text-[7px] font-black uppercase tracking-tighter">{item.mobileLabel}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
        {/* Mobile Profile Trigger */}
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsOpen(true)}
          className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full text-slate-400"
        >
          <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 shadow-inner">
            <span className="text-[10px] font-black text-brand-navy uppercase">{currentUser?.name.charAt(0)}</span>
          </div>
          <span className="text-[7px] font-black uppercase tracking-tighter">More</span>
        </motion.button>
      </nav>

      {/* MOBILE TOP HEADER - Streamlined Island */}
      <header className="lg:hidden fixed top-3 left-4 right-4 h-11 bg-white/80 backdrop-blur-xl rounded-xl border border-white/40 flex items-center justify-between px-4 z-[400] shadow-sm">
          <div className="flex items-center gap-2">
            <img src={yugamLogo} alt="Yugam" className="h-8 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-3">
             <div className="relative flex h-1.5 w-1.5">
                {isSyncing && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>}
                <span className={cn(
                  "relative inline-flex rounded-full h-1.5 w-1.5",
                  isSyncing ? "bg-brand-green" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                )}></span>
             </div>
          </div>
      </header>

      {/* DESKTOP SIDEBAR */}
      <div className={cn(
        "h-screen w-64 bg-white text-brand-navy flex flex-col fixed left-0 top-0 shadow-[10px_0_30px_rgba(0,0,0,0.02)] z-[60] transition-transform duration-500 ease-out lg:translate-x-0 border-r border-slate-100",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-3">
              <img src={yugamLogo} alt="Yugam" className="h-12 w-auto object-contain" />
            </div>
            <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-brand-navy">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-[1.2rem] border border-slate-100 shadow-inner">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[7px] font-black text-slate-400 uppercase tracking-[0.3em]">Server Status</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[7px] font-black text-brand-green uppercase tracking-widest">{isSyncing ? 'Updating' : 'Connected'}</span>
                <div className="relative flex h-2 w-2">
                  {isSyncing && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>}
                  <span className={cn(
                    "relative inline-flex rounded-full h-2 w-2",
                    isSyncing ? "bg-brand-green" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                  )}></span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className={cn("w-3 h-3 transition-colors", isSyncing ? "text-brand-green" : "text-slate-300")} />
                <span className="text-[9px] font-black text-brand-navy uppercase tracking-tighter">
                  {isSyncing ? 'Saving changes...' : 'Up to date'}
                </span>
              </div>
              {lastSyncedAt && <span className="text-[7px] font-bold text-slate-400">Last update: {lastSyncedAt}</span>}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-5 py-3.5 rounded-[1.2rem] transition-all duration-300 group",
                isActive 
                  ? "bg-brand-green text-white font-black shadow-lg shadow-brand-green/20" 
                  : "text-slate-400 hover:bg-slate-50 hover:text-brand-green"
              )}
            >
              <item.icon className={cn("w-5 h-5", "group-hover:scale-110 transition-transform")} />
              <span className="text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-5 border-t border-slate-50 bg-white mt-auto">
          <div className="flex items-center gap-2.5 px-3 py-2.5 mb-4 bg-slate-50 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center text-white font-black text-xs">
              {currentUser?.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-black truncate tracking-tight text-brand-navy">{currentUser?.name}</p>
              <p className="text-[8px] text-brand-green font-black uppercase tracking-widest truncate">{currentUser?.role}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { logout(); setIsOpen(false); }} className="flex-[2] flex items-center justify-center gap-1.5 py-3 rounded-xl bg-white border border-red-500 text-red-500 hover:bg-red-50 transition-all font-black text-[9px] uppercase tracking-widest cursor-pointer">
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
            <button onClick={() => setShowPassModal(true)} className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl bg-slate-50 text-slate-400 hover:text-brand-green transition-all font-black text-[9px] uppercase tracking-widest cursor-pointer border border-slate-100">
              <Key className="w-3 h-3" />
              <span>PWD</span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
           <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-brand-navy/40 backdrop-blur-sm z-[50] lg:hidden"
           />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showPassModal && (
          <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-md flex items-center justify-center z-[500] p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-brand-navy italic tracking-tighter uppercase">Security Update</h3>
                  <button onClick={() => setShowPassModal(false)} className="p-2 text-slate-400 hover:text-brand-navy">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Access Key</label>
                    <input 
                      type="password"
                      required
                      value={newPass}
                      onChange={(e) => setNewPass(e.target.value)}
                      className="neo-input"
                      placeholder="Enter new password..."
                    />
                  </div>
                  <button type="submit" className="w-full neo-btn-primary py-5 uppercase tracking-[0.2em] text-xs">
                    Confirm Change
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
