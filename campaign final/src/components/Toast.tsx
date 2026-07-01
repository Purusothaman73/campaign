import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { X, CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

export const Toast = () => {
  const { toasts, removeToast } = useStore();
  return (
    <div className="fixed bottom-6 right-6 z-[300] space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  );
};

const ToastItem = ({ toast, onRemove }: { toast: any; onRemove: (id: string) => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => onRemove(toast.id), 3000);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  return (
    <div className="pointer-events-auto bg-white rounded-2xl border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.1)] px-5 py-4 min-w-[300px] flex items-center justify-between gap-4 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-2.5 h-2.5 rounded-full shrink-0",
          toast.type === 'success' ? "bg-brand-green" :
          toast.type === 'error' ? "bg-rose-500" : "bg-amber-500"
        )} />
        <div className="flex items-center gap-2">
          {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-brand-green shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />}
          {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
          <p className="text-sm font-black text-brand-navy tracking-tight">{toast.message}</p>
        </div>
      </div>
      <button onClick={() => onRemove(toast.id)} className="text-slate-300 hover:text-slate-500 transition-colors shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
