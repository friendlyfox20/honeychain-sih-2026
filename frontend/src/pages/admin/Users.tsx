import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import {
  Users,
  Search,
  RefreshCw,
} from 'lucide-react';

interface UserAnalyticsData {
  total_users: number;
  active_users: number;
  role_distribution: Record<string, number>;
  recent_users: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
    created_at: string;
  }>;
}

export const AdminUsers: React.FC = () => {
  const [data, setData] = useState<UserAnalyticsData | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<UserAnalyticsData>('/api/v1/admin/analytics/users');
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = data?.recent_users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal font-display tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-forest-700" />
            <span>Operator Directory & Roles</span>
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
            Registered actors across beekeepers, collectors, processors, laboratories, and administrators
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          onClick={fetchUsers}
        >
          Refresh Directory
        </Button>
      </div>

      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Role Counts Strip */}
      {data && data.role_distribution && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(data.role_distribution).map(([r, count]) => (
            <div key={r} className="p-3.5 rounded-xl bg-white border border-border-warm shadow-subtle">
              <span className="text-[10px] font-mono uppercase font-bold text-charcoal-muted block">{r}</span>
              <p className="text-xl font-bold font-mono text-charcoal mt-0.5 tabular-nums">{count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search Input */}
      <div className="bg-white border border-border-warm rounded-xl p-3.5 shadow-subtle">
        <div className="relative">
          <Search className="w-4 h-4 text-charcoal-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by operator name, email address, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-surface-subtle border border-border-warm rounded-lg text-charcoal placeholder:text-charcoal-muted/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20"
          />
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white border border-border-warm rounded-xl overflow-hidden shadow-subtle">
        {loading ? (
          <div className="p-10 text-center text-xs text-charcoal-muted">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-forest-700" />
            Loading registered operators...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-10 text-center text-xs text-charcoal-muted">
            No matching operators found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-surface-subtle border-b border-border-subtle text-charcoal-muted uppercase font-mono text-[11px]">
                  <th className="py-3 px-5 font-semibold">Operator Name</th>
                  <th className="py-3 px-4 font-semibold">Email Address</th>
                  <th className="py-3 px-4 font-semibold">Role</th>
                  <th className="py-3 px-4 font-semibold text-center">Status</th>
                  <th className="py-3 px-5 text-right font-semibold">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-tint transition">
                    <td className="py-3.5 px-5 font-semibold text-charcoal">{u.name}</td>
                    <td className="py-3.5 px-4 font-mono text-charcoal-muted">{u.email}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface-subtle border border-border-warm text-charcoal font-semibold">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                        u.is_active ? 'bg-forest-50 text-forest-700 border border-forest-200' : 'bg-terracotta-50 text-terracotta-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-forest-600' : 'bg-terracotta-600'}`} />
                        {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right font-mono text-charcoal-muted text-[11px]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
