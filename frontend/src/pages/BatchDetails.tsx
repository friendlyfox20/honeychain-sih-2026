import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../api/client';
import {
  BatchDetailResponse,
  BatchTraceResponse,
  GenealogyGraphResponse,
  QRVerificationResponse,
  BlockchainAnchorResponse,
  BlockchainVerificationResponse,
} from '../types';
import { Button } from '../components/ui/Button';
import { StatusBadge, Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Alert } from '../components/ui/Alert';
import {
  ArrowLeft,
  ArrowRight,
  Layers,
  MapPin,
  Clock,
  Scale,
  ShieldCheck,
  QrCode,
  FileText,
  FlaskConical,
  GitFork,
  Plus,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Download,
  Lock,
  RefreshCw,
} from 'lucide-react';

export const BatchDetails: React.FC = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const { user, isBeekeeper, isCollector, isProcessor, isLab, isAdmin } = useAuth();

  const [batch, setBatch] = useState<BatchDetailResponse | null>(null);
  const [trace, setTrace] = useState<BatchTraceResponse | null>(null);
  const [genealogy, setGenealogy] = useState<GenealogyGraphResponse | null>(null);
  const [qrCode, setQrCode] = useState<QRVerificationResponse | null>(null);
  const [blockchainAnchors, setBlockchainAnchors] = useState<BlockchainAnchorResponse[]>([]);
  const [verifyResult, setVerifyResult] = useState<BlockchainVerificationResponse | null>(null);

  const [activeTab, setActiveTab] = useState<
    'trace' | 'reconciliation' | 'genealogy' | 'lab' | 'evidence' | 'blockchain' | 'qr'
  >('trace');

  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modal States
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventType, setEventType] = useState('HARVEST');
  const [eventLocation, setEventLocation] = useState('');
  const [eventQuantity, setEventQuantity] = useState<number | ''>('');
  const [eventNotes, setEventNotes] = useState('');

  const [reconcileModalOpen, setReconcileModalOpen] = useState(false);
  const [recInput, setRecInput] = useState<number | ''>('');
  const [recOutput, setRecOutput] = useState<number | ''>('');

  const [labModalOpen, setLabModalOpen] = useState(false);
  const [labTestName, setLabTestName] = useState('Physico-Chemical Purity Assay');
  const [labTestResult, setLabTestResult] = useState('Moisture: 17.2%, HMF: 14.5 mg/kg, C4: 0.0%');
  const [labStatus, setLabStatus] = useState('PASSED');
  const [labName, setLabName] = useState('National Bee Board Certified Assay Lab');
  const [labNotes, setLabNotes] = useState('Meets pure raw floral honey specifications.');

  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [evidenceType, setEvidenceType] = useState('CERTIFICATE');
  const [fileReference, setFileReference] = useState('');
  const [evidenceDescription, setEvidenceDescription] = useState('');

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [childBatchId, setChildBatchId] = useState('');
  const [relationType, setRelationType] = useState('SPLIT');
  const [transferQuantity, setTransferQuantity] = useState<number | ''>('');

  const [actionLoading, setActionLoading] = useState(false);

  const loadAllBatchData = async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const bData = await api.get<BatchDetailResponse>(`/api/v1/batches/${batchId}`);
      setBatch(bData);
      setRecInput(bData.quantity_kg);
      setRecOutput(bData.quantity_kg);
      setEventQuantity(bData.quantity_kg);

      try {
        const tData = await api.get<BatchTraceResponse>(`/api/v1/batches/${batchId}/trace`);
        setTrace(tData);
      } catch (err) {
        console.warn('Trace fetch error:', err);
      }

      try {
        const gData = await api.get<GenealogyGraphResponse>(`/api/v1/batches/${batchId}/genealogy`);
        setGenealogy(gData);
      } catch (err) {
        console.warn('Genealogy fetch error:', err);
      }

      try {
        const qData = await api.get<QRVerificationResponse>(`/api/v1/batches/${batchId}/qr`);
        setQrCode(qData);
      } catch {
        setQrCode(null);
      }

      try {
        const bcData = await api.get<BlockchainAnchorResponse[]>(`/api/v1/batches/${batchId}/blockchain`);
        setBlockchainAnchors(bcData);
      } catch {
        setBlockchainAnchors([]);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to load batch data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllBatchData();
  }, [batchId]);

  // Add Supply Chain Event
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await api.post(`/api/v1/batches/${batchId}/events`, {
        event_type: eventType,
        location: eventLocation.trim() || undefined,
        quantity_kg: eventQuantity === '' ? undefined : Number(eventQuantity),
        notes: eventNotes.trim() || undefined,
      });
      setFeedback({ type: 'success', message: `${eventType} event recorded successfully.` });
      setEventModalOpen(false);
      setEventNotes('');
      loadAllBatchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to record event.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Perform Mass Reconciliation Check
  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.post<any>(`/api/v1/batches/${batchId}/reconciliation`, {
        input_quantity_kg: Number(recInput),
        output_quantity_kg: Number(recOutput),
        notes: 'Operational batch reconciliation check',
      });
      setFeedback({
        type: res.status === 'PASS' ? 'success' : 'error',
        message: `Mass Conservation evaluation: ${res.status || 'RECORDED'}.`,
      });
      setReconcileModalOpen(false);
      loadAllBatchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Reconciliation failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Add Lab Record
  const handleAddLabRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await api.post(`/api/v1/batches/${batchId}/lab-records`, {
        test_name: labTestName.trim(),
        test_result: labTestResult.trim(),
        status: labStatus,
        lab_name: labName.trim() || undefined,
        notes: labNotes.trim() || undefined,
      });
      setFeedback({ type: 'success', message: 'Laboratory testing record saved.' });
      setLabModalOpen(false);
      loadAllBatchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save lab record.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Add Digital Evidence
  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await api.post(`/api/v1/batches/${batchId}/evidence`, {
        evidence_type: evidenceType,
        file_reference: fileReference.trim(),
        description: evidenceDescription.trim() || undefined,
      });
      setFeedback({ type: 'success', message: 'Digital evidence attached to batch.' });
      setEvidenceModalOpen(false);
      setFileReference('');
      setEvidenceDescription('');
      loadAllBatchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to attach evidence.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Link Genealogy
  const handleLinkGenealogy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await api.post('/api/v1/genealogy/link', {
        parent_batch_id: batchId,
        child_batch_id: childBatchId.trim(),
        relationship_type: relationType,
        quantity_transferred_kg: transferQuantity === '' ? undefined : Number(transferQuantity),
      });
      setFeedback({ type: 'success', message: `Lineage link established with ${childBatchId.trim()}.` });
      setLinkModalOpen(false);
      setChildBatchId('');
      setTransferQuantity('');
      loadAllBatchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to link genealogy.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Anchor to Blockchain
  const handleAnchorBlockchain = async () => {
    if (!batchId) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.post<BlockchainAnchorResponse>(`/api/v1/batches/${batchId}/blockchain/anchor`);
      setFeedback({
        type: 'success',
        message: `Canonical state hash anchored to ledger. Tx: ${res.transaction_hash.slice(0, 16)}...`,
      });
      loadAllBatchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Blockchain anchoring failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Verify Blockchain Integrity
  const handleVerifyBlockchain = async () => {
    if (!batchId) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.post<BlockchainVerificationResponse>(
        `/api/v1/batches/${batchId}/blockchain/verify`
      );
      setVerifyResult(res);
      setFeedback({
        type: res.status === 'VERIFIED' ? 'success' : 'error',
        message:
          res.status === 'VERIFIED'
            ? 'Cryptographic integrity verified: Database state matches canonical blockchain hash.'
            : 'Integrity alert: Current state deviates from anchored ledger state!',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Verification check failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  // Generate QR Code
  const handleGenerateQR = async () => {
    if (!batchId) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      const res = await api.post<QRVerificationResponse>(`/api/v1/batches/${batchId}/qr`);
      setQrCode(res);
      setFeedback({ type: 'success', message: 'Consumer verification QR code generated.' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'QR generation failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !batch) {
    return (
      <div className="p-16 text-center text-xs text-charcoal-muted">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-forest-700" />
        <p className="font-semibold text-charcoal text-sm">Opening Batch Record...</p>
        <p className="font-mono text-[11px] text-charcoal-muted mt-1">{batchId}</p>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="p-12 text-center text-xs text-charcoal-muted bg-white border border-border-warm rounded-2xl max-w-xl mx-auto">
        <AlertTriangle className="w-8 h-8 text-terracotta-600 mx-auto mb-2" />
        <h2 className="text-base font-bold text-charcoal">Batch Not Found</h2>
        <p className="text-xs text-charcoal-muted mt-1 mb-4">
          The requested identifier <span className="font-mono text-charcoal font-semibold">{batchId}</span> is not registered.
        </p>
        <Link to="/batches">
          <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-3.5 h-3.5" />}>
            Back to Batch Inventory
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Back Nav & Quick Refresh */}
      <div className="flex items-center justify-between">
        <Link
          to="/batches"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-muted hover:text-charcoal transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Batches</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-charcoal-muted">
            Created: {new Date(batch.created_at).toLocaleDateString()}
          </span>
          <button
            onClick={loadAllBatchData}
            className="p-1.5 rounded-md hover:bg-surface-tint text-charcoal-muted hover:text-charcoal transition"
            title="Refresh Batch Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {feedback && (
        <Alert type={feedback.type} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Authoritative Batch Identity Header */}
      <div className="bg-white border border-border-warm rounded-2xl p-6 shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-[11px] font-mono uppercase tracking-wider text-charcoal-muted bg-surface-tint border border-border-warm px-2 py-0.5 rounded">
                Authoritative Batch
              </span>
              <StatusBadge status={batch.status} size="sm" />
              <span className="text-xs font-mono font-medium text-forest-700 bg-forest-50 border border-forest-200 px-2 py-0.5 rounded">
                Source: {batch.source_type}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-mono text-charcoal tracking-tight">
              {batch.batch_id}
            </h1>

            <p className="text-xs sm:text-sm text-charcoal-muted flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-charcoal-muted" />
                {batch.source_reference || 'Apiary Colony Extraction'}
              </span>
              <span>•</span>
              <span>Registered on {new Date(batch.created_at).toLocaleDateString()}</span>
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-subtle border border-border-subtle text-left sm:text-right shrink-0">
            <span className="text-xs text-charcoal-muted font-medium">Batch Net Volume</span>
            <div className="text-2xl font-black font-mono text-charcoal tabular-nums mt-0.5">
              {batch.quantity_kg.toFixed(2)} <span className="text-xs font-sans font-semibold text-charcoal-muted">kg</span>
            </div>
          </div>
        </div>

        {/* Concise Evidence-Oriented Trust Summary Strip */}
        <div className="mt-6 pt-5 border-t border-border-subtle grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-surface-subtle border border-border-subtle">
            <span className="text-[10px] text-charcoal-muted uppercase font-mono block">Events Logged</span>
            <strong className="font-mono text-charcoal">{batch.events?.length || 0} stages</strong>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-subtle border border-border-subtle">
            <span className="text-[10px] text-charcoal-muted uppercase font-mono block">Mass Balance</span>
            <strong className="font-mono text-forest-700">
              {batch.reconciliations && batch.reconciliations.length > 0 ? 'CONSERVED' : 'PASS'}
            </strong>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-subtle border border-border-subtle">
            <span className="text-[10px] text-charcoal-muted uppercase font-mono block">Lab Assays</span>
            <strong className="font-mono text-charcoal">{batch.lab_records?.length || 0} tests</strong>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-subtle border border-border-subtle">
            <span className="text-[10px] text-charcoal-muted uppercase font-mono block">Certificates</span>
            <strong className="font-mono text-charcoal">{batch.evidences?.length || 0} files</strong>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-subtle border border-border-subtle">
            <span className="text-[10px] text-charcoal-muted uppercase font-mono block">Ledger State</span>
            <strong className="font-mono text-forest-700">
              {blockchainAnchors.length > 0 ? 'ANCHORED' : 'PENDING'}
            </strong>
          </div>

          <div className="p-2.5 rounded-lg bg-surface-subtle border border-border-subtle">
            <span className="text-[10px] text-charcoal-muted uppercase font-mono block">Consumer Seal</span>
            <strong className="font-mono text-charcoal">
              {qrCode?.is_active ? 'ACTIVE QR' : 'READY'}
            </strong>
          </div>
        </div>
      </div>

      {/* The Physical Honey Provenance Journey — Visual Chain of Custody */}
      <div className="bg-white border border-border-warm rounded-2xl p-5 shadow-subtle">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle mb-4">
          <span className="text-xs font-bold text-charcoal uppercase tracking-wider font-mono">
            Physical Provenance Route
          </span>
          <span className="text-[11px] text-charcoal-muted font-mono">
            {batch.events?.length || 0} Confirmed Custody Transfers
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
          {[
            { key: 'HIVE', name: 'Hive Origin', active: true },
            { key: 'HARVEST', name: 'Harvest', active: batch.events?.some((e) => e.event_type === 'HARVEST') },
            { key: 'COLLECTION', name: 'Collection', active: batch.events?.some((e) => e.event_type === 'COLLECTION') },
            { key: 'PROCESSING', name: 'Processing', active: batch.events?.some((e) => e.event_type === 'PROCESSING') },
            { key: 'LAB_TEST', name: 'Laboratory', active: (batch.lab_records?.length || 0) > 0 },
            { key: 'PACKAGING', name: 'Packaging', active: batch.events?.some((e) => e.event_type === 'PACKAGING') },
            { key: 'CONSUMER', name: 'Consumer Seal', active: qrCode?.is_active },
          ].map((stage, i) => (
            <div
              key={stage.key}
              className={`p-2.5 rounded-lg border text-center transition ${
                stage.active
                  ? 'bg-forest-50 border-forest-200 text-forest-800'
                  : 'bg-surface-subtle border-border-subtle text-charcoal-muted opacity-60'
              }`}
            >
              <span className="text-[10px] font-mono font-bold block mb-0.5">0{i + 1}</span>
              <p className="font-semibold text-xs leading-tight">{stage.name}</p>
              <span className="text-[10px] font-mono mt-1 block">
                {stage.active ? 'CONFIRMED' : 'AWAITING'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chapters / Technical Subview Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border-warm text-xs">
        {[
          { id: 'trace', label: 'Timeline & Events', count: batch.events?.length },
          { id: 'reconciliation', label: 'Mass Conservation', status: 'L1 RULE' },
          { id: 'genealogy', label: 'Genealogy & Lineage', count: ((genealogy?.ancestors?.length || 0) + (genealogy?.descendants?.length || 0)) },
          { id: 'lab', label: 'Laboratory Assays', count: batch.lab_records?.length },
          { id: 'evidence', label: 'Evidence & Documents', count: batch.evidences?.length },
          { id: 'blockchain', label: 'Ledger Integrity Anchor', count: blockchainAnchors.length },
          { id: 'qr', label: 'Consumer QR Dispatch', status: qrCode?.is_active ? 'ACTIVE' : undefined },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-forest-700 text-white font-semibold shadow-subtle'
                : 'text-charcoal-muted hover:text-charcoal hover:bg-surface-tint'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-surface-tint text-charcoal-muted border border-border-warm'
              }`}>
                {tab.count}
              </span>
            )}
            {tab.status && (
              <span className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-honey-100 text-honey-800'
              }`}>
                {tab.status}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* CHAPTER 1: TIMELINE & SUPPLY CHAIN EVENTS */}
      {activeTab === 'trace' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-charcoal font-display">Chronological Custody Timeline</h3>
              <p className="text-xs text-charcoal-muted">Physical transfer records and operational extractions</p>
            </div>
            {(isBeekeeper() || isProcessor() || isCollector() || isAdmin()) && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => setEventModalOpen(true)}
              >
                Record Event
              </Button>
            )}
          </div>

          <div className="bg-white border border-border-warm rounded-xl overflow-hidden shadow-subtle">
            {!batch.events || batch.events.length === 0 ? (
              <div className="p-10 text-center text-xs text-charcoal-muted">
                <Clock className="w-8 h-8 text-charcoal-muted opacity-40 mx-auto mb-2" />
                <p className="font-semibold text-charcoal">No custody events recorded yet</p>
                <p className="text-[11px] text-charcoal-muted mt-1">Record the initial HARVEST or COLLECTION event above.</p>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {batch.events.map((ev, idx) => (
                  <div key={ev.id || idx} className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-surface-tint transition">
                    <div className="flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-md bg-surface-subtle border border-border-warm flex items-center justify-center font-mono font-bold text-xs text-forest-700 shrink-0">
                        {idx + 1}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-charcoal">{ev.event_type}</span>
                          <span className="text-[11px] font-mono text-charcoal-muted px-1.5 py-0.5 rounded bg-surface-subtle border border-border-subtle">
                            Actor #{ev.actor_id}
                          </span>
                        </div>
                        {ev.location && (
                          <p className="text-xs text-charcoal flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-charcoal-muted" />
                            <span>{ev.location}</span>
                          </p>
                        )}
                        {ev.notes && <p className="text-xs text-charcoal-muted">{ev.notes}</p>}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {ev.quantity_kg !== undefined && ev.quantity_kg !== null && (
                        <span className="font-mono font-bold text-xs sm:text-sm text-charcoal tabular-nums block">
                          {ev.quantity_kg.toFixed(2)} kg
                        </span>
                      )}
                      <span className="text-[11px] text-charcoal-muted font-mono">
                        {new Date(ev.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHAPTER 2: MASS CONSERVATION RECONCILIATION */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-charcoal font-display">Mass Conservation Reconciliation</h3>
              <p className="text-xs text-charcoal-muted">
                Deterministic physical rule: Total Output cannot exceed Total Input (Output &le; Input)
              </p>
            </div>
            {(isProcessor() || isAdmin()) && (
              <Button
                variant="primary"
                size="sm"
                icon={<Scale className="w-4 h-4" />}
                onClick={() => setReconcileModalOpen(true)}
              >
                Perform Check
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-border-warm rounded-xl p-5 shadow-subtle space-y-1">
              <span className="text-[11px] font-mono text-charcoal-muted uppercase">Total Input Weight</span>
              <p className="text-2xl font-bold font-mono text-charcoal tabular-nums">
                {trace?.reconciliations?.[0]?.input_quantity_kg?.toFixed(2) || batch.quantity_kg.toFixed(2)} kg
              </p>
              <p className="text-[11px] text-charcoal-muted">Raw extraction / incoming batch custody</p>
            </div>

            <div className="bg-white border border-border-warm rounded-xl p-5 shadow-subtle space-y-1">
              <span className="text-[11px] font-mono text-charcoal-muted uppercase">Processed Output Weight</span>
              <p className="text-2xl font-bold font-mono text-charcoal tabular-nums">
                {trace?.reconciliations?.[0]?.output_quantity_kg?.toFixed(2) || batch.quantity_kg.toFixed(2)} kg
              </p>
              <p className="text-[11px] text-charcoal-muted">Final filtered & bottled net weight</p>
            </div>

            <div className="bg-forest-50 border border-forest-200 rounded-xl p-5 space-y-1">
              <span className="text-[11px] font-mono text-forest-700 uppercase">Conservation Status</span>
              <p className="text-2xl font-bold font-mono text-forest-800">
                {trace?.reconciliations?.[0]?.status || 'PASS'}
              </p>
              <p className="text-[11px] text-forest-700">
                Deterministic Layer 1 check: Physically conserved
              </p>
            </div>
          </div>

          {/* Reconciliation History Records */}
          <div className="bg-white border border-border-warm rounded-xl overflow-hidden shadow-subtle">
            <div className="p-4 border-b border-border-subtle font-mono text-xs font-bold text-charcoal">
              Reconciliation Audit Trail
            </div>
            {!trace || trace.reconciliations.length === 0 ? (
              <div className="p-8 text-center text-xs text-charcoal-muted">
                No formal mass-conservation evaluations recorded yet.
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {trace.reconciliations.map((rec, i) => (
                  <div key={rec.id || i} className="p-4 flex items-center justify-between text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold ${rec.status === 'PASS' ? 'text-forest-700' : 'text-terracotta-700'}`}>
                          {rec.status === 'PASS' ? 'CONSERVATION PASS' : 'DISCREPANCY FLAGGED'}
                        </span>
                        <span className="text-charcoal-muted">•</span>
                        <span className="text-charcoal font-mono">
                          Input: {rec.input_quantity_kg.toFixed(2)} kg &rarr; Output: {rec.output_quantity_kg.toFixed(2)} kg
                        </span>
                      </div>
                      {rec.reason && <p className="text-charcoal-muted">{rec.reason}</p>}
                    </div>

                    <div className="text-right font-mono text-charcoal-muted text-[11px]">
                      {rec.checked_at ? new Date(rec.checked_at).toLocaleString() : 'Recorded'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHAPTER 3: GENEALOGY & LINEAGE */}
      {activeTab === 'genealogy' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-charcoal font-display">Batch Genealogy & Tree</h3>
              <p className="text-xs text-charcoal-muted">Ancestry splits, mergers, and derived lots</p>
            </div>
            {(isProcessor() || isAdmin()) && (
              <Button
                variant="primary"
                size="sm"
                icon={<GitFork className="w-4 h-4" />}
                onClick={() => setLinkModalOpen(true)}
              >
                Link Relationship
              </Button>
            )}
          </div>

          <div className="bg-white border border-border-warm rounded-xl p-6 shadow-subtle">
            <div className="flex flex-col items-center space-y-4">
              {/* Current Root Batch Node */}
              <div className="p-4 rounded-xl bg-forest-50 border border-forest-200 text-center max-w-sm w-full">
                <span className="text-[10px] font-mono uppercase text-forest-700 font-bold block mb-1">
                  Active Reference Batch
                </span>
                <p className="font-mono font-bold text-base text-forest-900">{batch.batch_id}</p>
                <p className="text-xs text-forest-700 font-mono mt-0.5">{batch.quantity_kg.toFixed(2)} kg</p>
              </div>

              {/* Genealogy Links */}
              {genealogy?.links && genealogy.links.length > 0 ? (
                <div className="w-full space-y-3 pt-4 border-t border-border-subtle">
                  <span className="text-xs font-bold text-charcoal font-mono block">Lineage Handoffs:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {genealogy.links.map((link, idx) => (
                      <div key={idx} className="p-3.5 rounded-lg bg-surface-subtle border border-border-subtle text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-semibold text-charcoal-muted uppercase">{link.relationship_type}</span>
                          {link.quantity_transferred_kg && (
                            <span className="font-mono font-bold text-charcoal">{link.quantity_transferred_kg.toFixed(2)} kg</span>
                          )}
                        </div>
                        <p className="font-mono text-charcoal flex items-center gap-1.5">
                          <span>{link.parent_batch_id}</span>
                          <span>&rarr;</span>
                          <span className="font-bold text-forest-700">{link.child_batch_id}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-charcoal-muted text-center pt-2">
                  This batch is currently a primary single-source lot with no downstream splits or upstream mergers.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CHAPTER 4: LABORATORY ASSAYS */}
      {activeTab === 'lab' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-charcoal font-display">Physico-Chemical Lab Assays</h3>
              <p className="text-xs text-charcoal-muted">Testing for moisture, HMF content, and C4 sugar isotopic adulteration</p>
            </div>
            {(isLab() || isAdmin()) && (
              <Button
                variant="primary"
                size="sm"
                icon={<FlaskConical className="w-4 h-4" />}
                onClick={() => setLabModalOpen(true)}
              >
                Add Assay
              </Button>
            )}
          </div>

          <div className="bg-white border border-border-warm rounded-xl overflow-hidden shadow-subtle">
            {!trace || trace.lab_records.length === 0 ? (
              <div className="p-10 text-center text-xs text-charcoal-muted">
                <FlaskConical className="w-8 h-8 text-charcoal-muted opacity-40 mx-auto mb-2" />
                <p className="font-semibold text-charcoal">No laboratory assays uploaded yet</p>
                <p className="text-[11px] text-charcoal-muted mt-1">Authorized testing labs can attach chemical analyses.</p>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {trace.lab_records.map((lab, i) => (
                  <div key={lab.id || i} className="p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-charcoal font-display">{lab.test_name}</span>
                        <StatusBadge status={lab.status} size="sm" />
                      </div>
                      <p className="text-xs font-mono text-charcoal bg-surface-subtle p-2 rounded-md border border-border-subtle">
                        {lab.test_result}
                      </p>
                      <p className="text-xs text-charcoal-muted flex items-center gap-3">
                        <span>Lab: {lab.laboratory_name || 'Authorized Testing Facility'}</span>
                      </p>
                    </div>

                    <span className="text-[11px] font-mono text-charcoal-muted shrink-0">
                      {new Date(lab.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHAPTER 5: DIGITAL EVIDENCE */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-charcoal font-display">Attached Digital Evidence</h3>
              <p className="text-xs text-charcoal-muted">Cryptographic checksums and certificates of origin</p>
            </div>
            {(isProcessor() || isLab() || isAdmin()) && (
              <Button
                variant="primary"
                size="sm"
                icon={<FileText className="w-4 h-4" />}
                onClick={() => setEvidenceModalOpen(true)}
              >
                Attach Evidence
              </Button>
            )}
          </div>

          <div className="bg-white border border-border-warm rounded-xl overflow-hidden shadow-subtle">
            {!trace || trace.evidence.length === 0 ? (
              <div className="p-10 text-center text-xs text-charcoal-muted">
                <FileText className="w-8 h-8 text-charcoal-muted opacity-40 mx-auto mb-2" />
                <p className="font-semibold text-charcoal">No evidence documents attached</p>
                <p className="text-[11px] text-charcoal-muted mt-1">Upload testing certificates or transport receipts.</p>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {trace.evidence.map((ev, i) => (
                  <div key={ev.id || i} className="p-4 flex items-center justify-between gap-4 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-charcoal">{ev.evidence_type}</span>
                        <span className="text-[11px] text-charcoal-muted font-mono bg-surface-subtle px-1.5 py-0.5 rounded border border-border-subtle">
                          {ev.file_reference}
                        </span>
                      </div>
                      {ev.description && <p className="text-charcoal-muted text-xs">{ev.description}</p>}
                    </div>

                    <span className="text-[11px] font-mono text-charcoal-muted">
                      {new Date(ev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHAPTER 6: BLOCKCHAIN INTEGRITY ANCHOR */}
      {activeTab === 'blockchain' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-charcoal font-display">Cryptographic Integrity Ledger</h3>
              <p className="text-xs text-charcoal-muted">
                Canonical SHA-256 state hashing anchors historical truth so records cannot be retroactively altered
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<ShieldCheck className="w-4 h-4" />}
                onClick={handleVerifyBlockchain}
                isLoading={actionLoading}
              >
                Verify Integrity
              </Button>
              {isAdmin() && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Lock className="w-4 h-4" />}
                  onClick={handleAnchorBlockchain}
                  isLoading={actionLoading}
                >
                  Anchor State
                </Button>
              )}
            </div>
          </div>

          {verifyResult && (
            <Alert
              type={verifyResult.status === 'VERIFIED' ? 'success' : 'error'}
              onClose={() => setVerifyResult(null)}
            >
              <div className="space-y-1 font-mono text-xs">
                <p className="font-bold">INTEGRITY CHECK RESULT: {verifyResult.status}</p>
                <p>Anchored Hash: {verifyResult.anchored_hash}</p>
                <p>Current Hash:  {verifyResult.current_hash}</p>
              </div>
            </Alert>
          )}

          <div className="bg-white border border-border-warm rounded-xl overflow-hidden shadow-subtle">
            {blockchainAnchors.length === 0 ? (
              <div className="p-10 text-center text-xs text-charcoal-muted">
                <Lock className="w-8 h-8 text-charcoal-muted opacity-40 mx-auto mb-2" />
                <p className="font-semibold text-charcoal">No state anchor recorded yet</p>
                <p className="text-[11px] text-charcoal-muted mt-1">
                  Click "Anchor State" to compute the canonical SHA-256 hash and anchor to the ledger.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {blockchainAnchors.map((anc) => (
                  <div key={anc.id} className="p-5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-forest-700 bg-forest-50 border border-forest-200 px-2 py-0.5 rounded">
                          ANCHORED
                        </span>
                        <span className="font-mono text-charcoal-muted">Network: {anc.network}</span>
                      </div>
                      <span className="font-mono text-[11px] text-charcoal-muted">
                        {new Date(anc.anchored_at).toLocaleString()}
                      </span>
                    </div>

                    <div className="space-y-1 font-mono text-[11px] bg-surface-subtle p-3 rounded-lg border border-border-subtle">
                      <p className="truncate text-charcoal">
                        <strong className="text-charcoal-muted">Canonical SHA-256:</strong> {anc.canonical_hash}
                      </p>
                      <p className="truncate text-charcoal">
                        <strong className="text-charcoal-muted">Ledger Tx Hash:</strong> {anc.transaction_hash}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHAPTER 7: CONSUMER QR VERIFICATION */}
      {activeTab === 'qr' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-charcoal font-display">Consumer Verification & Packaging Seal</h3>
              <p className="text-xs text-charcoal-muted">
                Public unauthenticated QR token linking the physical bottle to its digital provenance story
              </p>
            </div>
            {!qrCode && (isProcessor() || isAdmin()) && (
              <Button
                variant="primary"
                size="sm"
                icon={<QrCode className="w-4 h-4" />}
                onClick={handleGenerateQR}
                isLoading={actionLoading}
              >
                Generate QR Code
              </Button>
            )}
          </div>

          {qrCode ? (
            <div className="bg-white border border-border-warm rounded-xl p-6 shadow-subtle flex flex-col sm:flex-row items-center gap-8">
              <div className="p-3 bg-white border border-border-warm rounded-xl shadow-subtle shrink-0">
                <img
                  src={qrCode.qr_image_base64}
                  alt={`HoneyChain QR for ${batch.batch_id}`}
                  className="w-48 h-48 rounded"
                />
              </div>

              <div className="space-y-4 flex-1">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-forest-700 bg-forest-50 border border-forest-200 px-2 py-0.5 rounded">
                      ACTIVE VERIFICATION TOKEN
                    </span>
                    <span className="text-[11px] text-charcoal-muted font-mono">Format: HMAC-SHA256</span>
                  </div>
                  <h4 className="text-base font-bold text-charcoal font-display">
                    Packaging Bottle Label Ready
                  </h4>
                  <p className="text-xs text-charcoal-muted leading-relaxed">
                    Consumers scanning this QR on retail honey jars will directly view the full honey provenance story without needing an account or software installation.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-surface-subtle border border-border-subtle font-mono text-xs break-all text-charcoal">
                  {qrCode.verification_url}
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  <a
                    href={qrCode.verification_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold shadow-subtle transition"
                  >
                    <span>Open Consumer Verification</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href={qrCode.qr_image_base64}
                    download={`HoneyChain-${batch.batch_id}-QR.png`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-surface-tint border border-border-warm text-charcoal text-xs font-semibold transition"
                  >
                    <Download className="w-3.5 h-3.5 text-charcoal-muted" />
                    <span>Download Label Graphic</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-border-warm rounded-xl p-10 text-center text-xs text-charcoal-muted shadow-subtle">
              <QrCode className="w-10 h-10 text-charcoal-muted opacity-40 mx-auto mb-2" />
              <p className="font-semibold text-charcoal text-sm">No verification QR generated for this batch</p>
              <p className="text-[11px] text-charcoal-muted mt-1 mb-4">
                Generate a unique cryptographic verification token for the retail packaging label.
              </p>
              <Button
                variant="primary"
                size="md"
                icon={<QrCode className="w-4 h-4" />}
                onClick={handleGenerateQR}
                isLoading={actionLoading}
              >
                Generate Packaging QR Token
              </Button>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD EVENT */}
      <Modal
        isOpen={eventModalOpen}
        onClose={() => setEventModalOpen(false)}
        title="Record Custody Event"
        subtitle={`Log a physical supply-chain transfer for ${batch.batch_id}`}
      >
        <form onSubmit={handleAddEvent} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg text-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20"
            >
              <option value="HARVEST">HARVEST (Hive extraction)</option>
              <option value="COLLECTION">COLLECTION (Aggregation point)</option>
              <option value="PROCESSING">PROCESSING (Filtration / moisture check)</option>
              <option value="PACKAGING">PACKAGING (Bottling into retail jars)</option>
              <option value="DISTRIBUTION">DISTRIBUTION (Dispatch to retailer)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Location / Facility</label>
              <input
                type="text"
                placeholder="e.g. Apiary 4, Sangli Regional Hub"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg text-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Stage Net Quantity (kg)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={eventQuantity}
                onChange={(e) => setEventQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg font-mono text-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Field Notes & Observations</label>
            <textarea
              rows={2}
              placeholder="e.g. Uncapped frames extracted via centrifuge at 24C"
              value={eventNotes}
              onChange={(e) => setEventNotes(e.target.value)}
              className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg text-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20"
            />
          </div>

          <div className="pt-4 border-t border-border-subtle flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" size="md" onClick={() => setEventModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={actionLoading}>
              Save Event Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: RECONCILE */}
      <Modal
        isOpen={reconcileModalOpen}
        onClose={() => setReconcileModalOpen(false)}
        title="Evaluate Mass Conservation"
        subtitle="Verify that recorded output does not violate physical conservation laws"
      >
        <form onSubmit={handleReconcile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Input Quantity (kg)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={recInput}
                onChange={(e) => setRecInput(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg font-mono text-charcoal focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Output Quantity (kg)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={recOutput}
                onChange={(e) => setRecOutput(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg font-mono text-charcoal focus:bg-white"
              />
            </div>
          </div>
          <p className="text-[11px] text-charcoal-muted">
            If Output &gt; Input, a deterministic physical anomaly will be flagged, overriding any ML estimations.
          </p>
          <div className="pt-4 border-t border-border-subtle flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" size="md" onClick={() => setReconcileModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={actionLoading}>
              Run Conservation Check
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: ADD LAB RECORD */}
      <Modal
        isOpen={labModalOpen}
        onClose={() => setLabModalOpen(false)}
        title="Record Laboratory Assay"
        subtitle="Physico-chemical purity parameters for honey authenticity"
      >
        <form onSubmit={handleAddLabRecord} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Test Name</label>
            <input
              type="text"
              required
              value={labTestName}
              onChange={(e) => setLabTestName(e.target.value)}
              className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg text-charcoal focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Test Results (Parameters)</label>
            <input
              type="text"
              required
              value={labTestResult}
              onChange={(e) => setLabTestResult(e.target.value)}
              className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg font-mono text-charcoal focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Purity Status</label>
              <select
                value={labStatus}
                onChange={(e) => setLabStatus(e.target.value)}
                className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg text-charcoal focus:bg-white"
              >
                <option value="PASSED">PASSED (Compliant)</option>
                <option value="FAILED">FAILED (Non-compliant)</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Laboratory Name</label>
              <input
                type="text"
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg text-charcoal focus:bg-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" size="md" onClick={() => setLabModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={actionLoading}>
              Save Laboratory Assay
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 4: ATTACH EVIDENCE */}
      <Modal
        isOpen={evidenceModalOpen}
        onClose={() => setEvidenceModalOpen(false)}
        title="Attach Digital Evidence"
        subtitle="Document certificates, dispatch manifests, or lab sign-offs"
      >
        <form onSubmit={handleAddEvidence} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Evidence Type</label>
            <select
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value)}
              className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg text-charcoal focus:bg-white"
            >
              <option value="CERTIFICATE">Laboratory Certificate</option>
              <option value="INVOICE">Transit Manifest / Waybill</option>
              <option value="IMAGE">Packaging Seal Photograph</option>
              <option value="DOCUMENT">Inspector Verification Sign-off</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Document Reference / URI</label>
            <input
              type="text"
              required
              placeholder="e.g. CERT-2026-APEX-8821.pdf"
              value={fileReference}
              onChange={(e) => setFileReference(e.target.value)}
              className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg font-mono text-charcoal focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="e.g. Accredited ISO/IEC 17025 purity testing certificate"
              value={evidenceDescription}
              onChange={(e) => setEvidenceDescription(e.target.value)}
              className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg text-charcoal focus:bg-white"
            />
          </div>

          <div className="pt-4 border-t border-border-subtle flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" size="md" onClick={() => setEvidenceModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={actionLoading}>
              Attach Evidence
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 5: LINK GENEALOGY */}
      <Modal
        isOpen={linkModalOpen}
        onClose={() => setLinkModalOpen(false)}
        title="Establish Batch Genealogy Link"
        subtitle={`Declare parent/child relationship originating from ${batch.batch_id}`}
      >
        <form onSubmit={handleLinkGenealogy} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Relationship Type</label>
            <select
              value={relationType}
              onChange={(e) => setRelationType(e.target.value)}
              className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg text-charcoal focus:bg-white"
            >
              <option value="SPLIT">SPLIT (Partition into sub-lots)</option>
              <option value="MERGE">MERGE (Combine with another lot)</option>
              <option value="DERIVED">DERIVED (Repackaged derivative)</option>
              <option value="TRANSFER">TRANSFER (Custody handover)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Child / Recipient Batch ID</label>
            <input
              type="text"
              required
              placeholder="e.g. BATCH-2026-0002"
              value={childBatchId}
              onChange={(e) => setChildBatchId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg font-mono text-charcoal focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Quantity Transferred (kg)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={transferQuantity}
              onChange={(e) => setTransferQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg font-mono text-charcoal focus:bg-white"
            />
          </div>

          <div className="pt-4 border-t border-border-subtle flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" size="md" onClick={() => setLinkModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="md" isLoading={actionLoading}>
              Establish Lineage Link
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
