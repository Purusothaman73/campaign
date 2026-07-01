import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { Lock, ChevronRight, Eye, EyeOff, Phone } from 'lucide-react';
import { cn } from '../lib/utils';
import yugamLogo from '../asset/yugamlogo.png';

export const Login = () => {
  const login = useStore((state) => state.login);
  const pullFromVault = useStore((state) => state.pullFromVault);
  const [role, setRole] = useState<'Admin' | 'Team Member'>('Admin');
  const [identifier, setIdentifier] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [syncFailed, setSyncFailed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const performSync = useCallback(async () => {
    const success = await pullFromVault();
    if (!success) {
      setSyncFailed(true);
    } else {
      setSyncFailed(false);
    }
  }, [pullFromVault]);

  useEffect(() => {
    const init = async () => {
      await performSync();
      setIsInitializing(false);
    };
    init();
  }, [performSync]);

  const handleRetry = async () => {
    setIsRetrying(true);
    const success = await pullFromVault();
    if (success) {
      setSyncFailed(false);
      setError('');
    } else {
      setSyncFailed(true);
    }
    setIsRetrying(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const cleanIdentifier = identifier.trim();
    const cleanPassword = password.trim();

    const allUsers = useStore.getState().users;
    // Find user by mobile or email (case-insensitive for email)
    const user = allUsers.find(u => {
      const matchesMobile = u.mobile === cleanIdentifier;
      const matchesEmail = u.email?.toLowerCase() === cleanIdentifier.toLowerCase();
      const matchesRole = u.role === role;
      return (matchesMobile || matchesEmail) && matchesRole;
    });

    if (!user) {
      setError(`No ${role.toLowerCase()} account found with that mobile/email.`);
      return;
    }

    if (user.password === cleanPassword) {
      login(user.mobile, role);
      useStore.getState().setShowTaskPopup(true);
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[10px] font-black text-brand-navy uppercase tracking-[0.4em]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-5 lg:p-10 relative overflow-hidden">
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 relative z-10 items-center">
        
        {/* Left Side: Desktop Branding (Visible only on LG+) */}
        <div className="hidden lg:block space-y-10">
          <div className="space-y-6">
            <div className="flex flex-col gap-6">
              {/* Desktop Logo Provision */}
              <div className="h-16 w-auto">
                <img src={yugamLogo} alt="Yugam" className="h-full w-auto object-contain" />
              </div>
              <div className="flex flex-col gap-1.5">
                <span className="font-black text-brand-navy italic tracking-tighter text-4xl">YUGAM.</span>
                <div className="h-px w-16 bg-brand-green/30" />
                <span className="text-[9px] font-black text-brand-green uppercase tracking-[0.4em]">Consulting</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-slate-100 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                <span className="text-[8px] font-black text-brand-navy uppercase tracking-[0.3em]">Agency Tool</span>
              </div>
              <h1 className="text-5xl font-black text-brand-navy tracking-tighter italic leading-[0.9] uppercase">
                AD SPEND <br />
                <span className="text-brand-green">TRACKER</span>.
              </h1>
              <p className="text-slate-500 text-sm max-w-xs font-medium leading-relaxed">
                The unified workspace for Yugam team members to track, share, and manage campaign budgets.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-6">
            <div className="space-y-1.5 border-l-2 border-brand-green/20 pl-5">
              <p className="text-brand-green font-black text-xs uppercase tracking-widest">Real-time Stats</p>
              <p className="text-slate-400 text-[10px] leading-relaxed font-bold">Track daily spend and stay on top of client budgets.</p>
            </div>
            <div className="space-y-1.5 border-l-2 border-slate-100 pl-5">
              <p className="text-brand-navy font-black text-xs uppercase tracking-widest">Instant Reports</p>
              <p className="text-slate-400 text-[10px] leading-relaxed font-bold">Generate performance snapshots for clients in one click.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full max-w-sm mx-auto space-y-6">
          <div className="lg:hidden text-center space-y-5 mb-10">
            <div className="flex flex-col items-center gap-4">
              {/* Mobile Logo Provision */}
              <div className="h-12 w-auto">
                <img src={yugamLogo} alt="Yugam" className="h-full w-auto object-contain" />
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="font-black text-brand-navy italic tracking-tighter text-2xl">YUGAM.</span>
                <div className="h-px w-10 bg-brand-green/30" />
                <span className="text-[7px] font-black text-brand-green uppercase tracking-[0.4em]">Consulting</span>
              </div>
            </div>
            <h1 className="text-4xl font-black text-brand-navy tracking-tighter italic uppercase leading-[0.85]">
              AD SPEND <br />
              <span className="text-brand-green">TRACKER</span>.
            </h1>
          </div>

          <div className="text-center lg:text-left mb-6 hidden lg:block">
            <h2 className="text-2xl font-black text-brand-navy tracking-tight italic">Sign In</h2>
            <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-widest">Workspace Entrance</p>
          </div>
          
          <div className="lg:hidden text-center mb-6">
            <h2 className="text-lg font-bold text-slate-400 italic">Sign In</h2>
            <p className="text-slate-300 text-[9px] font-black uppercase tracking-widest mt-1">Yugam team members only</p>
          </div>

          {syncFailed && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                <p className="text-[10px] font-bold text-amber-700 leading-tight">
                  Could not connect to server. You may be seeing cached data.
                </p>
              </div>
              <button 
                onClick={handleRetry}
                disabled={isRetrying}
                className="text-amber-600 underline text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
              >
                {isRetrying ? '...' : 'RETRY'}
              </button>
            </div>
          )}

        <div className="bg-white rounded-[2rem] shadow-xl border border-white p-1.5">
          <div className="flex bg-slate-50 rounded-[1.8rem] p-1">
            {(['Admin', 'Team Member'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => { setRole(r); setError(''); }}
                className={cn(
                  "flex-1 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300",
                  role === r 
                    ? "bg-brand-navy text-white shadow-lg" 
                    : "text-slate-400 hover:text-brand-navy"
                )}
              >
                {r === 'Admin' ? 'ADMIN' : 'TEAM'}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-8 mt-12">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-8">MOBILE NUMBER</label>
            <div className="relative group px-1">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="neo-input pl-16 text-slate-600 font-black h-16"
                placeholder="9876543210"
              />
              <div className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-green transition-colors">
                <Phone className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-8">PASSWORD</label>
            <div className="relative group px-1">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="neo-input pl-16 pr-16 text-slate-600 font-black h-16"
                placeholder="••••••••"
              />
              <div className="absolute left-7 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-brand-green transition-colors">
                <Lock className="w-5 h-5" />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-7 top-1/2 -translate-y-1/2 text-slate-300 hover:text-brand-navy transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && <p className="text-rose-500 text-[9px] font-bold text-center italic">{error}</p>}

          <div className="px-1">
            <button
              type="submit"
              className="w-full bg-[#788023] text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2.5 shadow-lg hover:scale-[1.02] active:scale-95 transition-all group"
            >
              Sign In
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </form>

        <div className="pt-8 text-center">
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">For Yugam team use only.</p>
        </div>
        </div>
      </div>
    </div>
  );
};
