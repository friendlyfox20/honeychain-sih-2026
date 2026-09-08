import React, { useState } from 'react';
import { api } from '../api/client';
import { AnomalyCheckResponse } from '../types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import {
  AlertOctagon,
  Scale,
  ShieldCheck,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingDown,
} from 'lucide-react';

export const Anomalies: React.FC = () => {
  const [batchId, setBatchId] = useState('BATCH-2026-ANOM1');
  const [harvestKg, setHarvestKg] = useState<number>(50.0);
  const [processingKg, setProcessingKg] = useState<number>(48.0);
  const [bottledKg, setBottledKg] = useState<number>(47.0);
  const [dispatchedKg, setDispatchedKg] = useState<number>(45.0);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnomalyCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scenarios = [
    {
      name: 'Scenario 1: Normal Flow (Pass)',
      desc: 'Typical gentle shrinkage during micro-filtration and moisture reduction',
      harvest: 50.0,
      processing: 48.0,
      bottled: 47.0,
      dispatched: 45.0,
    },
    {
      name: 'Scenario 2: Processing Mass Inversion (Violation)',
      desc: '65 kg emerged from 50 kg raw honey (unauthorized high-fructose syrup addition)',
      harvest: 50.0,
      processing: 65.0,
      bottled: 64.0,
      dispatched: 62.0,
    },
    {
      name: 'Scenario 3: Bottling Volume Inflation (Violation)',
      desc: 'Bottled volume exceeds processing tank output',
      harvest: 50.0,
      processing: 48.0,
      bottled: 54.0,
      dispatched: 52.0,
    },
    {
      name: 'Scenario 4: Dispatch Inflation (Violation)',
      desc: 'Dispatched volume exceeds bottled stock',
      harvest: 50.0,
      processing: 48.0,
      bottled: 47.0,
      dispatched: 58.0,
    },
  ];

  const applyScenario = (sc: typeof scenarios[0]) => {
    setHarvestKg(sc.harvest);
    setProcessingKg(sc.processing);
    setBottledKg(sc.bottled);
    setDispatchedKg(sc.dispatched);
  };

  const handleCheckAnomaly = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<AnomalyCheckResponse>('/api/v1/anomaly/check', {
        batch_id: batchId,
        harvest_quantity_kg: harvestKg,
        processing_quantity_kg: processingKg,
        bottled_quantity_kg: bottledKg,
        dispatched_quantity_kg: dispatchedKg,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to evaluate anomaly status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <AlertOctagon className="w-8 h-8 text-rose-500" /> 2-Layer Supply-Chain Anomaly Inspector
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Authoritative mass-conservation rule enforcement (Layer 1) integrated with statistical ML anomaly detection (Layer 2)
        </p>
      </div>

      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* SIH Preset Scenarios */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Preset SIH Demonstration Scenarios:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {scenarios.map((sc, i) => (
            <button
              key={i}
              type="button"
              onClick={() => applyScenario(sc)}
              className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 text-left transition space-y-1 group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white group-hover:text-amber-400">{sc.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">Load</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">{sc.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Inputs */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Batch Stage Quantities (kg)"
            subtitle="Quantity flow through the four physical transformation stages"
          />
          <CardContent>
            <form onSubmit={handleCheckAnomaly} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Batch ID</label>
                <input
                  type="text"
                  required
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    1. Harvest Quantity (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={harvestKg}
                    onChange={(e) => setHarvestKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    2. Processing Quantity (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={processingKg}
                    onChange={(e) => setProcessingKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    3. Bottled Quantity (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={bottledKg}
                    onChange={(e) => setBottledKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    4. Dispatched Quantity (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={dispatchedKg}
                    onChange={(e) => setDispatchedKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full mt-4" isLoading={loading}>
                Evaluate 2-Layer Anomaly Engine <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        <div className="space-y-6">
          <Card className="border border-white/10">
            <CardHeader title="Evaluation Results" subtitle="Dual-layer inspection verdict" />
            <CardContent className="space-y-4">
              {result ? (
                <div className="space-y-4">
                  <div className="text-center p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <span className="text-[11px] uppercase font-bold text-slate-400">Final Verdict</span>
                    <div>
                      <StatusBadge status={result.final_status} size="lg" />
                    </div>
                  </div>

                  {/* Stage Rules */}
                  <div className="space-y-2 text-xs">
                    <span className="font-bold text-slate-300 uppercase text-[10px]">
                      Layer 1: Deterministic Mass-Conservation Rules
                    </span>
                    <div className="space-y-1.5 font-mono">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-850">
                        <span>Processing &le; Harvest</span>
                        <Badge variant={result.rule_check.processing_vs_harvest === 'PASS' ? 'emerald' : 'rose'}>
                          {result.rule_check.processing_vs_harvest} ({result.gaps.processing_gap_kg > 0 ? `+${result.gaps.processing_gap_kg}` : result.gaps.processing_gap_kg} kg)
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-850">
                        <span>Bottled &le; Processing</span>
                        <Badge variant={result.rule_check.bottled_vs_processing === 'PASS' ? 'emerald' : 'rose'}>
                          {result.rule_check.bottled_vs_processing} ({result.gaps.bottling_gap_kg > 0 ? `+${result.gaps.bottling_gap_kg}` : result.gaps.bottling_gap_kg} kg)
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-850">
                        <span>Dispatched &le; Bottled</span>
                        <Badge variant={result.rule_check.dispatched_vs_bottled === 'PASS' ? 'emerald' : 'rose'}>
                          {result.rule_check.dispatched_vs_bottled} ({result.gaps.dispatch_gap_kg > 0 ? `+${result.gaps.dispatch_gap_kg}` : result.gaps.dispatch_gap_kg} kg)
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Layer 2 ML Model */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-200">Layer 2: ML Model Output</span>
                      <p className="text-[10px] text-slate-400">Trained Anomaly Classifier</p>
                    </div>
                    <Badge variant={result.ml_prediction === 'NORMAL' ? 'emerald' : 'rose'}>
                      {result.ml_prediction}
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Run evaluation or select an SIH preset above to inspect results.
                </div>
              )}
            </CardContent>
          </Card>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <ShieldCheck className="w-4 h-4" /> Deterministic Authority Principle
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              If deterministic quantity conservation is violated (e.g. downstream output exceeds upstream input), the rule layer authoritatively overrides the ML prediction to guarantee fraud or data-entry errors are flagged.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
