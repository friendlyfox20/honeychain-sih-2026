import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

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
    { role: 'BEEKEEPER', email: 'beekeeper@honeychain.com', desc: 'Harvest & batch extraction' },
    { role: 'COLLECTOR', email: 'collector@honeychain.com', desc: 'Aggregation & transit handoffs' },
    { role: 'PROCESSOR', email: 'processor@honeychain.com', desc: 'Filtration, mass balance & packaging' },
    { role: 'LAB', email: 'lab@honeychain.com', desc: 'Purity & chemical assay verification' },
    { role: 'ADMIN', email: 'admin@honeychain.com', desc: 'Analytics, user directory & system health' },
  ];

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 sm:p-6 selection:bg-amber-200 selection:text-amber-900">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-forest-700 text-white font-bold font-mono text-base shadow-subtle mb-1">
            HC
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal font-display tracking-tight">
            Sign In to HoneyChain
          </h1>
          <p className="text-xs text-charcoal-muted max-w-sm mx-auto leading-relaxed">
            SIH 2026 Honey Supply-Chain Traceability & Authenticity Platform
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-subtle border border-border-warm space-y-5">
          {error && (
            <Alert type="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-charcoal-muted absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="name@organization.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-surface-subtle border border-border-warm rounded-lg text-charcoal text-xs placeholder:text-charcoal-muted/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20 focus:border-forest-600"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-charcoal">Password</label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-charcoal-muted absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-surface-subtle border border-border-warm rounded-lg text-charcoal text-xs placeholder:text-charcoal-muted/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20 focus:border-forest-600"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={loading}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In to HoneyChain
            </Button>
          </form>

          {/* Quick Demo Accounts for SIH Jury Evaluation */}
          <div className="pt-5 border-t border-border-subtle space-y-2">
            <span className="text-[11px] font-mono uppercase font-bold text-charcoal-muted block">
              SIH 2026 Demo Access Roles:
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => setDemoUser(acc.email)}
                  className="p-2.5 rounded-lg bg-surface-subtle hover:bg-surface-tint border border-border-subtle text-left flex items-center justify-between transition group min-h-[44px]"
                >
                  <div>
                    <span className="font-mono font-bold text-xs text-charcoal group-hover:text-forest-700 transition">
                      [{acc.role}]
                    </span>
                    <p className="text-[11px] text-charcoal-muted">{acc.desc}</p>
                  </div>
                  <span className="text-[10px] font-mono text-forest-700 bg-forest-50 border border-forest-200 px-1.5 py-0.5 rounded shrink-0">
                    Auto-fill
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Nav */}
        <div className="text-center text-xs text-charcoal-muted space-y-2">
          <p>
            Don't have an operator account?{' '}
            <Link to="/register" className="font-semibold text-forest-700 hover:underline">
              Register New Organization
            </Link>
          </p>
          <p className="text-[11px] text-charcoal-muted/80">
            HoneyChain SIH 2026 — Secure RBAC Enabled
          </p>
        </div>
      </div>
    </div>
  );
};
