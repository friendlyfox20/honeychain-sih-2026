import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { BatchListResponse, BatchItem } from '../types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import {
  Layers,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  Plus,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  FileCheck,
  Scale,
  RefreshCw,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, isBeekeeper, isCollector, isProcessor, isLab, isAdmin } = useAuth();
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get<BatchListResponse>('/api/v1/batches', { page: 1, size: 5 });
      setBatches(res.items);
      setTotalCount(res.total);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 overflow-hidden border border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-slate-900/80 to-slate-900/60 shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xs uppercase font-bold tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full">
                {user?.role} Portal
              </span>
              <span className="text-slate-400 text-xs">• HoneyChain SIH 2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time monitoring of traceable honey batches, reconciliation integrity checks, and blockchain anchoring proofs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
              onClick={fetchDashboardData}
            >
              Refresh
            </Button>
            {(isBeekeeper() || isProcessor() || isCollector() || isAdmin()) && (
              <Link to="/batches">
                <Button size="md" icon={<Plus className="w-4 h-4" />}>
                  Create Batch
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <Card className="hover:border-slate-700/80 transition">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Batches</p>
              <h3 className="text-2xl sm:text-3xl font-black text-white">{totalCount}</h3>
              <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                <TrendingUp className="w-3 h-3" /> Authoritative DB Records
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Layers className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-700/80 transition">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mass Conservation</p>
              <h3 className="text-2xl sm:text-3xl font-black text-white">Authoritative</h3>
              <p className="text-[11px] text-slate-400 font-medium">Output &le; Input Enforcement</p>
            </div>
            <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <Scale className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-700/80 transition">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Anomaly Engine</p>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-400">2-Layer</h3>
              <p className="text-[11px] text-slate-400 font-medium">Rules + ML Classification</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-slate-700/80 transition">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Blockchain Layer</p>
              <h3 className="text-2xl sm:text-3xl font-black text-white">SHA-256</h3>
              <p className="text-[11px] text-amber-400 font-medium">Cryptographic Proof Anchors</p>
            </div>
            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <Sparkles className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role-Specific Shortcuts & Physical Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Physical Flow Visual Guide */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="HoneyChain Provenance Journey"
            subtitle="The physical honey supply-chain journey verified by authoritative event logs and lab testing"
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { step: '1. Apiary Hive', desc: 'Harvest & batch creation', role: 'BEEKEEPER', color: 'border-amber-500/40 text-amber-400' },
                { step: '2. Transit Hub', desc: 'Secure collection & storage', role: 'COLLECTOR', color: 'border-sky-500/40 text-sky-400' },
                { step: '3. Processing & Lab', desc: 'Filtration & purity assay', role: 'PROCESSOR / LAB', color: 'border-emerald-500/40 text-emerald-400' },
                { step: '4. Consumer Bottle', desc: 'QR code verification & proof', role: 'CONSUMER', color: 'border-purple-500/40 text-purple-400' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl bg-slate-900/60 border ${item.color} flex flex-col justify-between`}
                >
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-70">
                      {item.role}
                    </span>
                    <h4 className="text-xs font-bold text-white mt-1">{item.step}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 space-y-1">
                <span className="font-bold text-amber-300">Core Principle: TRACEABILITY + EVIDENCE + INTEGRITY</span>
                <p className="text-slate-400 leading-relaxed">
                  HoneyChain does not replace laboratory testing or claim blockchain creates truth out of nothing. It records verifiable custody, enforces deterministic mass conservation, and anchors cryptographic hashes to guarantee data immutability.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Action Station */}
        <Card>
          <CardHeader title="Quick Actions" subtitle={`Available operations for ${user?.role}`} />
          <CardContent className="space-y-2.5">
            <Link
              to="/batches"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition group"
            >
              <div className="flex items-center gap-3">
                <Layers className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-semibold text-slate-200">Inspect Honey Batches</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
            </Link>

            <Link
              to="/anomalies"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition group"
            >
              <div className="flex items-center gap-3">
                <Scale className="w-4 h-4 text-sky-400" />
                <span className="text-xs font-semibold text-slate-200">2-Layer Anomaly Test</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
            </Link>

            <Link
              to="/predictions"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition group"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-slate-200">ML Honey Yield & Production</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
            </Link>

            <Link
              to="/voice"
              className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition group"
            >
              <div className="flex items-center gap-3">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-200">Voice Query Assistant</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
            </Link>

            {isAdmin() && (
              <Link
                to="/admin/analytics"
                className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition group"
              >
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-300">Admin Command Center</span>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </Link>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Batches Table */}
      <Card>
        <CardHeader
          title="Recent Honey Batches"
          subtitle="Latest recorded batches with live traceability links"
          action={
            <Link to="/batches" className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1">
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading batches...</div>
          ) : batches.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No batches recorded yet.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                  <th className="py-3.5 px-6 font-semibold">Batch ID</th>
                  <th className="py-3.5 px-6 font-semibold">Source Type</th>
                  <th className="py-3.5 px-6 font-semibold">Source Ref</th>
                  <th className="py-3.5 px-6 font-semibold">Quantity (kg)</th>
                  <th className="py-3.5 px-6 font-semibold">Status</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {batches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3 px-6 font-mono font-bold text-amber-400">{batch.batch_id}</td>
                    <td className="py-3 px-6 text-slate-300">{batch.source_type}</td>
                    <td className="py-3 px-6 text-slate-400">{batch.source_reference || '—'}</td>
                    <td className="py-3 px-6 font-mono text-white font-semibold">{batch.quantity_kg} kg</td>
                    <td className="py-3 px-6">
                      <StatusBadge status={batch.status} size="sm" />
                    </td>
                    <td className="py-3 px-6 text-right">
                      <Link
                        to={`/batches/${batch.batch_id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 font-semibold text-[11px] transition"
                      >
                        Inspect Trace <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
