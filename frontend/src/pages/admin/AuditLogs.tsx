import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { AuditLogQueryResponse, AuditLogItem } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import {
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Clock,
  Terminal,
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-amber-500" /> Immutable System Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
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
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-semibold uppercase">Action Filter:</span>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="">All Actions</option>
              <option value="CREATE_BATCH">CREATE_BATCH</option>
              <option value="ADD_EVENT">ADD_EVENT</option>
              <option value="RECONCILE">RECONCILE</option>
              <option value="ADD_LAB_RECORD">ADD_LAB_RECORD</option>
              <option value="ADD_EVIDENCE">ADD_EVIDENCE</option>
              <option value="GENEALOGY_LINK">GENEALOGY_LINK</option>
              <option value="ANCHOR_BLOCKCHAIN">ANCHOR_BLOCKCHAIN</option>
              <option value="GENERATE_QR">GENERATE_QR</option>
            </select>
          </div>
          <span className="text-xs text-slate-500 font-mono">{total} total audit entries</span>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading audit trail...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">No audit logs matching criteria.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                  <th className="py-3 px-6 font-semibold">Timestamp</th>
                  <th className="py-3 px-6 font-semibold">Action</th>
                  <th className="py-3 px-6 font-semibold">Actor Role</th>
                  <th className="py-3 px-6 font-semibold">Entity Type</th>
                  <th className="py-3 px-6 font-semibold">Entity ID</th>
                  <th className="py-3 px-6 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/50 transition text-[11px]">
                    <td className="py-3 px-6 text-slate-400 font-sans whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-6 text-amber-400 font-bold">{log.action}</td>
                    <td className="py-3 px-6 font-sans">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-bold">
                        {log.actor_role || 'SYSTEM'}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-slate-300">{log.entity_type || '—'}</td>
                    <td className="py-3 px-6 text-white font-bold">{log.entity_id || '—'}</td>
                    <td className="py-3 px-6 text-slate-400 truncate max-w-xs font-sans" title={log.details || ''}>
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  icon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  icon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
