import { useStore } from '../store/useStore';
import { X, CheckCircle2, Clock, Megaphone, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export const TaskModal = () => {
  const { getCampaignsWithStats, currentUser, showTaskPopup, setShowTaskPopup } = useStore();
  const navigate = useNavigate();
  
  const campaigns = getCampaignsWithStats();
  const myPendingTasks = currentUser ? campaigns.filter(c => 
    c.isPendingUpdate && (currentUser.role === 'Admin' || c.assignedTo === currentUser.id)
  ) : [];

  return (
    <AnimatePresence>
      {showTaskPopup && currentUser && (
        <div className="fixed inset-0 bg-brand-navy/60 backdrop-blur-md flex items-start sm:items-center justify-center z-[500] p-3 sm:p-4 overflow-y-auto">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            className="bg-white rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-white/20 my-4 sm:my-0"
          >
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
              <div>
                <h3 className="text-xl font-black text-brand-navy italic tracking-tighter uppercase leading-none">Daily Tasks</h3>
                <p className="text-[9px] font-black text-brand-green uppercase tracking-widest mt-1">Pending for {currentUser.name.split(' ')[0]}</p>
              </div>
              <button 
                onClick={() => setShowTaskPopup(false)}
                className="p-2 bg-white text-slate-400 hover:text-brand-navy rounded-full shadow-sm transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar">
              {myPendingTasks.length === 0 ? (
                <div className="text-center py-10 space-y-4">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-slate-400 italic">You're all caught up! No pending updates for today.</p>
                </div>
              ) : (
                <>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-4">Pending Campaign Updates ({myPendingTasks.length})</p>
                  <div className="space-y-3">
                    {myPendingTasks.map((task) => (
                      <div key={task.id} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-brand-green/10 flex items-center justify-center text-brand-green">
                            <Megaphone className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-brand-navy uppercase tracking-tight">{task.brandName}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{task.platform} Ads</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-rose-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-black uppercase tracking-tighter">Missing</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="p-8 border-t border-slate-50 flex gap-4">
              <button 
                onClick={() => setShowTaskPopup(false)}
                className="flex-1 h-14 rounded-2xl bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all"
              >
                Later
              </button>
              <button 
                onClick={() => {
                  setShowTaskPopup(false);
                  navigate('/campaigns');
                }}
                className="flex-[2] h-14 rounded-2xl bg-brand-green text-white font-black uppercase text-[10px] tracking-widest shadow-xl shadow-brand-green/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                Start Updating
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
