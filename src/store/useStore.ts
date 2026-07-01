import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Campaign, SpendEntry, User, CampaignWithCalculations, UserRole } from '../types';
import { differenceInDays, startOfDay, parseISO, isValid } from 'date-fns';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning';
}

interface AppState {
  currentUser: User | null;
  users: User[];
  campaigns: Campaign[];
  spendEntries: SpendEntry[];
  deletedCampaigns: {
    id: string;
    name: string;
    brand: string;
    deletedBy: string;
    deletedAt: string;
  }[];
  userError: string;
  toasts: Toast[];
  isSyncing: boolean;
  isInitializing: boolean;
  lastSyncedAt: string | null;
  showTaskPopup: boolean;
  
  // Actions
  setShowTaskPopup: (show: boolean) => void;
  login: (identifier: string, role: UserRole) => void;
  logout: () => void;
  pullFromVault: () => Promise<boolean>;
  pushToVault: () => Promise<void>;
  
  addCampaign: (campaign: Omit<Campaign, 'id'>) => void;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  
  addSpendEntry: (entry: Omit<SpendEntry, 'id'>) => void;
  addBulkSpendEntries: (entries: Omit<SpendEntry, 'id'>[]) => void;
  updateSpendEntry: (id: string, updates: Partial<SpendEntry>) => void;
  deleteSpendEntry: (id: string) => void;
  
  getClients: () => string[];
  getLocations: () => string[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  rechargeCampaign: (id: string, amount: number, enteredBy: string, mode: string, daysToExtend?: number) => void;
  
  // Selectors
  getCampaignsWithStats: () => CampaignWithCalculations[];
  importData: (data: string) => void;
  changePassword: (newPassword: string) => void;
  setUserError: (msg: string) => void;
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
  initialize: () => void;
  clearAllData: () => void;
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;

const isDemoSpendEntry = (entry: SpendEntry) =>
  entry.id.startsWith('demo-spend-') || entry.note === 'Demo data for report preview';

const isDemoCampaign = (campaign: Campaign) =>
  campaign.id === 'demo-campaign-1' || campaign.notes === 'Demo campaign for report preview';

const stripDemoReportData = (campaigns: Campaign[], spendEntries: SpendEntry[]) => ({
  campaigns: campaigns.filter(c => !isDemoCampaign(c)),
  spendEntries: spendEntries.filter(s => !isDemoSpendEntry(s)),
});

const debouncedPush = (fn: () => Promise<void>, delay = 2000) => {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => fn(), delay);
};

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [
        { id: 'admin-1', name: 'Yugam Admin', mobile: '9999999999', password: 'password', location: 'HQ - Chennai', color: '#0a1128', role: 'Admin' },
      ],
      campaigns: [],
      spendEntries: [],
      deletedCampaigns: [],
      userError: '',
      toasts: [],
      isSyncing: false,
      isInitializing: true,
      lastSyncedAt: null,
      showTaskPopup: false,

      setShowTaskPopup: (show) => set({ showTaskPopup: show }),

      addToast: (message, type) => {
        const id = Math.random().toString(36).substring(2, 9);
        set((state) => ({
          toasts: [...state.toasts, { id, message, type }]
        }));
      },

