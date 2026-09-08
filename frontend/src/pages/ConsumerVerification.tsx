import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { ConsumerVerificationResponse } from '../types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { StatusBadge, Badge } from '../components/ui/Badge';
import {
  ShieldCheck,
  Hexagon,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Clock,
  Lock,
  ExternalLink,
  FlaskConical,
  Scale,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react';

export const ConsumerVerification: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<ConsumerVerificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const fetchVerification = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<ConsumerVerificationResponse>(`/api/v1/verify/${token}`);
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Unable to verify this QR code. The token may be revoked or invalid.');
      } finally {
        setLoading(false);
      }
    };
    fetchVerification();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-300">
        <div className="w-12 h-12 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white tracking-tight">Verifying HoneyChain QR Token...</h2>
        <p className="text-xs text-slate-400 mt-1 font-mono">{token}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mb-4">
          <AlertTriangle className="w-12 h-12 stroke-[1.5]" />
        </div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Verification Failed</h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mt-2 mb-6 leading-relaxed">
          {error || 'This QR verification token is unverified or has been revoked by the processor.'}
        </p>
        <Link
          to="/login"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-slate-200 hover:text-white border border-slate-800 text-xs font-semibold"
        >
          HoneyChain Portal Login
        </Link>
      </div>
    );
  }

  const { batch, trace, lab_records, reconciliations, blockchain_status, blockchain_transaction_hash } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-amber-500/30 py-8 px-4 sm:px-6 flex flex-col justify-between">
      <div className="max-w-2xl mx-auto w-full space-y-6">
        {/* Verification Shield Hero */}
        <div className="text-center space-y-3 pt-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-xl shadow-emerald-500/20 text-slate-950 relative">
            <ShieldCheck className="w-9 h-9 stroke-[2.2]" />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
              Authentic Traceability Record
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              HoneyChain Verified
            </h1>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              {data.verification_message}
            </p>
          </div>
        </div>

        {/* Batch Provenance Summary Card */}
        <Card className="border border-amber-500/30 glow-honey bg-gradient-to-b from-amber-500/10 via-slate-900/90 to-slate-900/80">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Target Batch</span>
                <h2 className="text-xl font-mono font-black text-amber-400">{batch.batch_id}</h2>
              </div>
              <StatusBadge status={batch.status} size="md" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Origin Source</span>
                <p className="font-bold text-white mt-0.5">{batch.source_type}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-850">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Batch Volume</span>
                <p className="font-bold text-white mt-0.5">{batch.quantity_kg} kg</p>
              </div>
            </div>

            {/* Blockchain Immutability Seal */}
            <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-purple-400 shrink-0" />
                <div>
                  <span className="font-bold text-white">Cryptographic Blockchain Proof</span>
                  <p className="text-[11px] text-purple-300">Status: {blockchain_status || 'ANCHORED'}</p>
                </div>
              </div>
              {blockchain_transaction_hash && (
                <span className="font-mono text-[10px] text-slate-400" title={blockchain_transaction_hash}>
                  {blockchain_transaction_hash.slice(0, 10)}...
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Physical Journey Timeline */}
        <Card>
          <CardHeader
            title="Supply-Chain Traceability Journey"
            subtitle="Verified chronological milestones from hive collection to final packaging"
          />
          <CardContent className="p-6">
            {trace.length === 0 ? (
              <p className="text-xs text-slate-400 text-center">No movement events logged for this batch.</p>
            ) : (
              <div className="relative border-l border-amber-500/30 ml-4 space-y-6 pl-6">
                {trace.map((item, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 ring-4 ring-slate-950" />
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white font-mono">{item.event_type}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      {item.location && (
                        <p className="text-xs text-slate-300 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{item.location}</span>
                        </p>
                      )}
                      {item.notes && <p className="text-xs text-slate-400 italic">"{item.notes}"</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Laboratory Quality Assay */}
        <Card>
          <CardHeader
            title="Laboratory Testing Records"
            subtitle="Purity chromatography and sugar composition assays"
          />
          <CardContent className="p-6 space-y-3">
            {lab_records.length === 0 ? (
              <p className="text-xs text-slate-400 text-center">Laboratory records pending for this batch.</p>
            ) : (
              lab_records.map((rec) => (
                <div key={rec.id} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-emerald-400" />
                      {rec.test_name}
                    </span>
                    <StatusBadge status={rec.status} size="sm" />
                  </div>
                  {rec.test_result && (
                    <p className="text-xs font-mono text-amber-300 bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                      {rec.test_result}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Testing Facility: {rec.laboratory_name || 'Authorized Lab'}</span>
                    <span>{new Date(rec.tested_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Mass Conservation Guarantee */}
        <Card>
          <CardHeader
            title="Mass-Conservation Audit"
            subtitle="Authoritative physical quantity balance verified"
          />
          <CardContent className="p-6">
            {reconciliations.length === 0 ? (
              <p className="text-xs text-slate-400 text-center">Reconciliation pending.</p>
            ) : (
              <div className="space-y-2">
                {reconciliations.map((rec, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Input {rec.input_quantity_kg} kg &rarr; Output {rec.output_quantity_kg} kg</span>
                    </div>
                    <Badge variant={rec.status === 'PASS' ? 'emerald' : 'rose'}>{rec.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Honest Transparency Notice */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-3">
          <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <p>
            <strong>HoneyChain Verification Principles:</strong> HoneyChain records and validates supply-chain custody and laboratory assays without claiming blockchain autonomously generates physical truth. This record provides immutable evidence of tested quality and custody flow.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-[11px] text-slate-500 pt-12 pb-4 space-y-1">
        <p>HoneyChain • Smart India Hackathon 2026</p>
        <p>Secure Traceability, Reconciliation, and Blockchain Integrity Layer</p>
      </footer>
    </div>
  );
};
