import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center neo-card animate-in fade-in zoom-in duration-500">
      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 shadow-inner text-slate-400">
        {icon}
      </div>
      <h3 className="text-xl font-black text-brand-navy italic uppercase tracking-tight mb-2">{title}</h3>
      <p className="text-slate-400 text-sm font-medium max-w-sm mx-auto leading-relaxed mb-8">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="neo-btn-primary px-8"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};
