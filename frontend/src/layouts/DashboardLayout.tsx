import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import {
  Layers,
  Sparkles,
  AlertTriangle,
  Mic,
  BarChart3,
  Users,
  ShieldCheck,
  Activity,
  LogOut,
  Menu,
  X,
  ChevronRight,
  ExternalLink,
  Compass,
  CheckCircle2,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, logout, isBeekeeper, isCollector, isProcessor, isLab, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [backendHealth, setBackendHealth] = useState<'online' | 'offline'>('online');
  const [lang, setLang] = useState<'EN' | 'HI' | 'MR'>('EN');

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

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

  // Role-tailored work-centric navigation items
  const getRoleNavItems = () => {
    if (isBeekeeper()) {
      return [
        { to: '/dashboard', label: 'Field Workspace', icon: <Compass className="w-4 h-4" /> },
        { to: '/batches', label: 'My Hives & Batches', icon: <Layers className="w-4 h-4" /> },
        { to: '/predictions', label: 'Yield Estimates', icon: <Sparkles className="w-4 h-4" /> },
        { to: '/voice', label: 'Ask HoneyChain (Voice)', icon: <Mic className="w-4 h-4" /> },
      ];
    }
    if (isCollector()) {
      return [
        { to: '/dashboard', label: 'Collection Hub', icon: <Compass className="w-4 h-4" /> },
        { to: '/batches', label: 'Incoming & Regional Batches', icon: <Layers className="w-4 h-4" /> },
        { to: '/anomalies', label: 'Quantity Reconciliation', icon: <AlertTriangle className="w-4 h-4" /> },
        { to: '/voice', label: 'Voice Inquiries', icon: <Mic className="w-4 h-4" /> },
      ];
    }
    if (isProcessor()) {
      return [
        { to: '/dashboard', label: 'Processing Operations', icon: <Compass className="w-4 h-4" /> },
        { to: '/batches', label: 'Batches & Packaging Lots', icon: <Layers className="w-4 h-4" /> },
        { to: '/anomalies', label: 'Mass Balance & Discrepancies', icon: <AlertTriangle className="w-4 h-4" /> },
        { to: '/voice', label: 'Voice Inquiries', icon: <Mic className="w-4 h-4" /> },
      ];
    }
    if (isLab()) {
      return [
        { to: '/dashboard', label: 'Testing Center', icon: <Compass className="w-4 h-4" /> },
        { to: '/batches', label: 'Samples & Lab Assays', icon: <Layers className="w-4 h-4" /> },
        { to: '/anomalies', label: 'Purity Anomaly Review', icon: <AlertTriangle className="w-4 h-4" /> },
      ];
    }
    // Default / Admin
    return [
      { to: '/dashboard', label: 'Operations Overview', icon: <Compass className="w-4 h-4" /> },
      { to: '/batches', label: 'Traceable Batches', icon: <Layers className="w-4 h-4" /> },
      { to: '/anomalies', label: 'Anomaly Investigation', icon: <AlertTriangle className="w-4 h-4" /> },
      { to: '/predictions', label: 'Honey Intelligence', icon: <Sparkles className="w-4 h-4" /> },
      { to: '/voice', label: 'Voice Assistant', icon: <Mic className="w-4 h-4" /> },
    ];
  };

  const adminNavItems = [
    { to: '/admin/analytics', label: 'Tonnage & Velocity', icon: <BarChart3 className="w-4 h-4" /> },
    { to: '/admin/users', label: 'User Directory', icon: <Users className="w-4 h-4" /> },
    { to: '/admin/audit-logs', label: 'Immutable Audit Trail', icon: <ShieldCheck className="w-4 h-4" /> },
    { to: '/admin/monitoring', label: 'Subsystem Health', icon: <Activity className="w-4 h-4" /> },
  ];

  const currentRoleTitle = () => {
    switch (user?.role) {
      case 'BEEKEEPER': return 'Beekeeper Field Office';
      case 'COLLECTOR': return 'Collection Center';
      case 'PROCESSOR': return 'Processing & Bottling';
      case 'LAB': return 'Laboratory Testing';
      case 'ADMIN': return 'Administrative Console';
      default: return 'Field Operations';
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col lg:flex-row text-charcoal">
      {/* Mobile Top Header */}
      <header className="lg:hidden bg-white border-b border-border-warm px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-subtle">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg text-charcoal hover:bg-surface-tint active:bg-surface-subtle transition"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-forest-700 text-white flex items-center justify-center font-bold text-xs font-mono">
              H
            </div>
            <span className="font-bold text-base text-charcoal font-display">HoneyChain</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Language toggle */}
          <div className="flex bg-surface-tint border border-border-warm rounded-md text-[11px] font-semibold text-charcoal-muted overflow-hidden">
            {(['EN', 'HI', 'MR'] as const).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-1.5 py-0.5 ${lang === l ? 'bg-forest-700 text-white' : 'hover:text-charcoal'}`}
              >
                {l}
              </button>
            ))}
          </div>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-charcoal-muted hover:text-terracotta-700 transition"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Desktop Sidebar / Mobile Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-border-warm p-5 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0 shadow-elevated' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between pb-5 border-b border-border-subtle mb-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-forest-700 text-white flex items-center justify-center font-bold text-sm font-mono shadow-subtle">
                HC
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-lg text-charcoal font-display tracking-tight">HoneyChain</span>
                  <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-surface-tint text-charcoal-muted border border-border-warm">
                    SIH '26
                  </span>
                </div>
                <p className="text-xs text-charcoal-muted">{currentRoleTitle()}</p>
              </div>
            </div>
            <button
              onClick={() => setMobileOpen(false)}
              className="lg:hidden p-1.5 text-charcoal-muted hover:text-charcoal rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <div className="space-y-6">
            <div>
              <p className="px-3 text-[11px] font-semibold text-charcoal-muted uppercase tracking-wider mb-2 font-mono">
                Field Operations
              </p>
              <nav className="space-y-1">
                {getRoleNavItems().map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-forest-50 text-forest-700 font-semibold border border-forest-200'
                          : 'text-charcoal-muted hover:text-charcoal hover:bg-surface-tint'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <span className="shrink-0">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Admin Management Section */}
            {isAdmin() && (
              <div className="pt-4 border-t border-border-subtle">
                <p className="px-3 text-[11px] font-semibold text-honey-700 uppercase tracking-wider mb-2 font-mono flex items-center justify-between">
                  <span>Administration</span>
                  <span className="text-[10px] bg-honey-100 text-honey-800 px-1.5 py-0.5 rounded border border-honey-200">ADMIN</span>
                </p>
                <nav className="space-y-1">
                  {adminNavItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-honey-100 text-honey-800 font-semibold border border-honey-200'
                            : 'text-charcoal-muted hover:text-charcoal hover:bg-surface-tint'
                        }`
                      }
                    >
                      <div className="flex items-center gap-3">
                        <span className="shrink-0">{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                    </NavLink>
                  ))}
                </nav>
              </div>
            )}
          </div>
        </div>

        {/* User & System Status Footer */}
        <div className="pt-4 border-t border-border-subtle space-y-3">
          {/* Public Verification Link */}
          <a
            href="/verify/lGEh2msu6hnOs5lyufEZVR0NqEBF4gWbopTEMTzenpo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 rounded-lg bg-surface-tint hover:bg-surface-subtle border border-border-warm text-xs text-charcoal transition"
          >
            <span className="font-medium">Consumer QR Preview</span>
            <ExternalLink className="w-3.5 h-3.5 text-charcoal-muted" />
          </a>

          {/* Backend Status indicator */}
          <div className="flex items-center justify-between px-2 text-[11px] text-charcoal-muted">
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendHealth === 'online' ? 'bg-forest-600' : 'bg-terracotta-600'
                }`}
              />
              {backendHealth === 'online' ? 'Core Connected' : 'Core Offline'}
            </span>
            <span className="font-mono text-[10px]">API v1.0</span>
          </div>

          {/* User Account Capsule */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-tint border border-border-warm">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-semibold text-charcoal truncate">{user?.name}</p>
              <p className="text-[11px] text-charcoal-muted font-mono truncate">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded text-charcoal-muted hover:text-terracotta-700 hover:bg-white transition"
              title="Sign Out"
              aria-label="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop overlay for mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-charcoal/20 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main Content Workspace */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        {/* Desktop Topbar */}
        <div className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-border-warm bg-white/70 backdrop-blur-xs sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono uppercase tracking-wider text-charcoal-muted">
              HoneyChain Provenance Platform
            </span>
            <span className="text-border-strong">•</span>
            <span className="text-xs font-semibold text-forest-700 bg-forest-50 border border-forest-200 px-2 py-0.5 rounded">
              {user?.role} ACTIVE
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Readiness Selector */}
            <div className="flex items-center gap-1 bg-surface-tint border border-border-warm rounded-md text-xs text-charcoal-muted p-0.5">
              {(['EN', 'HI', 'MR'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2 py-1 rounded font-medium text-xs transition ${
                    lang === l ? 'bg-forest-700 text-white font-semibold shadow-subtle' : 'hover:text-charcoal'
                  }`}
                >
                  {l === 'EN' ? 'English' : l === 'HI' ? 'हिन्दी' : 'मराठी'}
                </button>
              ))}
            </div>

            {/* Verification State */}
            <div className="flex items-center gap-1.5 text-xs text-forest-700 font-medium">
              <CheckCircle2 className="w-4 h-4 text-forest-600" />
              <span>Mass Conservation Enforced</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
