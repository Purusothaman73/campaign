import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-rose-100/50">
            <AlertTriangle className="w-10 h-10 text-rose-500" />
          </div>
          
          <h1 className="text-3xl font-black text-brand-navy italic tracking-tighter uppercase mb-4">
            Something went wrong
          </h1>
          
          <p className="text-slate-500 font-medium mb-10 max-w-md mx-auto leading-relaxed">
            An unexpected error occurred on this page. Your data is safe.
          </p>

          <button
            onClick={() => window.location.reload()}
            className="bg-brand-navy text-white rounded-2xl px-10 py-5 font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-brand-navy/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto"
          >
            <RefreshCcw className="w-4 h-4 text-brand-green" />
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
