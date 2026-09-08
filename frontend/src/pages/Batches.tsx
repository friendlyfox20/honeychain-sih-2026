import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import { BatchListResponse, BatchItem } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { StatusBadge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import {
  Layers,
  Plus,
  Search,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Filter,
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
      setModalError('Batch identifier is required.');
      return;
    }
    if (quantityKg === '' || quantityKg <= 0) {
      setModalError('Please specify a positive extraction quantity in kilograms.');
      return;
    }

    setCreateLoading(true);
    try {
      await api.post('/api/v1/batches', {
        batch_id: newBatchId.trim(),
        source_type: sourceType,
        source_reference: sourceReference.trim() || undefined,
        quantity_kg: Number(quantityKg),
      });
      setSuccessMessage(`Batch ${newBatchId.trim()} created successfully.`);
      setIsModalOpen(false);
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

  const filteredBatches = batches.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.batch_id.toLowerCase().includes(q) ||
      (b.source_reference && b.source_reference.toLowerCase().includes(q))
    );
  });

  const totalPages = Math.ceil(total / size) || 1;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header with Search & Register Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal font-display tracking-tight">
            Traceable Honey Batches
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
            Authoritative registry of raw harvests, aggregation lots, and packaged units
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={fetchBatches}
          >
            Refresh
          </Button>

          {(isBeekeeper() || isProcessor() || isCollector() || isAdmin()) && (
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setModalError(null);
                setIsModalOpen(true);
              }}
            >
              Register Batch
            </Button>
          )}
        </div>
      </div>

      {successMessage && (
        <Alert type="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white border border-border-warm rounded-xl p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shadow-subtle">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-charcoal-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Batch ID or apiary reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-surface-subtle border border-border-warm rounded-lg text-charcoal placeholder:text-charcoal-muted/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20 focus:border-forest-600"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-surface-subtle border border-border-warm rounded-lg px-2.5 py-1.5 text-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20"
          >
            <option value="">All Statuses</option>
            <option value="CREATED">Created</option>
            <option value="HARVESTED">Harvested</option>
            <option value="COLLECTED">Collected</option>
            <option value="IN_PROCESSING">In Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="FLAGGED">Flagged</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceTypeFilter}
            onChange={(e) => {
              setSourceTypeFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs bg-surface-subtle border border-border-warm rounded-lg px-2.5 py-1.5 text-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20"
          >
            <option value="">All Sources</option>
            <option value="HIVE">Hive Apiary</option>
            <option value="COLLECTOR">Collector</option>
            <option value="PROCESSOR">Processor</option>
          </select>
        </div>
      </div>

      {/* Batches Table / Record Cards */}
      <div className="bg-white border border-border-warm rounded-xl overflow-hidden shadow-subtle">
        {loading ? (
          <div className="p-12 text-center text-xs text-charcoal-muted">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-forest-700" />
            Querying authoritative batch inventory...
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="p-12 text-center text-xs text-charcoal-muted">
            <Layers className="w-8 h-8 mx-auto mb-2 opacity-40 text-charcoal-muted" />
            <p className="font-semibold text-charcoal text-sm">No batches match current criteria</p>
            <p className="text-[11px] text-charcoal-muted mt-1">Try modifying your search or clearing filters.</p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface-subtle border-b border-border-subtle text-charcoal-muted uppercase tracking-wider font-mono text-[11px]">
                    <th className="py-3 px-5 font-semibold">Batch Identifier</th>
                    <th className="py-3 px-4 font-semibold">Source Type</th>
                    <th className="py-3 px-4 font-semibold">Origin / Reference</th>
                    <th className="py-3 px-4 font-semibold text-right">Net Weight</th>
                    <th className="py-3 px-4 font-semibold text-center">Status</th>
                    <th className="py-3 px-4 font-semibold">Date Registered</th>
                    <th className="py-3 px-5 text-right font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredBatches.map((b) => (
                    <tr key={b.batch_id} className="hover:bg-surface-tint transition group">
                      <td className="py-3.5 px-5 font-mono font-bold text-charcoal">
                        <Link
                          to={`/batches/${b.batch_id}`}
                          className="hover:text-forest-700 transition flex items-center gap-1.5"
                        >
                          {b.batch_id}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-charcoal-muted">
                        <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-surface-subtle border border-border-warm">
                          {b.source_type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-charcoal truncate max-w-xs">
                        {b.source_reference || 'Apiary Colony'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-charcoal tabular-nums">
                        {b.quantity_kg.toFixed(2)} kg
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={b.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-charcoal-muted font-mono text-[11px]">
                        {new Date(b.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <Link
                          to={`/batches/${b.batch_id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-forest-700 hover:text-forest-800 transition"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Record List */}
            <div className="md:hidden divide-y divide-border-subtle">
              {filteredBatches.map((b) => (
                <Link
                  key={b.batch_id}
                  to={`/batches/${b.batch_id}`}
                  className="p-4 flex flex-col space-y-2 hover:bg-surface-tint transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm text-charcoal">{b.batch_id}</span>
                    <StatusBadge status={b.status} size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-charcoal-muted">
                    <span>Source: {b.source_type} ({b.source_reference || 'Apiary'})</span>
                    <span className="font-mono font-bold text-charcoal tabular-nums">{b.quantity_kg.toFixed(2)} kg</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-charcoal-muted font-mono pt-1">
                    <span>{new Date(b.created_at).toLocaleDateString()}</span>
                    <span className="text-forest-700 font-semibold flex items-center gap-0.5">
                      Open Batch <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-4 border-t border-border-subtle bg-surface-subtle flex items-center justify-between text-xs text-charcoal-muted">
          <span>
            Showing <strong className="text-charcoal">{filteredBatches.length}</strong> of{' '}
            <strong className="text-charcoal">{total}</strong> batches
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
            <span className="font-mono font-medium text-charcoal">
              {page} / {totalPages}
            </span>
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

      {/* Register Batch Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Honey Batch"
        subtitle="Originate an authoritative physical lot in the HoneyChain ledger"
      >
        <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
          {modalError && (
            <Alert type="error" onClose={() => setModalError(null)}>
              {modalError}
            </Alert>
          )}

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Batch Identifier <span className="text-terracotta-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. BATCH-2026-0002"
              value={newBatchId}
              onChange={(e) => setNewBatchId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg font-mono text-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20 focus:border-forest-600"
            />
            <p className="text-[11px] text-charcoal-muted mt-1">Must be unique across the supply chain.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Source Origin</label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg text-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20"
              >
                <option value="HIVE">Hive / Apiary Colony</option>
                <option value="COLLECTOR">Collector Aggregation</option>
                <option value="PROCESSOR">Processing Facility</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">
                Net Quantity (kg) <span className="text-terracotta-600">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                required
                placeholder="e.g. 250.00"
                value={quantityKg}
                onChange={(e) => setQuantityKg(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg font-mono text-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20 focus:border-forest-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">
              Location / Apiary Reference
            </label>
            <input
              type="text"
              placeholder="e.g. Apiary 4, Mahabaleshwar Valley"
              value={sourceReference}
              onChange={(e) => setSourceReference(e.target.value)}
              className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg text-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20"
            />
          </div>

          <div className="pt-4 border-t border-border-subtle flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={createLoading}
            >
              Confirm Batch Registration
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