      removeToast: (id) => set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      })),

      setUserError: (msg) => set({ userError: msg }),

      pullFromVault: async () => {
        set({ isSyncing: true });
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          const response = await fetch(`/api.php?t=${Date.now()}`, {
            headers: { 'X-Agency-Auth': 'yugam_internal_secure_sync_2026' },
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          
          if (!response.ok) throw new Error('Sync failed');
          const result = await response.json();

          if (result && result.payload) {
            const parsed = JSON.parse(result.payload);
            const mergedUsers = parsed.users && parsed.users.length > 0 ? parsed.users : get().users;
            
            // Ensure at least one admin exists
            if (!mergedUsers.find((u: any) => u.role === 'Admin')) {
                mergedUsers.push({ id: 'admin-1', name: 'Yugam Admin', mobile: '9999999999', password: 'password', location: 'HQ - Chennai', color: '#0a1128', role: 'Admin' });
            }

            const cleaned = stripDemoReportData(
              parsed.campaigns || [],
              parsed.spendEntries || []
            );

            set({
              users: mergedUsers,
              campaigns: cleaned.campaigns,
              spendEntries: cleaned.spendEntries,
              deletedCampaigns: parsed.deletedCampaigns || [],
              lastSyncedAt: new Date().toLocaleTimeString(),
              isSyncing: false
            });

            if (
              cleaned.spendEntries.length !== (parsed.spendEntries || []).length ||
              cleaned.campaigns.length !== (parsed.campaigns || []).length
            ) {
              debouncedPush(() => get().pushToVault());
            }
            return true;
          }
          set({ isSyncing: false });
          return false;
        } catch (e) {
          console.warn('Vault Pull Unavailable');
          set({ isSyncing: false });
          return false;
        }
      },

      pushToVault: async () => {
        set({ isSyncing: true });
        try {
          const { users, campaigns, spendEntries, deletedCampaigns } = get();
          const response = await fetch('/api.php', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-Agency-Auth': 'yugam_internal_secure_sync_2026'
            },
            body: JSON.stringify({ users, campaigns, spendEntries, deletedCampaigns })
          });
          
          if (response.ok) {
            set({ lastSyncedAt: new Date().toLocaleTimeString(), isSyncing: false });
          } else {
            set({ isSyncing: false });
          }
        } catch (e) {
          console.error('Vault Push Failed');
          set({ isSyncing: false });
        }
      },

      login: (identifier, role) => {
        const user = get().users.find(u => 
          (u.mobile === identifier || (u.email && u.email.toLowerCase() === identifier)) && 
          u.role === role
        );
        if (user) set({ currentUser: user });
      },
      
      logout: () => set({ currentUser: null }),

      addSpendEntry: (entry) => {
        const id = Math.random().toString(36).substr(2, 9);
        set((state) => {
          const newEntries = [...state.spendEntries, { ...entry, id }];
          const updatedCampaigns = state.campaigns.map(c => {
            if (c.id === entry.campaignId) {
              return { ...c, lastUpdatedBy: entry.enteredBy, lastUpdatedDate: entry.date };
            }
            return c;
          });
          return { spendEntries: newEntries, campaigns: updatedCampaigns };
        });
        debouncedPush(() => get().pushToVault());
      },

      addCampaign: (campaign) => {
        set((state) => ({
          campaigns: [...state.campaigns, { ...campaign, id: Math.random().toString(36).substr(2, 9) }]
        }));
        debouncedPush(() => get().pushToVault());
      },

      updateCampaign: (id, updates) => {
        set((state) => ({
          campaigns: state.campaigns.map(c => {
            if (c.id === id) {
              const changeLog = Object.keys(updates)
                .map(key => `${key}: ${(c as any)[key]} -> ${(updates as any)[key]}`)
                .join(', ');
              
              const revision = {
                updatedBy: state.currentUser?.name || 'Unknown',
                updatedAt: new Date().toISOString(),
                changes: changeLog
              };

              return {
                ...c,
                ...updates,
                lastUpdatedBy: state.currentUser?.name || c.lastUpdatedBy,
                lastUpdatedDate: new Date().toISOString().split('T')[0],
                revisions: [...(c.revisions || []), revision]
              };
            }
            return c;
          })
        }));
        debouncedPush(() => get().pushToVault());
      },

      deleteCampaign: (id) => {
        set((state) => {
          const campaign = state.campaigns.find(c => c.id === id);
          if (!campaign) return state;

          const deletionLog = {
            id: campaign.id,
            name: campaign.campaignName,
            brand: campaign.brandName,
            deletedBy: state.currentUser?.name || 'Unknown',
            deletedAt: new Date().toISOString()
          };

          return {
            campaigns: state.campaigns.filter(c => c.id !== id),
            deletedCampaigns: [...(state.deletedCampaigns || []), deletionLog]
          };
        });
        debouncedPush(() => get().pushToVault());
      },

      rechargeCampaign: (id: string, amount: number, enteredBy: string, mode: string, daysToExtend?: number) => {
        set((state) => ({
          campaigns: state.campaigns.map(c => {
            if (c.id === id) {
              let newEndDate = c.endDate;
              if (daysToExtend && !c.isEvergreen) {
                const date = new Date(c.endDate);
                date.setDate(date.getDate() + daysToExtend);
                newEndDate = date.toISOString().split('T')[0];
              }
              return {
                ...c,
                totalBudget: c.totalBudget + amount,
                endDate: newEndDate,
                paymentStatus: 'Pending',
                adminAcknowledged: false,
                topupRequired: false,
                lastUpdatedBy: enteredBy,
                lastUpdatedDate: new Date().toISOString().split('T')[0]
              };
            }
            return c;
          }),
          spendEntries: [...state.spendEntries, {
            id: Math.random().toString(36).substr(2, 9),
            campaignId: id,
            date: new Date().toISOString().split('T')[0],
            amount: 0,
            enteredBy,
            note: `💰 PAYMENT RECORDED: +${amount} | ${mode}${daysToExtend ? ` | EXTENDED: ${daysToExtend}d` : ''}`
          }]
        }));
        debouncedPush(() => get().pushToVault());
      },

      addUser: (user) => {
        if (!user.mobile || user.mobile.length !== 10) {
          get().setUserError('Mobile number must be exactly 10 digits.');
          return;
        }
        set((state) => {
          const teamColors = ['#788023', '#4f46e5', '#e11d48', '#d97706', '#0891b2', '#7c3aed', '#db2777'];
          const randomColor = teamColors[state.users.length % teamColors.length];
          return {
            users: [...state.users, { ...user, color: user.color || randomColor, id: Math.random().toString(36).substr(2, 9) }]
          };
        });
        debouncedPush(() => get().pushToVault());
      },

      updateUser: (id, updates) => {
        set((state) => ({
          users: state.users.map(u => u.id === id ? { ...u, ...updates } : u)
        }));
        debouncedPush(() => get().pushToVault());
      },

      deleteUser: (id) => {
        set((state) => ({
          users: state.users.filter(u => u.id !== id)
        }));
        debouncedPush(() => get().pushToVault());
      },

      updateSpendEntry: (id, updates) => {
        set((state) => ({
          spendEntries: state.spendEntries.map(s => {
            if (s.id === id) {
              // Calculate specific changes for the log
              const changes = [];
              if (updates.amount !== undefined && updates.amount !== s.amount) {
                changes.push(`Spend: ${s.amount} → ${updates.amount}`);
              }
              if (updates.metrics) {
                Object.entries(updates.metrics).forEach(([key, val]) => {
                  const oldVal = (s.metrics as any)?.[key];
                  if (val !== oldVal && key !== 'customMetrics') {
                    changes.push(`${key}: ${oldVal || 0} → ${val}`);
                  }
                });
              }

              const revision = {
                updatedBy: state.currentUser?.name || 'Unknown',
                updatedAt: new Date().toISOString(),
                note: changes.length > 0 ? changes.join(' | ') : 'Minor update'
              };
              return { ...s, ...updates, revisions: [...(s.revisions || []), revision] };
            }
            return s;
          })
        }));
        debouncedPush(() => get().pushToVault());
      },

      deleteSpendEntry: (id) => {
        set((state) => ({
          spendEntries: state.spendEntries.filter(s => s.id !== id)
        }));
        debouncedPush(() => get().pushToVault());
      },

      changePassword: (newPassword) => {
        const { currentUser, users } = get();
        if (!currentUser) return;
        set({
          users: users.map(u => u.id === currentUser.id ? { ...u, password: newPassword } : u),
          currentUser: { ...currentUser, password: newPassword }
        });
        debouncedPush(() => get().pushToVault());
      },

      getClients: () => {
        const { campaigns } = get();
        return Array.from(new Set(campaigns.map(c => c.clientName))).sort();
      },

      getLocations: () => {
        const { users } = get();
        return Array.from(new Set(users.map(u => u.location).filter(Boolean) as string[])).sort();
      },

      addBulkSpendEntries: (entries) => {
        set((state) => {
          const newEntries = [...state.spendEntries, ...entries.map(e => ({ ...e, id: Math.random().toString(36).substr(2, 9) }))];
          const today = new Date().toISOString().split('T')[0];
          const updatedCampaigns = state.campaigns.map(c => {
            const entry = entries.find(e => e.campaignId === c.id);
            if (entry) {
              return { ...c, lastUpdatedBy: entry.enteredBy, lastUpdatedDate: today };
            }
            return c;
          });
          return { spendEntries: newEntries, campaigns: updatedCampaigns };
        });
        debouncedPush(() => get().pushToVault());
      },

      getCampaignsWithStats: () => {
        const { campaigns, spendEntries } = get();
        const todayStr = new Date().toISOString().split('T')[0];
        const todayDate = startOfDay(new Date());

        return campaigns.map(c => {
          const netBudget = c.gstType === 'Inclusive' ? c.totalBudget / 1.18 : c.totalBudget;
          const relevantEntries = spendEntries.filter(s => s.campaignId === c.id);
          const totalSpent = relevantEntries.reduce((sum, s) => sum + s.amount, 0);
          const totalRevenue = relevantEntries.reduce((sum, s) => sum + (s.metrics?.revenue || 0), 0);
          const remainingBalance = netBudget - totalSpent;
          
          const endKey = c.endDate?.slice(0, 10);
          const end = endKey ? parseISO(endKey) : null;
          const remainingDays = c.isEvergreen
            ? 999
            : end && isValid(end)
              ? Math.max(0, differenceInDays(end, todayDate))
              : 0;
          const pacing = (totalSpent / netBudget) * 100;

          const last7DaysEntries = relevantEntries.slice(-7);
          const burnRate = last7DaysEntries.length > 0 ? 
            last7DaysEntries.reduce((sum, s) => sum + s.amount, 0) / last7DaysEntries.length : 0;
          
          const budgetHorizon = burnRate > 0 ? Math.floor(remainingBalance / burnRate) : 999;
          const roas = totalSpent > 0 ? totalRevenue / totalSpent : 0;
          
          const isPendingUpdate = c.status === 'Active' && c.lastUpdatedDate !== todayStr;

          return {
            ...c,
            netBudget,
            totalSpent,
            totalRevenue,
            remainingBalance,
            remainingDays,
            pacing,
            burnRate,
            runwayDays: budgetHorizon,
            budgetHorizon,
            roas,
            isPendingUpdate
          };
        });
      },

      importData: (data: string) => {
        try {
          const parsed = JSON.parse(data);
          set({
            users: parsed.users || get().users,
            campaigns: parsed.campaigns || [],
            spendEntries: parsed.spendEntries || [],
            deletedCampaigns: parsed.deletedCampaigns || [],
          });
          debouncedPush(() => get().pushToVault());
          get().addToast('Data imported successfully', 'success');
        } catch (e) {
          get().addToast('Invalid data format — check the file and try again.', 'error');
        }
      },
      initialize: () => {
        get().pullFromVault();
      },
      clearAllData: () => {
        if (!confirm('This will PERMANENTLY delete all campaign data, spend records, and logs from both this device and the cloud vault. Continue?')) return;
        
        set({
          campaigns: [],
          spendEntries: [],
          deletedCampaigns: [],
          lastSyncedAt: new Date().toLocaleTimeString()
        });
        
        // Push empty state to server to wipe trial data there too
        get().pushToVault();
        get().addToast('System Reset: All trial data cleared.', 'success');
      },
    }),
    {
      name: 'yugam-vault-v1',
      partialize: (state) => {
        const { toasts, userError, isInitializing, isSyncing, ...persistedState } = state;
        return persistedState;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.users.length === 0 || !state.users.find(u => u.mobile === '9999999999')) {
            state.users.push({ id: 'admin-1', name: 'Yugam Admin', mobile: '9999999999', password: 'password', location: 'HQ - Chennai', color: '#0a1128', role: 'Admin' });
          }
        }

        const finishInit = () => useStore.setState({ isInitializing: false });
        const safetyTimer = setTimeout(finishInit, 10000);

        useStore.getState().pullFromVault().finally(() => {
          clearTimeout(safetyTimer);
          const { campaigns, spendEntries } = useStore.getState();
          const cleaned = stripDemoReportData(campaigns, spendEntries);
          if (
            cleaned.spendEntries.length !== spendEntries.length ||
            cleaned.campaigns.length !== campaigns.length
          ) {
            useStore.setState({
              campaigns: cleaned.campaigns,
              spendEntries: cleaned.spendEntries,
            });
            useStore.getState().pushToVault();
          }
          finishInit();
        });
      },
    }
  )
);
