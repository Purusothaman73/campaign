import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { UserPlus, Phone, Key, Trash2, Edit2, Download, Upload, X, Shield, MapPin, Users } from 'lucide-react';
import { User, UserRole } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const TeamPage = () => {
  const { users, currentUser, addUser, updateUser, deleteUser, addToast, importData } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'Admin';

  const [newUser, setNewUser] = useState({
    name: '',
    mobile: '',
    password: '',
    location: '',
    role: 'Team Member' as UserRole
  });

  const [editUser, setEditUser] = useState({
    name: '',
    mobile: '',
    password: '',
    location: '',
    role: 'Team Member' as UserRole
  });

  const existingLocations = Array.from(new Set(users.map(u => u.location).filter(Boolean))).sort();

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUser.mobile.length !== 10) {
      addToast('Please enter a valid 10-digit mobile number.', 'warning');
      return;
    }
    addUser({ ...newUser, email: '' });
    setNewUser({ name: '', mobile: '', password: '', location: '', role: 'Team Member' });
    setShowAddModal(false);
    addToast('Team member added successfully.', 'success');
  };

  const handleEditOpen = (user: User) => {
    setEditUser({
      name: user.name,
      mobile: user.mobile || '',
      password: user.password || '',
      location: user.location || '',
      role: user.role
    });
    setShowEditModal(user.id);
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;
    if (editUser.mobile.length !== 10) {
      addToast('Please enter a valid 10-digit mobile number.', 'warning');
      return;
    }
    updateUser(showEditModal, editUser);
    setShowEditModal(null);
    addToast('Member details updated.', 'success');
  };

  const togglePassword = (id: string) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const exportData = () => {
    const data = JSON.stringify({
      users: useStore.getState().users,
      campaigns: useStore.getState().campaigns,
      spendEntries: useStore.getState().spendEntries,
      deletedCampaigns: useStore.getState().deletedCampaigns
    }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yugam_vault_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const clearAllData = useStore(state => state.clearAllData);

  return (
    <div className="space-y-5 pb-16 min-w-0 w-full">
      <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-2xl bg-brand-navy flex items-center justify-center text-white shadow-lg">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-black text-brand-navy italic tracking-tighter uppercase">Team</h1>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[9px] mt-0.5">Staff Directory</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {isAdmin && (
            <button 
              onClick={clearAllData}
              className="h-10 px-4 bg-rose-50 text-rose-500 rounded-xl border border-rose-100 hover:bg-rose-500 hover:text-white transition-all font-black text-[9px] uppercase tracking-widest flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear Trial Data
            </button>
          )}
          <button onClick={() => setShowAddModal(true)} className="neo-btn-primary h-10 px-4 text-[9px]">
            <UserPlus className="w-3.5 h-3.5" />
            Add Member
          </button>
        </div>
      </div>

      <div className="neo-card p-4 sm:p-5 bg-slate-50/30 border-dashed">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-black text-brand-navy italic uppercase">Data Vault</h3>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Cloud Sync & Backups</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button onClick={exportData} className="neo-btn-ghost text-[9px] font-black uppercase tracking-widest px-4 h-10">
              <Download className="w-3.5 h-3.5" />
              Backup Data
            </button>
            <label className="neo-btn-ghost text-[9px] font-black uppercase tracking-widest px-4 h-10 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              Restore Data
              <input 
                type="file" 
                className="hidden" 
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (re) => {
                      const content = re.target?.result as string;
                      importData(content);
                    };
                    reader.readAsText(file);
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="neo-card p-4 sm:p-5 bg-slate-50/50">
            <h3 className="text-sm font-black text-brand-navy italic uppercase mb-3 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
              Deletion Logs
            </h3>
            <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
              {useStore.getState().deletedCampaigns?.length === 0 ? (
                <p className="text-[10px] font-bold text-slate-400 italic">No deletion records found.</p>
              ) : (
                useStore.getState().deletedCampaigns.map((log, i) => (
                  <div key={i} className="p-3 bg-white rounded-xl border border-slate-100 flex justify-between items-center gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-brand-navy uppercase truncate">{log.name}</p>
                      <p className="text-[8px] font-bold text-slate-400 mt-0.5 uppercase">Deleted by {log.deletedBy}</p>
                    </div>
                    <p className="text-[9px] font-black text-rose-500 uppercase italic shrink-0">{new Date(log.deletedAt).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="neo-card p-4 sm:p-5 bg-slate-50/50">
            <h3 className="text-sm font-black text-brand-navy italic uppercase mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-green shrink-0" />
              Member Access
            </h3>
            <div className="space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
              {users.map((user, i) => (
                <div key={i} className="p-3 bg-white rounded-xl border border-slate-100 flex justify-between items-center gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 shrink-0 rounded-lg flex items-center justify-center font-black text-white text-[9px]" style={{ backgroundColor: user.color }}>
                      {user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-brand-navy uppercase truncate">{user.name}</p>
                      <p className="text-[8px] font-bold text-slate-400">{user.role}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-50 rounded text-[7px] font-black text-slate-400 uppercase shrink-0">Verified</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {users.map((user) => (
          <div key={user.id} className="neo-card p-4 sm:p-5 border-white/40 bg-white/40">
            <div className="flex justify-between items-start mb-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm shadow-md"
                style={{ backgroundColor: user.color || '#0a1128' }}
              >
                {user.name.charAt(0)}
              </div>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-[0.15em]",
                user.role === 'Admin' ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-500"
              )}>
                {user.role}
              </span>
            </div>
            
            <h3 className="text-base font-black text-brand-navy uppercase italic tracking-tighter leading-none">{user.name}</h3>
            
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center gap-2 text-slate-400">
                <Phone className="w-3 h-3 shrink-0" />
                <span className="text-[10px] font-bold">{user.mobile}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="text-[10px] font-bold">{user.location || 'Remote'}</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50/50 rounded-lg border border-slate-100 mt-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Key className="w-3 h-3 text-brand-green shrink-0" />
                  <span className="text-[9px] font-black text-brand-navy tracking-widest uppercase truncate">
                    {showPasswords[user.id] ? user.password : '••••••••'}
                  </span>
                </div>
                <button onClick={() => togglePassword(user.id)} className="text-[8px] font-black text-brand-green uppercase tracking-widest hover:underline shrink-0 ml-2">
                  {showPasswords[user.id] ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
              <button onClick={() => handleEditOpen(user)} className="flex-1 h-9 rounded-lg bg-slate-50 text-slate-400 hover:text-brand-navy hover:bg-slate-100 transition-all font-black text-[8px] uppercase tracking-widest flex items-center justify-center gap-1 border border-slate-100">
                <Edit2 className="w-3 h-3" /> Edit
              </button>
              {user.id !== currentUser?.id && (
                confirmDeleteId === user.id ? (
                  <button onClick={() => { deleteUser(user.id); setConfirmDeleteId(null); }} className="flex-1 bg-rose-500 text-white rounded-lg h-9 font-black text-[8px] uppercase tracking-widest animate-pulse">
                    Confirm?
                  </button>
                ) : (
                  <button onClick={() => setConfirmDeleteId(user.id)} className="w-9 h-9 flex items-center justify-center text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all border border-transparent hover:border-rose-100 shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )
              )}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {showAddModal && (
          <Modal onClose={() => setShowAddModal(false)} title="Add Team Member">
            <form onSubmit={handleAddUser} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Full Name" value={newUser.name} onChange={v => setNewUser({...newUser, name: v})} placeholder="e.g. John Doe" />
                <Input label="Mobile Number" value={newUser.mobile} onChange={v => setNewUser({...newUser, mobile: v})} placeholder="10 Digits" />
                <Input label="Access Password" value={newUser.password} onChange={v => setNewUser({...newUser, password: v})} placeholder="Min. 6 chars" type="password" />
                <Input label="Office Location" value={newUser.location} onChange={v => setNewUser({...newUser, location: v})} placeholder="City/Office" list="locations-list" />
              </div>

              <datalist id="locations-list">
                {existingLocations.map(loc => (
                  <option key={loc} value={loc} />
                ))}
              </datalist>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Level</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {['Team Member', 'Admin'].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setNewUser({...newUser, role: r as UserRole})}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        newUser.role === r ? "bg-white text-brand-navy shadow-sm" : "text-slate-400"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full neo-btn-primary py-4 uppercase tracking-widest text-[10px]">Deploy Access</button>
            </form>
          </Modal>
        )}

        {showEditModal && (
          <Modal onClose={() => setShowEditModal(null)} title="Update Member">
            <form onSubmit={handleUpdateUser} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Full Name" value={editUser.name} onChange={v => setEditUser({...editUser, name: v})} />
                <Input label="Mobile Number" value={editUser.mobile} onChange={v => setEditUser({...editUser, mobile: v})} />
                <Input label="Access Password" value={editUser.password} onChange={v => setEditUser({...editUser, password: v})} type="password" />
                <Input label="Office Location" value={editUser.location} onChange={v => setEditUser({...editUser, location: v})} />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Level</label>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {['Team Member', 'Admin'].map(r => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setEditUser({...editUser, role: r as UserRole})}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                        editUser.role === r ? "bg-white text-brand-navy shadow-sm" : "text-slate-400"
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full neo-btn-primary py-4 uppercase tracking-widest text-[10px]">Save Changes</button>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

const Modal = ({ children, onClose, title }: { children: React.ReactNode, onClose: () => void, title: string }) => (
  <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-md z-[500] flex items-start sm:items-center justify-center p-3 sm:p-4 overflow-y-auto">
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      className="bg-white rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6 lg:p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative border border-white/20 my-4 sm:my-0"
    >
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-brand-green shrink-0" />
          <h3 className="text-lg font-black text-brand-navy uppercase italic tracking-tighter">{title}</h3>
        </div>
        <button onClick={onClose} className="p-2 text-slate-300 hover:text-brand-navy transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      {children}
    </motion.div>
  </div>
);

const Input = ({ label, value, onChange, placeholder, type = "text", list }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, type?: string, list?: string }) => (
  <div className="space-y-1.5">
    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    <input 
      type={type}
      className="neo-input text-xs h-11"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      list={list}
    />
  </div>
);
