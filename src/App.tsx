import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useStore } from './store/useStore';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Toast } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import { Dashboard } from './pages/Dashboard';
import { CampaignList } from './pages/CampaignList';
import { AlertsPage } from './pages/Alerts';
import { HistoryPage } from './pages/History';
import { TeamPage } from './pages/Team';
import { Portfolio } from './pages/Portfolio';

import { TaskModal } from './components/TaskModal';
import { AlertCircle } from 'lucide-react';
import { cn } from './lib/utils';

const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard — Yugam',
  '/campaigns': 'Campaigns — Yugam',
  '/alerts': 'Alerts — Yugam',
  '/history': 'Spend History — Yugam',
  '/team': 'Team — Yugam',
  '/portfolio': 'Portfolio — Yugam',
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const { getCampaignsWithStats, currentUser } = useStore();
  const myPendingTasks = getCampaignsWithStats().filter(c => c.isPendingUpdate && (currentUser?.role === 'Admin' || c.assignedTo === currentUser?.id));
  const pendingCount = myPendingTasks.length;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] relative">
      <Sidebar />
      <main className="flex-1 min-w-0 lg:ml-64 relative pb-24 lg:pb-0 overflow-x-hidden">
        {/* Global Blinking Alert Header - Repositioned for Mobile Compatibility */}
        {pendingCount > 0 && (
          <div className="bg-brand-green py-2 px-4 flex items-center justify-center gap-2 sticky top-0 lg:static z-[150] shadow-md animate-in slide-in-from-top duration-500 max-w-full lg:mb-3">
            <div className="bg-white/20 p-1 rounded-full animate-blink-soft flex-shrink-0">
              <AlertCircle size={10} className="text-white" />
            </div>
            <p className="text-[8px] font-black text-white uppercase tracking-widest truncate">
              Reminder: {pendingCount} updates needed
            </p>
          </div>
        )}
        
        <div className={cn(
          "p-3 sm:p-4 md:p-6 lg:p-10 transition-all duration-500 w-full min-w-0 max-w-full", 
          "pt-16 lg:pt-10", 
          pendingCount > 0 && "pt-12 lg:pt-4" 
        )}>
          {children}
        </div>
      </main>
      <TaskModal />
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, isInitializing } = useStore();
  
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-green border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[10px] font-black text-brand-navy uppercase tracking-[0.4em]">Verifying Session...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const ProtectedPage = ({ component: Component }: { component: React.ComponentType }) => (
  <ProtectedRoute>
    <ErrorBoundary>
      <Component />
    </ErrorBoundary>
  </ProtectedRoute>
);

const AppRoutes = () => {
  const location = useLocation();
  const currentUser = useStore(state => state.currentUser);

  useEffect(() => {
    document.title = PAGE_TITLES[location.pathname] || 'Yugam';
  }, [location.pathname]);

  return (
    <Routes>
      <Route 
        path="/login" 
        element={currentUser ? <Navigate to="/" replace /> : <Login />} 
      />
      
      <Route path="/" element={
        <ProtectedPage component={Dashboard} />
      } />

      <Route path="/campaigns" element={
        <ProtectedPage component={CampaignList} />
      } />

      <Route path="/alerts" element={
        <ProtectedPage component={AlertsPage} />
      } />

      <Route path="/history" element={
        <ProtectedPage component={HistoryPage} />
      } />

      <Route path="/team" element={
        <ProtectedPage component={TeamPage} />
      } />

      <Route path="/portfolio" element={
        <ProtectedPage component={Portfolio} />
      } />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  const { initialize } = useStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <AppRoutes />
      <Toast />
    </BrowserRouter>
  );
}

export default App;
