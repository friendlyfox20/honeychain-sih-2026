import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { AuditLogQueryResponse, AuditLogItem } from '../../types';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import {
  ShieldCheck,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAuditLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<AuditLogQueryResponse>('/api/v1/admin/audit-logs', {
        page,
        page_size: pageSize,
        action: actionFilter || undefined,
      });
      setLogs(res.items);
      setTotal(res.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, actionFilter]);

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal font-display tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-forest-700" />
            <span>Authoritative Audit Trail</span>
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
            Tamper-evident record of all lifecycle mutations, role actions, and blockchain anchors
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          onClick={fetchAuditLogs}
        >
          Refresh Logs
        </Button>
      </div>

      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filter Bar */}
      <div className="bg-white border border-border-warm rounded-xl p-3.5 flex items-center justify-between shadow-subtle text-xs">
        <div className="flex items-center gap-2.5">
          <Filter className="w-4 h-4 text-charcoal-muted" />
          <span className="font-semibold text-charcoal uppercase font-mono text-[11px]">Filter Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="bg-surface-subtle border border-border-warm text-xs text-charcoal rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20"
          >
            <option value="">All Actions</option>
            <option value="CREATE_BATCH">CREATE_BATCH</option>
            <option value="ADD_EVENT">ADD_EVENT</option>
            <option value="RECONCILE">RECONCILE</option>
            <option value="ADD_LAB_RECORD">ADD_LAB_RECORD</option>
            <option value="ADD_EVIDENCE">ADD_EVIDENCE</option>
            <option value="GENEALOGY_LINK">GENEALOGY_LINK</option>
            <option value="BLOCKCHAIN_ANCHOR">BLOCKCHAIN_ANCHOR</option>
            <option value="GENERATE_QR">GENERATE_QR</option>
          </select>
        </div>

        <span className="font-mono text-charcoal-muted text-[11px]">
          Total Events: <strong className="text-charcoal">{total}</strong>
        </span>
      </div>

      {/* Audit Table */}
      <div className="bg-white border border-border-warm rounded-xl overflow-hidden shadow-subtle">
        {loading ? (
          <div className="p-10 text-center text-xs text-charcoal-muted">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-forest-700" />
            Loading audit log records...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center text-xs text-charcoal-muted">
            No audit records found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-surface-subtle border-b border-border-subtle text-charcoal-muted uppercase font-mono text-[11px]">
                  <th className="py-3 px-5 font-semibold">ID</th>
                  <th className="py-3 px-4 font-semibold">Action</th>
                  <th className="py-3 px-4 font-semibold">Entity Type</th>
                  <th className="py-3 px-4 font-semibold">Entity ID</th>
                  <th className="py-3 px-4 font-semibold">Actor</th>
                  <th className="py-3 px-5 text-right font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-tint transition">
                    <td className="py-3 px-5 font-mono text-charcoal-muted">{log.id}</td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-surface-subtle border border-border-warm text-charcoal">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-charcoal-muted">{log.entity_type}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-charcoal">{log.entity_id}</td>
                    <td className="py-3 px-4 font-mono text-charcoal-muted">
                      Actor #{log.actor_id || 'SYS'}
                    </td>
                    <td className="py-3 px-5 text-right font-mono text-charcoal-muted text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-border-subtle bg-surface-subtle flex items-center justify-between text-xs text-charcoal-muted">
          <span>
            Page <strong className="text-charcoal">{page}</strong> of <strong className="text-charcoal">{totalPages}</strong>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-md border border-border-warm bg-white text-charcoal hover:bg-surface-tint disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-md border border-border-warm bg-white text-charcoal hover:bg-surface-tint disabled:opacity-40 disabled:cursor-not-allowed transition"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
