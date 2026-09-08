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
  SupplyChainEvent,
  ReconciliationRecord,
} from '../types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
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
  Sparkles,
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
  const [labTestName, setLabTestName] = useState('Purity & Fructose-Glucose Analysis');
  const [labTestResult, setLabTestResult] = useState('Moisture: 17.5%, F/G: 1.12, HMF: 10 mg/kg');
  const [labStatus, setLabStatus] = useState('PASSED');
  const [labName, setLabName] = useState('Apex Quality Testing Lab');
  const [labNotes, setLabNotes] = useState('Conforms to raw honey standards.');

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
      // 1. Batch details
      const bData = await api.get<BatchDetailResponse>(`/api/v1/batches/${batchId}`);
      setBatch(bData);
      setRecInput(bData.quantity_kg);
      setRecOutput(bData.quantity_kg);
      setEventQuantity(bData.quantity_kg);

      // 2. Full Trace
      try {
        const tData = await api.get<BatchTraceResponse>(`/api/v1/batches/${batchId}/trace`);
        setTrace(tData);
      } catch (err) {
        console.warn('Trace fetch error:', err);
      }

      // 3. Genealogy
      try {
        const gData = await api.get<GenealogyGraphResponse>(`/api/v1/batches/${batchId}/genealogy`);
        setGenealogy(gData);
      } catch (err) {
        console.warn('Genealogy fetch error:', err);
      }

      // 4. QR Code
      try {
        const qData = await api.get<QRVerificationResponse>(`/api/v1/batches/${batchId}/qr`);
        setQrCode(qData);
      } catch {
        setQrCode(null);
      }

      // 5. Blockchain Anchors
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

  // Handlers
  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId || typeof eventQuantity !== 'number' || eventQuantity <= 0) return;
    setActionLoading(true);
    try {
      await api.post(`/api/v1/batches/${batchId}/events`, {
        event_type: eventType,
        location: eventLocation || undefined,
        quantity_kg: eventQuantity,
        notes: eventNotes || undefined,
      });
      setEventModalOpen(false);
      setFeedback({ type: 'success', message: `Added ${eventType} event successfully!` });
      loadAllBatchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to add event.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReconcile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId || typeof recInput !== 'number' || typeof recOutput !== 'number') return;
    setActionLoading(true);
    try {
      const res = await api.post<ReconciliationRecord>(`/api/v1/batches/${batchId}/reconcile`, {
        input_quantity_kg: recInput,
        output_quantity_kg: recOutput,
      });
      setReconcileModalOpen(false);
      setFeedback({
        type: 'success',
        message: `Reconciliation evaluated: ${res.status} (Loss: ${res.loss_quantity_kg} kg)`,
      });
      loadAllBatchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Reconciliation failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddLabRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId) return;
    setActionLoading(true);
    try {
      await api.post(`/api/v1/batches/${batchId}/lab`, {
        test_name: labTestName,
        test_result: labTestResult,
        status: labStatus,
        laboratory_name: labName,
        notes: labNotes,
      });
      setLabModalOpen(false);
      setFeedback({ type: 'success', message: 'Laboratory testing record logged successfully!' });
      loadAllBatchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to add lab record.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId || !fileReference.trim()) return;
    setActionLoading(true);
    try {
      await api.post(`/api/v1/batches/${batchId}/evidence`, {
        evidence_type: evidenceType,
        file_reference: fileReference.trim(),
        description: evidenceDescription || undefined,
      });
      setEvidenceModalOpen(false);
      setFeedback({ type: 'success', message: 'Digital evidence metadata attached!' });
      loadAllBatchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to attach evidence.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleLinkGenealogy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId || !childBatchId.trim() || typeof transferQuantity !== 'number') return;
    setActionLoading(true);
    try {
      await api.post('/api/v1/batches/relationships', {
        parent_batch_id: batchId,
        child_batch_id: childBatchId.trim(),
        relationship_type: relationType,
        quantity_transferred_kg: transferQuantity,
      });
      setLinkModalOpen(false);
      setFeedback({ type: 'success', message: `Linked batch ${childBatchId} as ${relationType}!` });
      loadAllBatchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Genealogy linking failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnchorBlockchain = async () => {
    if (!batchId) return;
    setActionLoading(true);
    try {
      const res = await api.post<BlockchainAnchorResponse>(`/api/v1/batches/${batchId}/blockchain/anchor`, {
        record_type: 'BATCH_STATE_SNAPSHOT',
      });
      setFeedback({
        type: 'success',
        message: `Cryptographic proof anchored! TX Hash: ${res.transaction_hash.slice(0, 16)}...`,
      });
      loadAllBatchData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Blockchain anchoring failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyBlockchain = async () => {
    if (!batchId) return;
    setActionLoading(true);
    try {
      const res = await api.post<BlockchainVerificationResponse>(`/api/v1/batches/${batchId}/blockchain/verify`);
      setVerifyResult(res);
      setFeedback({
        type: res.status === 'VERIFIED' ? 'success' : 'error',
        message: res.status === 'VERIFIED' ? 'Database state strictly matches blockchain proof!' : 'Integrity mismatch detected!',
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Integrity verification failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!batchId) return;
    setActionLoading(true);
    try {
      const res = await api.post<QRVerificationResponse>(`/api/v1/batches/${batchId}/qr`);
      setQrCode(res);
      setFeedback({ type: 'success', message: 'Secure QR Code generated!' });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to generate QR.' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-slate-400">
        <div className="w-10 h-10 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-semibold text-white">Loading batch {batchId}...</p>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Batch not found</h2>
        <p className="text-sm">Batch "{batchId}" could not be located in the HoneyChain registry.</p>
        <Link to="/batches">
          <Button variant="secondary" icon={<ArrowLeft className="w-4 h-4" />}>
            Back to Batches
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/batches"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                {batch.batch_id}
              </h1>
              <StatusBadge status={batch.status} size="md" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
              <span>Source: <strong className="text-slate-200">{batch.source_type}</strong> ({batch.source_reference || 'N/A'})</span>
              <span>• Initial: <strong className="text-amber-400">{batch.quantity_kg} kg</strong></span>
              <span>• Registered: {new Date(batch.created_at).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />}
            onClick={loadAllBatchData}
          >
            Refresh Data
          </Button>
          {qrCode && qrCode.verification_url && (
            <a
              href={`/verify/${qrCode.verification_url.split('/').pop()}`}
              target="_blank"
              rel="noreferrer"
            >
              <Button size="sm" variant="outline" icon={<ExternalLink className="w-3.5 h-3.5 text-emerald-400" />}>
                Consumer Page
              </Button>
            </a>
          )}
        </div>
      </div>

      {feedback && (
        <Alert type={feedback.type} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      {/* Quick Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Current Quantity</p>
          <p className="text-lg font-black font-mono text-white mt-0.5">{batch.quantity_kg} kg</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Events Logged</p>
          <p className="text-lg font-black text-amber-400 mt-0.5">{batch.events.length}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Lab Tests</p>
          <p className="text-lg font-black text-emerald-400 mt-0.5">{batch.lab_records.length}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Blockchain Status</p>
          <p className="text-sm font-black text-purple-400 mt-1 uppercase">
            {trace?.blockchain_status || 'NOT_ANCHORED'}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: 'trace', label: 'Trace Timeline', icon: <Layers className="w-4 h-4" /> },
          { id: 'reconciliation', label: 'Mass Reconciliation', icon: <Scale className="w-4 h-4" /> },
          { id: 'genealogy', label: 'Genealogy & Lineage', icon: <GitFork className="w-4 h-4" /> },
          { id: 'lab', label: 'Lab Records', icon: <FlaskConical className="w-4 h-4" /> },
          { id: 'evidence', label: 'Digital Evidence', icon: <FileText className="w-4 h-4" /> },
          { id: 'blockchain', label: 'Blockchain Integrity', icon: <Lock className="w-4 h-4" /> },
          { id: 'qr', label: 'QR Verification', icon: <QrCode className="w-4 h-4" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition shrink-0 ${
              activeTab === tab.id
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: TRACE TIMELINE */}
      {activeTab === 'trace' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white tracking-tight">Chronological Supply Chain Trace</h3>
            {(isBeekeeper() || isCollector() || isProcessor() || isAdmin()) && (
              <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setEventModalOpen(true)}>
                Add Movement Event
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="p-6">
              {batch.events.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No events logged for this batch yet. Record harvest or collection to start the timeline.
                </div>
              ) : (
                <div className="relative border-l border-amber-500/30 ml-4 space-y-8 pl-6">
                  {batch.events.map((evt, idx) => (
                    <div key={evt.id || idx} className="relative group">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 ring-4 ring-slate-950" />

                      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 hover:border-amber-500/30 transition space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white font-mono">{evt.event_type}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                              {evt.quantity_kg} kg
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(evt.timestamp).toLocaleString()}
                          </span>
                        </div>

                        {evt.location && (
                          <p className="text-xs text-slate-300 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{evt.location}</span>
                          </p>
                        )}

                        {evt.notes && (
                          <p className="text-xs text-slate-400 italic bg-slate-950/50 p-2.5 rounded-xl border border-slate-850">
                            "{evt.notes}"
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: RECONCILIATION */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Mass-Conservation Quantity Reconciliation</h3>
              <p className="text-xs text-slate-400 mt-0.5">Authoritative rule enforcement: Processed/Bottled quantity cannot exceed Raw input quantity</p>
            </div>
            {(isProcessor() || isBeekeeper() || isAdmin()) && (
              <Button size="sm" icon={<Scale className="w-3.5 h-3.5" />} onClick={() => setReconcileModalOpen(true)}>
                Evaluate Reconciliation
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader title="Reconciliation Records" subtitle="Historical quantity audits for this batch" />
              <CardContent className="space-y-4">
                {batch.reconciliations.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No reconciliation records evaluated yet. Click "Evaluate Reconciliation" to test mass conservation.
                  </div>
                ) : (
                  batch.reconciliations.map((rec, i) => (
                    <div
                      key={rec.id || i}
                      className={`p-4 rounded-2xl border ${
                        rec.status === 'PASS'
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : 'bg-rose-500/5 border-rose-500/20'
                      } space-y-2`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={rec.status === 'PASS' ? 'emerald' : 'rose'}>
                            {rec.status}
                          </Badge>
                          <span className="text-xs text-slate-300 font-mono">
                            Input: {rec.input_quantity_kg} kg &rarr; Output: {rec.output_quantity_kg} kg
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono font-bold">
                          Loss: {rec.loss_quantity_kg} kg
                        </span>
                      </div>
                      {rec.reason && <p className="text-xs text-slate-400">{rec.reason}</p>}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Quantity Conservation Rule" subtitle="HoneyChain physical law" />
              <CardContent className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] text-amber-300">
                  Harvest: 50 kg<br />
                  &darr; Processing: 48.5 kg (Valid loss)<br />
                  &darr; Packaging: 48 kg (Valid)<br />
                  &ne; 60 kg (Discrepancy / Injected Volume)
                </div>
                <p className="text-slate-400">
                  Deterministic physics overrides statistical models. If quantity expands in downstream processing without an upstream merge record, an anomaly is authoritative.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 3: GENEALOGY */}
      {activeTab === 'genealogy' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Batch Lineage & Genealogy</h3>
              <p className="text-xs text-slate-400 mt-0.5">Parent-child lineage links for SPLIT, MERGE, DERIVED, and TRANSFER events</p>
            </div>
            {(isProcessor() || isBeekeeper() || isCollector() || isAdmin()) && (
              <Button size="sm" icon={<GitFork className="w-3.5 h-3.5" />} onClick={() => setLinkModalOpen(true)}>
                Link Child Batch
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader
                title="Upstream Ancestors"
                subtitle={`${genealogy?.ancestors.length || 0} upstream origins`}
              />
              <CardContent>
                {!genealogy || genealogy.ancestors.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 text-center">No upstream parent batches (Origination batch).</p>
                ) : (
                  <div className="space-y-2">
                    {genealogy.ancestors.map((anc) => (
                      <div key={anc.batch_id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-amber-400 text-xs">{anc.batch_id}</span>
                          <p className="text-[11px] text-slate-400">{anc.source_type} • {anc.quantity_kg} kg</p>
                        </div>
                        <StatusBadge status={anc.status} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="Downstream Descendants"
                subtitle={`${genealogy?.descendants.length || 0} downstream batches`}
              />
              <CardContent>
                {!genealogy || genealogy.descendants.length === 0 ? (
                  <p className="text-xs text-slate-400 p-4 text-center">No child batches derived or split from this batch yet.</p>
                ) : (
                  <div className="space-y-2">
                    {genealogy.descendants.map((desc) => (
                      <div key={desc.batch_id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-amber-400 text-xs">{desc.batch_id}</span>
                          <p className="text-[11px] text-slate-400">{desc.source_type} • {desc.quantity_kg} kg</p>
                        </div>
                        <StatusBadge status={desc.status} size="sm" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Relationship Links */}
          {genealogy && genealogy.links.length > 0 && (
            <Card>
              <CardHeader title="Genealogy Lineage Links" subtitle="Documented split & merge transfers" />
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="p-3 px-6">Parent Batch</th>
                      <th className="p-3 px-6">Type</th>
                      <th className="p-3 px-6">Child Batch</th>
                      <th className="p-3 px-6">Quantity Transferred</th>
                      <th className="p-3 px-6">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {genealogy.links.map((lnk, i) => (
                      <tr key={i} className="hover:bg-slate-900/40">
                        <td className="p-3 px-6 font-mono text-amber-400 font-semibold">{lnk.parent_batch_id}</td>
                        <td className="p-3 px-6 font-bold">{lnk.relationship_type}</td>
                        <td className="p-3 px-6 font-mono text-sky-400 font-semibold">{lnk.child_batch_id}</td>
                        <td className="p-3 px-6 font-mono font-semibold text-white">{lnk.quantity_transferred_kg} kg</td>
                        <td className="p-3 px-6 text-slate-400">{new Date(lnk.timestamp).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB 4: LAB RECORDS */}
      {activeTab === 'lab' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Laboratory Purity & Chemical Analysis</h3>
              <p className="text-xs text-slate-400 mt-0.5">Empirical test records: moisture content, C4 adulteration, fructose-glucose ratio, HMF</p>
            </div>
            {(isLab() || isAdmin()) && (
              <Button size="sm" icon={<FlaskConical className="w-3.5 h-3.5" />} onClick={() => setLabModalOpen(true)}>
                Add Lab Test
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {batch.lab_records.length === 0 ? (
              <div className="col-span-2 p-12 text-center text-slate-400 text-xs bg-slate-900/40 border border-slate-800 rounded-2xl">
                No laboratory testing records logged yet for this batch.
              </div>
            ) : (
              batch.lab_records.map((rec) => (
                <Card key={rec.id} className="border-l-4 border-l-emerald-500">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-white">{rec.test_name}</h4>
                      <StatusBadge status={rec.status} size="sm" />
                    </div>

                    {rec.test_result && (
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 font-mono text-xs text-amber-300">
                        {rec.test_result}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-800">
                      <span>Lab: <strong className="text-slate-200">{rec.laboratory_name || 'Independent Lab'}</strong></span>
                      <span>{new Date(rec.tested_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: EVIDENCE */}
      {activeTab === 'evidence' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Digital Documents & Evidence Metadata</h3>
              <p className="text-xs text-slate-400 mt-0.5">Auditable certificates, apiary photos, and delivery receipts</p>
            </div>
            <Button size="sm" icon={<FileText className="w-3.5 h-3.5" />} onClick={() => setEvidenceModalOpen(true)}>
              Attach Evidence
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {batch.evidences.length === 0 ? (
              <div className="col-span-3 p-12 text-center text-slate-400 text-xs bg-slate-900/40 border border-slate-800 rounded-2xl">
                No digital evidence files attached yet.
              </div>
            ) : (
              batch.evidences.map((ev) => (
                <Card key={ev.id}>
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-bold text-amber-400 font-mono">
                        {ev.evidence_type}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(ev.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="font-mono text-xs text-white truncate" title={ev.file_reference}>
                      {ev.file_reference}
                    </p>
                    {ev.description && <p className="text-xs text-slate-400">{ev.description}</p>}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: BLOCKCHAIN INTEGRITY */}
      {activeTab === 'blockchain' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">Blockchain Cryptographic Integrity Layer</h3>
              <p className="text-xs text-slate-400 mt-0.5">Anchoring canonical SHA-256 state hashes to guarantee immutability</p>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={handleVerifyBlockchain} isLoading={actionLoading}>
                Verify Integrity
              </Button>
              {(isBeekeeper() || isProcessor() || isLab() || isAdmin()) && (
                <Button size="sm" onClick={handleAnchorBlockchain} isLoading={actionLoading} icon={<Lock className="w-3.5 h-3.5" />}>
                  Anchor Proof Hash
                </Button>
              )}
            </div>
          </div>

          {verifyResult && (
            <Alert
              type={verifyResult.status === 'VERIFIED' ? 'success' : 'error'}
              title={verifyResult.status === 'VERIFIED' ? 'Integrity Verified' : 'Tamper Detected!'}
            >
              <div className="space-y-1 font-mono text-[11px]">
                <p>Anchored Proof Hash: {verifyResult.anchored_hash}</p>
                <p>Current Authoritative Hash: {verifyResult.current_hash}</p>
                <p>Status: {verifyResult.status}</p>
              </div>
            </Alert>
          )}

          <Card>
            <CardHeader title="Blockchain Anchor History" subtitle="Cryptographic hashes anchored to the ledger" />
            <CardContent className="p-0 overflow-x-auto">
              {blockchainAnchors.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No blockchain proofs anchored yet for this batch. Click "Anchor Proof Hash" to anchor.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="p-3 px-6">Record Type</th>
                      <th className="p-3 px-6">Canonical SHA-256 Hash</th>
                      <th className="p-3 px-6">Transaction Hash</th>
                      <th className="p-3 px-6">Network</th>
                      <th className="p-3 px-6">Anchored Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {blockchainAnchors.map((anc) => (
                      <tr key={anc.id} className="hover:bg-slate-900/40">
                        <td className="p-3 px-6 text-amber-400 font-bold font-sans">{anc.record_type}</td>
                        <td className="p-3 px-6 text-slate-300 truncate max-w-xs" title={anc.canonical_hash}>
                          {anc.canonical_hash.slice(0, 16)}...{anc.canonical_hash.slice(-8)}
                        </td>
                        <td className="p-3 px-6 text-purple-400 truncate max-w-xs" title={anc.transaction_hash}>
                          {anc.transaction_hash.slice(0, 18)}...
                        </td>
                        <td className="p-3 px-6 font-sans text-slate-400 uppercase">{anc.network}</td>
                        <td className="p-3 px-6 font-sans text-slate-400">{new Date(anc.anchored_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 7: QR CODE & PUBLIC VERIFICATION */}
      {activeTab === 'qr' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">QR Code & Public Consumer Verification</h3>
              <p className="text-xs text-slate-400 mt-0.5">Secure QR lead to public verification page for consumers</p>
            </div>
            {!qrCode && (isBeekeeper() || isProcessor() || isAdmin()) && (
              <Button size="sm" icon={<QrCode className="w-3.5 h-3.5" />} onClick={handleGenerateQR} isLoading={actionLoading}>
                Generate QR Code
              </Button>
            )}
          </div>

          {!qrCode ? (
            <Card>
              <CardContent className="p-12 text-center text-slate-400 space-y-3">
                <QrCode className="w-12 h-12 text-slate-600 mx-auto" />
                <h4 className="font-bold text-white">No QR Code Generated</h4>
                <p className="text-xs max-w-md mx-auto">
                  Generate a verification token and QR code for this honey batch to allow consumers to scan and view the verified journey.
                </p>
                {(isBeekeeper() || isProcessor() || isAdmin()) && (
                  <Button size="md" onClick={handleGenerateQR} isLoading={actionLoading}>
                    Generate Verification QR
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                <div className="p-4 bg-white rounded-3xl shadow-xl border-4 border-amber-500/20">
                  <img
                    src={qrCode.qr_image_base64}
                    alt={`QR Code for ${batch.batch_id}`}
                    className="w-48 h-48 rounded-xl object-contain"
                  />
                </div>
                <div className="space-y-1">
                  <p className="font-mono font-bold text-amber-400 text-sm">{batch.batch_id}</p>
                  <p className="text-[11px] text-slate-400">Scan with any smartphone camera</p>
                </div>
                <a
                  href={qrCode.qr_image_base64}
                  download={`HoneyChain-QR-${batch.batch_id}.png`}
                  className="w-full"
                >
                  <Button variant="secondary" size="sm" className="w-full" icon={<Download className="w-3.5 h-3.5" />}>
                    Download PNG
                  </Button>
                </a>
              </Card>

              <Card className="md:col-span-2 space-y-4">
                <CardHeader title="Verification Endpoint Details" subtitle="Sanitized public endpoint for consumers" />
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 uppercase">Public Verification URL</label>
                    <div className="mt-1 p-3 rounded-xl bg-slate-900 font-mono text-xs text-amber-300 break-all border border-slate-850">
                      {qrCode.verification_url}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300 space-y-2">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Ready for SIH Demonstration
                    </span>
                    <p className="text-slate-400 leading-relaxed">
                      This page does not require a login. When consumers scan the bottle's QR code, they receive verified provenance from hive to jar, lab purity results, mass-conservation certification, and cryptographic blockchain proof.
                    </p>
                    <a
                      href={`/verify/${qrCode.verification_url.split('/').pop()}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-400 font-bold hover:underline mt-1"
                    >
                      Open Public Verification View <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD EVENT */}
      <Modal isOpen={eventModalOpen} onClose={() => setEventModalOpen(false)} title="Log Supply Chain Movement">
        <form onSubmit={handleAddEvent} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Event Type</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            >
              <option value="HARVEST">HARVEST</option>
              <option value="COLLECTION">COLLECTION</option>
              <option value="PROCESSING">PROCESSING</option>
              <option value="LAB_SUBMISSION">LAB_SUBMISSION</option>
              <option value="PACKAGING">PACKAGING</option>
              <option value="DISPATCH">DISPATCH</option>
              <option value="TRANSFER">TRANSFER</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Location</label>
            <input
              type="text"
              required
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="e.g. Mahabaleshwar Apiary Zone 4"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Quantity (kg)</label>
            <input
              type="number"
              step="0.1"
              required
              value={eventQuantity}
              onChange={(e) => setEventQuantity(parseFloat(e.target.value) || '')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Notes</label>
            <textarea
              rows={2}
              value={eventNotes}
              onChange={(e) => setEventNotes(e.target.value)}
              placeholder="Any inspection or quality notes"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setEventModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              Log Event
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: RECONCILE */}
      <Modal isOpen={reconcileModalOpen} onClose={() => setReconcileModalOpen(false)} title="Mass-Conservation Quantity Check">
        <form onSubmit={handleReconcile} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Input Quantity (kg)</label>
            <input
              type="number"
              step="0.1"
              required
              value={recInput}
              onChange={(e) => setRecInput(parseFloat(e.target.value) || '')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Output Quantity (kg)</label>
            <input
              type="number"
              step="0.1"
              required
              value={recOutput}
              onChange={(e) => setRecOutput(parseFloat(e.target.value) || '')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setReconcileModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              Run Conservation Check
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: LAB RECORD */}
      <Modal isOpen={labModalOpen} onClose={() => setLabModalOpen(false)} title="Record Laboratory Test">
        <form onSubmit={handleAddLabRecord} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Test Name</label>
            <input
              type="text"
              required
              value={labTestName}
              onChange={(e) => setLabTestName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Assay Readings / Results</label>
            <textarea
              rows={2}
              required
              value={labTestResult}
              onChange={(e) => setLabTestResult(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Status</label>
              <select
                value={labStatus}
                onChange={(e) => setLabStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
              >
                <option value="PASSED">PASSED</option>
                <option value="FAILED">FAILED</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Laboratory Name</label>
              <input
                type="text"
                required
                value={labName}
                onChange={(e) => setLabName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setLabModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              Save Test Record
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: EVIDENCE */}
      <Modal isOpen={evidenceModalOpen} onClose={() => setEvidenceModalOpen(false)} title="Attach Evidence File Metadata">
        <form onSubmit={handleAddEvidence} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Evidence Type</label>
            <select
              value={evidenceType}
              onChange={(e) => setEvidenceType(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            >
              <option value="CERTIFICATE">CERTIFICATE</option>
              <option value="PHOTO">PHOTO</option>
              <option value="DOCUMENT">DOCUMENT</option>
              <option value="RECEIPT">RECEIPT</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">File Path / Reference</label>
            <input
              type="text"
              required
              value={fileReference}
              onChange={(e) => setFileReference(e.target.value)}
              placeholder="e.g. certificates/LAB-ANALYSIS-2026.pdf"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Description</label>
            <textarea
              rows={2}
              value={evidenceDescription}
              onChange={(e) => setEvidenceDescription(e.target.value)}
              placeholder="Description of the uploaded evidence"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setEvidenceModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              Attach Evidence
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL: LINK GENEALOGY */}
      <Modal isOpen={linkModalOpen} onClose={() => setLinkModalOpen(false)} title="Establish Lineage Link">
        <form onSubmit={handleLinkGenealogy} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Child Batch ID</label>
            <input
              type="text"
              required
              value={childBatchId}
              onChange={(e) => setChildBatchId(e.target.value)}
              placeholder="e.g. BATCH-2026-0002"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Relationship Type</label>
              <select
                value={relationType}
                onChange={(e) => setRelationType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm"
              >
                <option value="SPLIT">SPLIT</option>
                <option value="MERGE">MERGE</option>
                <option value="DERIVED">DERIVED</option>
                <option value="TRANSFER">TRANSFER</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Transferred (kg)</label>
              <input
                type="number"
                step="0.1"
                required
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(parseFloat(e.target.value) || '')}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setLinkModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              Establish Directional Lineage
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
