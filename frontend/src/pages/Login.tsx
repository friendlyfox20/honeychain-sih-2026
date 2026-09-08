import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Hexagon, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
  };

  const demoAccounts = [
    { role: 'BEEKEEPER', email: 'beekeeper@honeychain.com', desc: 'Harvest & Batch Origination' },
    { role: 'COLLECTOR', email: 'collector@honeychain.com', desc: 'Collection Events' },
    { role: 'PROCESSOR', email: 'processor@honeychain.com', desc: 'Filtration & Packaging' },
    { role: 'LAB', email: 'lab@honeychain.com', desc: 'Purity & Lab Testing' },
    { role: 'ADMIN', email: 'admin@honeychain.com', desc: 'Analytics & Monitoring' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 selection:bg-amber-500/30">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl shadow-amber-500/20 text-slate-950 mb-2 relative">
            <Hexagon className="w-8 h-8 fill-amber-950/20 stroke-[2]" />
            <span className="absolute font-black text-lg text-slate-950">H</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Welcome to HoneyChain</h1>
          <p className="text-sm text-slate-400">SIH 2026 Honey Supply-Chain Traceability & Integrity Platform</p>
        </div>

        {/* Form Card */}
        <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {error && (
            <Alert type="error" className="mb-5" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@honeychain.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full mt-2" isLoading={loading}>
              Sign In to HoneyChain <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Quick SIH Demo Logins */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" /> SIH Demo Accounts
              </span>
              <span className="text-[10px] text-slate-500">Click to autofill</span>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => setDemoUser(acc.email)}
                  className="w-full text-left px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-750 hover:border-amber-500/40 transition flex items-center justify-between group"
                >
                  <div className="truncate">
                    <span className="text-[11px] font-mono font-bold text-amber-400 group-hover:text-amber-300 mr-2">
                      [{acc.role}]
                    </span>
                    <span className="text-[11px] text-slate-400">{acc.desc}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">fill</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 text-center text-xs text-slate-400">
            Need a new beekeeper or supply partner account?{' '}
            <Link to="/register" className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2">
              Register here
            </Link>
          </div>
        </div>

        {/* Public Verification Link */}
        <div className="text-center">
          <a
            href="/verify/lGEh2msu6hnOs5lyufEZVR0NqEBF4gWbopTEMTzenpo"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-full transition"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Are you a consumer scanning a jar? Open Public Verification</span>
          </a>
        </div>
      </div>
    </div>
  );
};
