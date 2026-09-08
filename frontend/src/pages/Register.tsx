import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Hexagon, Lock, Mail, User, ArrowRight } from 'lucide-react';

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
    { value: 'BEEKEEPER', label: 'Beekeeper / Apiary', desc: 'Harvest, create batches, yield estimates' },
    { value: 'COLLECTOR', label: 'Collector / Aggregator', desc: 'Collect and log transit events' },
    { value: 'PROCESSOR', label: 'Processor / Bottler', desc: 'Filtration, batch splits, packaging' },
    { value: 'LAB', label: 'Laboratory Analyst', desc: 'Purity assays, chromatography reports' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 selection:bg-amber-500/30">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl shadow-amber-500/20 text-slate-950 mb-2 relative">
            <Hexagon className="w-8 h-8 fill-amber-950/20 stroke-[2]" />
            <span className="absolute font-black text-lg text-slate-950">H</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Create an Account</h1>
          <p className="text-sm text-slate-400">Join the HoneyChain Supply-Chain Integrity Network</p>
        </div>

        <div className="glass-card p-6 sm:p-8 rounded-3xl shadow-2xl border border-white/10 relative overflow-hidden">
          {error && (
            <Alert type="error" className="mb-5" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name / Organization
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sahyadri Apiaries"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

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
                  placeholder="contact@sahyadriapiary.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password (min 8 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Select Your Role in the Chain
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {roles.map((r) => (
                  <label
                    key={r.value}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                      role === r.value
                        ? 'bg-amber-500/10 border-amber-500/50 text-white'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white">{r.label}</span>
                      <input
                        type="radio"
                        name="role"
                        value={r.value}
                        checked={role === r.value}
                        onChange={() => setRole(r.value)}
                        className="accent-amber-500"
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 leading-tight">{r.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full mt-3" isLoading={loading}>
              Create Account & Sign In <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          <div className="mt-5 text-center text-xs text-slate-400">
            Already registered?{' '}
            <Link to="/login" className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
