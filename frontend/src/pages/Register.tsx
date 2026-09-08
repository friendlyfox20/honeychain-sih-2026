import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Lock, Mail, User, ArrowRight } from 'lucide-react';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('BEEKEEPER');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password, role);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'BEEKEEPER', label: 'Beekeeper / Apiary', desc: 'Harvest logging, batch origination, yield estimates' },
    { value: 'COLLECTOR', label: 'Collector / Aggregator', desc: 'Regional collection points & transit handoffs' },
    { value: 'PROCESSOR', label: 'Processor / Bottler', desc: 'Filtration, batch splits, and packaging lots' },
    { value: 'LAB', label: 'Laboratory Analyst', desc: 'Purity assays and chemical compliance reports' },
  ];

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4 sm:p-6 selection:bg-amber-200 selection:text-amber-900">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-forest-700 text-white font-bold font-mono text-base shadow-subtle mb-1">
            HC
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal font-display tracking-tight">
            Register Operator Account
          </h1>
          <p className="text-xs text-charcoal-muted max-w-sm mx-auto leading-relaxed">
            Join the HoneyChain Supply-Chain Integrity & Traceability Network
          </p>
        </div>

        <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-subtle border border-border-warm space-y-5">
          {error && (
            <Alert type="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Full Name / Organization
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-charcoal-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Beekeeping Farm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-surface-subtle border border-border-warm rounded-lg text-charcoal text-xs placeholder:text-charcoal-muted/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20 focus:border-forest-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-charcoal-muted absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="ramesh@honeyapiary.org"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-surface-subtle border border-border-warm rounded-lg text-charcoal text-xs placeholder:text-charcoal-muted/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20 focus:border-forest-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Password (min. 8 characters)
              </label>
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

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-2">
                Supply Chain Role
              </label>
              <div className="space-y-2">
                {roles.map((r) => (
                  <label
                    key={r.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                      role === r.value
                        ? 'bg-forest-50 border-forest-600 text-forest-900'
                        : 'bg-surface-subtle border-border-warm text-charcoal hover:bg-surface-tint'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={role === r.value}
                      onChange={() => setRole(r.value)}
                      className="mt-0.5 text-forest-700 focus:ring-forest-600"
                    />
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold font-display">{r.label}</p>
                      <p className="text-[11px] text-charcoal-muted leading-tight">{r.desc}</p>
                    </div>
                  </label>
                ))}
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
              Create Operator Account
            </Button>
          </form>
        </div>

        <div className="text-center text-xs text-charcoal-muted">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-forest-700 hover:underline">
            Sign in to existing account
          </Link>
        </div>
      </div>
    </div>
  );
};
