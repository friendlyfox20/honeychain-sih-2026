import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import {
  Users,
  Search,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Clock,
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-amber-500" /> User Directory & RBAC Roles
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
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

      {/* Role Counts */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(data.role_distribution).map(([r, count]) => (
            <div key={r} className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">{r}</span>
              <p className="text-xl font-black text-amber-400 mt-0.5">{count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search and Table */}
      <Card>
        <CardHeader
          title="Registered System Users"
          subtitle={`Showing ${filteredUsers.length} users (Password hashes strictly protected)`}
          action={
            <div className="relative w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search user or role..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          }
        />
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">Loading user directory...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">No users found.</div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                  <th className="py-3 px-6 font-semibold">User ID</th>
                  <th className="py-3 px-6 font-semibold">Full Name / Org</th>
                  <th className="py-3 px-6 font-semibold">Email</th>
                  <th className="py-3 px-6 font-semibold">Role</th>
                  <th className="py-3 px-6 font-semibold">Account Status</th>
                  <th className="py-3 px-6 font-semibold">Registered</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3 px-6 font-mono text-slate-400">#{u.id}</td>
                    <td className="py-3 px-6 font-semibold text-white">{u.name}</td>
                    <td className="py-3 px-6 font-mono text-slate-300">{u.email}</td>
                    <td className="py-3 px-6">
                      <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-6">
                      <Badge variant={u.is_active ? 'emerald' : 'rose'} size="sm">
                        {u.is_active ? 'ACTIVE' : 'INACTIVE'}
                      </Badge>
                    </td>
                    <td className="py-3 px-6 text-slate-400 flex items-center gap-1 pt-3.5">
                      <Clock className="w-3.5 h-3.5 opacity-60" />
                      {new Date(u.created_at).toLocaleDateString()}
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
