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
  Plus,
  ArrowRight,
  RefreshCw,
  Compass,
  Mic,
  Calendar,
  CheckCircle2,
  Scale,
  MapPin,
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
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Editorial Field Workspace Greeting Banner */}
      <div className="bg-surface-tint border border-border-warm rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-forest-700 bg-forest-100/70 border border-forest-200 px-2 py-0.5 rounded">
                {user?.role} Workspace
              </span>
              <span className="text-xs text-charcoal-muted font-mono">• Apiary Region: Maharashtra / Karnataka</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-charcoal font-display tracking-tight">
              Good day, {user?.name}
            </h1>
            <p className="text-sm text-charcoal-muted max-w-xl leading-relaxed">
              {isBeekeeper()
                ? 'Your registered apiaries and colonies are active. Record new honey extractions or evaluate seasonal yield estimates below.'
                : 'Operational overview of traceable honey lots, deterministic mass balances, and laboratory verification records.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
              onClick={fetchDashboardData}
            >
              Update
            </Button>
            {(isBeekeeper() || isProcessor() || isCollector() || isAdmin()) && (
              <Link to="/batches">
                <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
                  New Batch
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Primary Field Action Strip (Tailored for Rural & Operational Touch Use >= 44px) */}
        <div className="mt-6 pt-6 border-t border-border-warm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {isBeekeeper() ? (
            <>
              <Link
                to="/batches"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-border-warm hover:border-forest-600 hover:shadow-subtle transition group min-h-[52px]"
              >
                <div className="w-9 h-9 rounded-lg bg-forest-50 text-forest-700 border border-forest-200 flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-charcoal group-hover:text-forest-700 transition">Record Harvest</p>
                  <p className="text-[11px] text-charcoal-muted truncate">Log raw hive extraction</p>
                </div>
              </Link>

              <Link
                to="/batches"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-border-warm hover:border-forest-600 hover:shadow-subtle transition group min-h-[52px]"
              >
                <div className="w-9 h-9 rounded-lg bg-surface-tint text-charcoal border border-border-warm flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-charcoal group-hover:text-forest-700 transition">My Hives & Batches</p>
                  <p className="text-[11px] text-charcoal-muted truncate">{totalCount} total registered</p>
                </div>
              </Link>

              <Link
                to="/predictions"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-border-warm hover:border-forest-600 hover:shadow-subtle transition group min-h-[52px]"
              >
                <div className="w-9 h-9 rounded-lg bg-honey-100 text-honey-800 border border-honey-200 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-charcoal group-hover:text-forest-700 transition">Yield Estimate</p>
                  <p className="text-[11px] text-charcoal-muted truncate">Forecast extraction kg</p>
                </div>
              </Link>

              <Link
                to="/voice"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-border-warm hover:border-forest-600 hover:shadow-subtle transition group min-h-[52px]"
              >
                <div className="w-9 h-9 rounded-lg bg-forest-50 text-forest-700 border border-forest-200 flex items-center justify-center shrink-0">
                  <Mic className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-charcoal group-hover:text-forest-700 transition">Ask HoneyChain</p>
                  <p className="text-[11px] text-charcoal-muted truncate">Speak query in Hindi/Eng</p>
                </div>
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/batches"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-border-warm hover:border-forest-600 transition min-h-[52px]"
              >
                <div className="w-9 h-9 rounded-lg bg-forest-50 text-forest-700 border border-forest-200 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-charcoal">Traceable Batches</p>
                  <p className="text-[11px] text-charcoal-muted">{totalCount} active inventory</p>
                </div>
              </Link>

              <Link
                to="/anomalies"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-border-warm hover:border-forest-600 transition min-h-[52px]"
              >
                <div className="w-9 h-9 rounded-lg bg-honey-100 text-honey-800 border border-honey-200 flex items-center justify-center shrink-0">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-charcoal">Mass Balance</p>
                  <p className="text-[11px] text-charcoal-muted">Output &le; Input check</p>
                </div>
              </Link>

              <Link
                to="/anomalies"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-border-warm hover:border-forest-600 transition min-h-[52px]"
              >
                <div className="w-9 h-9 rounded-lg bg-terracotta-50 text-terracotta-700 border border-terracotta-200 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-charcoal">Anomaly Signals</p>
                  <p className="text-[11px] text-charcoal-muted">Deterministic override</p>
                </div>
              </Link>

              <Link
                to="/predictions"
                className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-border-warm hover:border-forest-600 transition min-h-[52px]"
              >
                <div className="w-9 h-9 rounded-lg bg-surface-tint text-charcoal border border-border-warm flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-charcoal">Honey Intelligence</p>
                  <p className="text-[11px] text-charcoal-muted">ML decision support</p>
                </div>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* The Physical Honey Provenance Journey — Clear Grounded Visual Sequence */}
      <div className="bg-white border border-border-warm rounded-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-5">
          <div>
            <h2 className="text-base font-bold text-charcoal font-display">The Honey Traceability Journey</h2>
            <p className="text-xs text-charcoal-muted">
              Physical custody handoffs and deterministic verification checkpoints
            </p>
          </div>
          <span className="text-[11px] font-mono text-forest-700 bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
            Chain of Custody
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
          {[
            { step: '01', title: 'Hive Origin', desc: 'Apiary registration & geolocation' },
            { step: '02', title: 'Harvest', desc: 'Raw extraction & initial weight' },
            { step: '03', title: 'Collection', desc: 'Regional aggregation & custody' },
            { step: '04', title: 'Processing', desc: 'Filtration & moisture check' },
            { step: '05', title: 'Laboratory', desc: 'HMF, moisture & C4 assay' },
            { step: '06', title: 'Packaging', desc: 'Lot serialization & QR seal' },
            { step: '07', title: 'Consumer', desc: 'Public tamper-proof verify' },
          ].map((item, idx) => (
            <div
              key={item.step}
              className="p-3 rounded-xl bg-surface-subtle border border-border-subtle flex flex-col items-center justify-between space-y-1.5"
            >
              <span className="text-[10px] font-mono font-bold text-charcoal-muted bg-white border border-border-warm px-1.5 py-0.5 rounded">
                {item.step}
              </span>
              <p className="font-semibold text-charcoal text-xs">{item.title}</p>
              <p className="text-[10px] text-charcoal-muted leading-tight">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Batches Ledger Table */}
      <div className="bg-white border border-border-warm rounded-2xl overflow-hidden shadow-subtle">
        <div className="p-5 border-b border-border-subtle flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-charcoal font-display">Recent Traceable Batches</h2>
            <p className="text-xs text-charcoal-muted">Recorded extractions and custody lots in your workspace</p>
          </div>
          <Link
            to="/batches"
            className="text-xs font-semibold text-forest-700 hover:text-forest-800 flex items-center gap-1 transition"
          >
            <span>View All ({totalCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-charcoal-muted">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-forest-700" />
            Loading recent batches...
          </div>
        ) : batches.length === 0 ? (
          <div className="p-10 text-center text-xs text-charcoal-muted">
            <Layers className="w-8 h-8 mx-auto mb-2 text-charcoal-muted opacity-40" />
            <p className="font-medium text-charcoal">No batches registered yet</p>
            <p className="text-[11px] text-charcoal-muted mt-0.5">Click "New Batch" to record your first honey harvest.</p>
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {batches.map((batch) => (
              <Link
                key={batch.batch_id}
                to={`/batches/${batch.batch_id}`}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-tint transition group"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-9 h-9 rounded-lg bg-surface-tint text-charcoal flex items-center justify-center font-mono font-bold text-xs border border-border-warm shrink-0 group-hover:border-forest-600 transition">
                    {batch.source_type[0]}
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs sm:text-sm text-charcoal group-hover:text-forest-700 transition">
                        {batch.batch_id}
                      </span>
                      <StatusBadge status={batch.status} size="sm" />
                    </div>
                    <p className="text-xs text-charcoal-muted flex items-center gap-3">
                      <span>Source: {batch.source_type} ({batch.source_reference || 'Apiary'})</span>
                      <span>•</span>
                      <span>{new Date(batch.created_at).toLocaleDateString()}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 pl-12 sm:pl-0">
                  <div className="text-left sm:text-right">
                    <span className="text-xs sm:text-sm font-bold font-mono text-charcoal tabular-nums">
                      {batch.quantity_kg.toFixed(2)} kg
                    </span>
                    <p className="text-[11px] text-charcoal-muted font-medium">Recorded Volume</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-charcoal-muted group-hover:text-forest-700 group-hover:translate-x-0.5 transition" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
