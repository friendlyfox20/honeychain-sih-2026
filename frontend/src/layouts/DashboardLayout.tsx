import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import {
  Layers,
  Sparkles,
  AlertOctagon,
  Mic,
  BarChart3,
  Users,
  ShieldCheck,
  Activity,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Hexagon,
  Boxes,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [backendHealth, setBackendHealth] = useState<'online' | 'offline'>('online');

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        await api.get('/api/v1/health');
        if (isMounted) setBackendHealth('online');
      } catch {
        if (isMounted) setBackendHealth('offline');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: <Boxes className="w-4 h-4" /> },
    { to: '/batches', label: 'Honey Batches', icon: <Layers className="w-4 h-4" /> },
    { to: '/anomalies', label: 'Reconciliation & Anomalies', icon: <AlertOctagon className="w-4 h-4" /> },
    { to: '/predictions', label: 'ML Honey Intelligence', icon: <Sparkles className="w-4 h-4" /> },
    { to: '/voice', label: 'Voice Assistant', icon: <Mic className="w-4 h-4" /> },
  ];

  const adminItems = [
    { to: '/admin/analytics', label: 'Admin Analytics', icon: <BarChart3 className="w-4 h-4" /> },
    { to: '/admin/users', label: 'User Directory', icon: <Users className="w-4 h-4" /> },
    { to: '/admin/audit-logs', label: 'Audit Trail', icon: <ShieldCheck className="w-4 h-4" /> },
    { to: '/admin/monitoring', label: 'System Monitoring', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex text-slate-200">
      {/* Sidebar for Desktop */}
      <aside className="hidden lg:flex flex-col w-72 bg-slate-900/70 border-r border-slate-800/80 backdrop-blur-xl p-5 shrink-0 select-none">
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/20 text-slate-950">
            <Hexagon className="w-6 h-6 fill-amber-950/20 stroke-[2]" />
            <span className="absolute font-black text-sm text-slate-950">H</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg text-white tracking-tight">HoneyChain</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                SIH 2026
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Traceability & Trust Engine</p>
          </div>
        </div>

        {/* Main Nav */}
        <div className="flex-1 space-y-6 overflow-y-auto pr-1">
          <div className="space-y-1">
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Supply Chain
            </p>
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40" />
              </NavLink>
            ))}
          </div>

          {/* Admin Nav */}
          {isAdmin() && (
            <div className="space-y-1 pt-2 border-t border-slate-800/80">
              <p className="px-3 text-[11px] font-semibold text-amber-400/80 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Admin Suite</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">RBAC</span>
              </p>
              {adminItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      isActive
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                </NavLink>
              ))}
            </div>
          )}

          {/* Consumer Portal Link */}
          <div className="pt-2 border-t border-slate-800/80">
            <a
              href="/verify/lGEh2msu6hnOs5lyufEZVR0NqEBF4gWbopTEMTzenpo"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 hover:bg-emerald-500/10 transition"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Demo Consumer QR Page</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* User Card & Logout */}
        <div className="pt-4 border-t border-slate-800/80 mt-4">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-850 border border-slate-800">
            <div className="truncate pr-2">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                <span className="text-[10px] font-mono text-amber-400 font-bold">{user?.role}</span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-xl flex items-center justify-between px-4 sm:px-8 shrink-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400">Active Role:</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                {user?.role}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Backend Status Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                backendHealth === 'online'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  backendHealth === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                }`}
              />
              <span>{backendHealth === 'online' ? 'FastAPI Connected' : 'Backend Disconnected'}</span>
            </div>

            <div className="hidden md:block text-right">
              <p className="text-xs font-semibold text-white leading-tight">{user?.name}</p>
              <p className="text-[10px] text-slate-400 leading-tight">{user?.email}</p>
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <div className="relative flex flex-col w-72 bg-slate-900 border-r border-slate-800 p-5 z-50">
              <div className="flex items-center justify-between mb-6">
                <span className="font-extrabold text-lg text-white">HoneyChain</span>
                <button onClick={() => setMobileOpen(false)} className="p-1 text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                        isActive ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:bg-slate-800'
                      }`
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
                {isAdmin() && (
                  <>
                    <p className="px-3 pt-4 text-xs font-semibold text-amber-400 uppercase">Admin Suite</p>
                    {adminItems.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                            isActive ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:bg-slate-800'
                          }`
                        }
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </NavLink>
                    ))}
                  </>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="mt-4 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-rose-500/10 text-rose-400 text-sm font-medium border border-rose-500/20"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        )}

        {/* Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
