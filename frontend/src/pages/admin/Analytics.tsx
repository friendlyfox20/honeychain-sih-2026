import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { AnalyticsOverviewResponse } from '../../types';
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

  const COLORS = ['#2D5A43', '#C88A2C', '#3D775B', '#D5CEC0', '#B84A39', '#5F645D'];

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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal font-display tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-forest-700" />
            <span>Tonnage & Operational Analytics</span>
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
            Aggregated platform volume, batch status distributions, and verification throughput
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          onClick={fetchAnalytics}
        >
          Refresh Data
        </Button>
      </div>

      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-border-warm rounded-xl p-4 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono text-charcoal-muted uppercase block">Authoritative Batches</span>
          <div className="text-2xl font-bold font-mono text-charcoal tabular-nums">
            {overview?.total_batches || 0}
          </div>
          <p className="text-[11px] text-charcoal-muted">Originating apiaries</p>
        </div>

        <div className="bg-white border border-border-warm rounded-xl p-4 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono text-charcoal-muted uppercase block">Custody Transfers</span>
          <div className="text-2xl font-bold font-mono text-charcoal tabular-nums">
            {overview?.total_supply_chain_events || 0}
          </div>
          <p className="text-[11px] text-charcoal-muted">Harvest & transit events</p>
        </div>

        <div className="bg-white border border-border-warm rounded-xl p-4 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono text-charcoal-muted uppercase block">Ledger Anchors</span>
          <div className="text-2xl font-bold font-mono text-forest-700 tabular-nums">
            {overview?.total_blockchain_anchors || 0}
          </div>
          <p className="text-[11px] text-charcoal-muted">Cryptographic state proofs</p>
        </div>

        <div className="bg-white border border-border-warm rounded-xl p-4 shadow-subtle space-y-1">
          <span className="text-[11px] font-mono text-charcoal-muted uppercase block">Active Consumers</span>
          <div className="text-2xl font-bold font-mono text-charcoal tabular-nums">
            {overview?.active_qr_codes || 0}
          </div>
          <p className="text-[11px] text-charcoal-muted">QR verification tokens</p>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Supply-Chain Velocity Chart */}
        <div className="bg-white border border-border-warm rounded-2xl p-6 shadow-subtle space-y-4">
          <div>
            <h2 className="text-base font-bold font-display text-charcoal">Supply-Chain Operations Velocity</h2>
            <p className="text-xs text-charcoal-muted">Entity volume by lifecycle milestone</p>
          </div>

          <div className="h-64 w-full text-xs font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#5F645D" fontSize={11} tickLine={false} />
                <YAxis stroke="#5F645D" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E7E3DA',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#1B1D19',
                  }}
                />
                <Bar dataKey="count" fill="#2D5A43" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Batch Status Distribution */}
        <div className="bg-white border border-border-warm rounded-2xl p-6 shadow-subtle space-y-4">
          <div>
            <h2 className="text-base font-bold font-display text-charcoal">Inventory Status Distribution</h2>
            <p className="text-xs text-charcoal-muted">Current batch lifecycle status breakdown</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {statusChartData.length === 0 ? (
              <p className="text-xs text-charcoal-muted">No status data available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E7E3DA',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#1B1D19',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-[11px] font-mono text-charcoal-muted">
            {statusChartData.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span>{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
