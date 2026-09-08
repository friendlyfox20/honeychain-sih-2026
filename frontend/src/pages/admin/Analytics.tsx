import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { AnalyticsOverviewResponse } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import {
  BarChart3,
  Layers,
  Users,
  AlertTriangle,
  Lock,
  QrCode,
  FlaskConical,
  RefreshCw,
  Scale,
  Activity,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const AdminAnalytics: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<AnalyticsOverviewResponse>('/api/v1/admin/analytics/overview');
      setOverview(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load system analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const COLORS = ['#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#f43f5e', '#64748b'];

  const statusChartData = overview?.batch_status_counts
    ? Object.entries(overview.batch_status_counts).map(([name, value]) => ({ name, value }))
    : [];

  const activityData = overview
    ? [
        { name: 'Batches', count: overview.total_batches },
        { name: 'Events', count: overview.total_supply_chain_events },
        { name: 'Lab Tests', count: overview.total_lab_records },
        { name: 'Reconciled', count: overview.total_reconciliations },
        { name: 'Anchors', count: overview.total_blockchain_anchors },
      ]
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-amber-500" /> Operational Analytics & Auditing
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Aggregated system performance metrics, supply-chain flow distributions, and blockchain audit summaries
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          onClick={fetchAnalytics}
        >
          Refresh Analytics
        </Button>
      </div>

      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Total Batches</p>
          <h3 className="text-2xl font-black text-white mt-1">{overview?.total_batches || 0}</h3>
          <p className="text-[11px] text-amber-400 flex items-center gap-1 mt-1 font-mono">
            <Layers className="w-3 h-3" /> Authoritative Batches
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Supply Chain Events</p>
          <h3 className="text-2xl font-black text-white mt-1">{overview?.total_supply_chain_events || 0}</h3>
          <p className="text-[11px] text-sky-400 flex items-center gap-1 mt-1 font-mono">
            <Activity className="w-3 h-3" /> Custody Handshakes
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Blockchain Anchors</p>
          <h3 className="text-2xl font-black text-purple-400 mt-1">{overview?.total_blockchain_anchors || 0}</h3>
          <p className="text-[11px] text-purple-300 flex items-center gap-1 mt-1 font-mono">
            <Lock className="w-3 h-3" /> SHA-256 Proofs
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Flagged Anomalies</p>
          <h3 className={`text-2xl font-black mt-1 ${overview?.total_flagged_anomalies ? 'text-rose-400' : 'text-emerald-400'}`}>
            {overview?.total_flagged_anomalies || 0}
          </h3>
          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1 font-mono">
            <AlertTriangle className="w-3 h-3" /> Mass Inversions
          </p>
        </Card>
      </div>

      {/* Recharts Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Distribution */}
        <Card>
          <CardHeader title="Supply-Chain Operational Volume" subtitle="Recorded entity counts across lifecycle stages" />
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Batch Status Breakdown */}
        <Card>
          <CardHeader title="Batch Status Distribution" subtitle="Active lifecycle statuses across registered honey" />
          <CardContent className="h-72 flex items-center justify-center">
            {statusChartData.length === 0 ? (
              <p className="text-xs text-slate-500">No status distributions recorded.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
