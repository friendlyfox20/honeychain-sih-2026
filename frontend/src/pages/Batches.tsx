import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { BatchListResponse, BatchItem } from '../types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import {
  Layers,
  Plus,
  Search,
  Filter,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
} from 'lucide-react';

export const Batches: React.FC = () => {
  const { user, isBeekeeper, isCollector, isProcessor, isAdmin } = useAuth();
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [size] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Create Batch Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBatchId, setNewBatchId] = useState('');
  const [sourceType, setSourceType] = useState('HIVE');
  const [sourceReference, setSourceReference] = useState('');
  const [quantityKg, setQuantityKg] = useState<number | ''>('');
  const [createLoading, setCreateLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await api.get<BatchListResponse>('/api/v1/batches', {
        page,
        size,
        status: statusFilter || undefined,
        source_type: sourceTypeFilter || undefined,
      });
      setBatches(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load batches:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, [page, statusFilter, sourceTypeFilter]);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!newBatchId.trim()) {
      setModalError('Batch ID is required.');
      return;
    }
    if (typeof quantityKg !== 'number' || quantityKg <= 0) {
      setModalError('Quantity must be greater than 0 kg.');
      return;
    }

    setCreateLoading(true);
    try {
      await api.post('/api/v1/batches', {
        batch_id: newBatchId.trim(),
        source_type: sourceType,
        source_reference: sourceReference.trim() || undefined,
        quantity_kg: quantityKg,
      });
      setIsModalOpen(false);
      setSuccessMessage(`Successfully created batch ${newBatchId.trim()}!`);
      // Reset form
      setNewBatchId('');
      setSourceReference('');
      setQuantityKg('');
      fetchBatches();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create batch.');
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredBatches = batches.filter((b) =>
    b.batch_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.source_reference && b.source_reference.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalPages = Math.ceil(total / size) || 1;

  const canCreateBatch = isBeekeeper() || isCollector() || isProcessor() || isAdmin();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Layers className="w-8 h-8 text-amber-500" /> Honey Batches
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Registered honey production batches with provenance tracking and blockchain anchors
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchBatches}
          >
            Refresh
          </Button>
          {canCreateBatch && (
            <Button
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setModalError(null);
                setNewBatchId(`BATCH-2026-${Math.floor(1000 + Math.random() * 9000)}`);
                setIsModalOpen(true);
              }}
            >
              New Batch
            </Button>
          )}
        </div>
      </div>

      {successMessage && (
        <Alert type="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Filter and Search Bar */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search batch ID or source..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
              >
                <option value="">All Statuses</option>
                <option value="CREATED">CREATED</option>
                <option value="HARVESTED">HARVESTED</option>
                <option value="COLLECTED">COLLECTED</option>
                <option value="IN_PROCESSING">IN_PROCESSING</option>
                <option value="PACKAGED">PACKAGED</option>
                <option value="COMPLETED">COMPLETED</option>
                <option value="FLAGGED">FLAGGED</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Source:</span>
              <select
                value={sourceTypeFilter}
                onChange={(e) => {
                  setSourceTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
              >
                <option value="">All Sources</option>
                <option value="HIVE">HIVE</option>
                <option value="HARVEST">HARVEST</option>
                <option value="COLLECTION">COLLECTION</option>
                <option value="MERGED_BATCH">MERGED_BATCH</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Batches Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
              Loading honey batches...
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm space-y-3">
              <Layers className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="font-semibold text-white">No batches found</p>
              <p className="text-xs max-w-sm mx-auto">
                No batches match your current search or filters. Create your first batch to start recording traceability.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                  <th className="py-3.5 px-6 font-semibold">Batch ID</th>
                  <th className="py-3.5 px-6 font-semibold">Origin Source</th>
                  <th className="py-3.5 px-6 font-semibold">Source Ref</th>
                  <th className="py-3.5 px-6 font-semibold">Initial Quantity</th>
                  <th className="py-3.5 px-6 font-semibold">Current Status</th>
                  <th className="py-3.5 px-6 font-semibold">Created Date</th>
                  <th className="py-3.5 px-6 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3.5 px-6 font-mono font-bold text-amber-400">{b.batch_id}</td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-slate-300">
                        {b.source_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-300 font-medium">{b.source_reference || '—'}</td>
                    <td className="py-3.5 px-6 font-mono font-semibold text-white">{b.quantity_kg} kg</td>
                    <td className="py-3.5 px-6">
                      <StatusBadge status={b.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-6 text-slate-400 flex items-center gap-1.5 pt-4">
                      <Clock className="w-3.5 h-3.5 opacity-60" />
                      {new Date(b.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        to={`/batches/${b.batch_id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 font-semibold text-[11px] transition"
                      >
                        Inspect Trace <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>
                Page {page} of {totalPages} ({total} total batches)
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

      {/* Create Batch Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Traceable Batch"
        subtitle="Originate a new raw honey batch from an apiary hive or harvest"
      >
        {modalError && (
          <Alert type="error" className="mb-4" onClose={() => setModalError(null)}>
            {modalError}
          </Alert>
        )}

        <form onSubmit={handleCreateBatch} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Batch Identifier
            </label>
            <input
              type="text"
              required
              value={newBatchId}
              onChange={(e) => setNewBatchId(e.target.value)}
              placeholder="e.g. BATCH-2026-0002"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Source Type
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
              >
                <option value="HIVE">HIVE</option>
                <option value="HARVEST">HARVEST</option>
                <option value="COLLECTION">COLLECTION</option>
                <option value="MERGED_BATCH">MERGED_BATCH</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Quantity (kg)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={quantityKg}
                onChange={(e) => setQuantityKg(parseFloat(e.target.value) || '')}
                placeholder="e.g. 50"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Source Reference (Optional)
            </label>
            <input
              type="text"
              value={sourceReference}
              onChange={(e) => setSourceReference(e.target.value)}
              placeholder="e.g. HIVE-MAH-042 or Western Ghats Zone B"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createLoading}>
              Create Honey Batch
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
