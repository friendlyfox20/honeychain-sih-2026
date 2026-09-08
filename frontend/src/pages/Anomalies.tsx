import React, { useState } from 'react';
import { api } from '../api/client';
import { AnomalyCheckResponse } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import {
  AlertTriangle,
  Scale,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowRight,
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
      desc: 'Typical gentle shrinkage during micro-filtration and moisture reduction (50 -> 48 -> 47 -> 45 kg)',
      harvest: 50.0,
      processing: 48.0,
      bottled: 47.0,
      dispatched: 45.0,
    },
    {
      name: 'Scenario 2: Processing Mass Inversion (Violation)',
      desc: '65 kg emerged from 50 kg raw honey (unauthorized high-fructose corn syrup addition)',
      harvest: 50.0,
      processing: 65.0,
      bottled: 64.0,
      dispatched: 62.0,
    },
    {
      name: 'Scenario 3: Bottling Volume Inflation (Violation)',
      desc: 'Bottled volume exceeds processing tank output (48 -> 54 kg)',
      harvest: 50.0,
      processing: 48.0,
      bottled: 54.0,
      dispatched: 52.0,
    },
    {
      name: 'Scenario 4: Dispatch Inflation (Violation)',
      desc: 'Dispatched volume exceeds bottled warehouse inventory (47 -> 58 kg)',
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
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-charcoal font-display tracking-tight flex items-center gap-2.5">
          <Scale className="w-7 h-7 text-forest-700" />
          <span>Supply-Chain Anomaly & Reconciliation</span>
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
          Dual-layer audit engine: deterministic physical mass conservation rules strictly override machine learning inference
        </p>
      </div>

      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Scenarios & Form */}
      <div className="bg-white border border-border-warm rounded-2xl p-6 shadow-subtle space-y-6">
        {/* Scenarios */}
        <div className="space-y-2 pb-4 border-b border-border-subtle">
          <span className="text-[11px] font-mono font-semibold uppercase text-charcoal-muted block">
            SIH Demonstration Test Scenarios
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {scenarios.map((sc, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyScenario(sc)}
                className="p-3 rounded-xl bg-surface-subtle hover:bg-surface-tint border border-border-subtle text-left transition text-xs space-y-0.5"
              >
                <span className="font-bold text-charcoal block">{sc.name}</span>
                <p className="text-[11px] text-charcoal-muted leading-tight">{sc.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleCheckAnomaly} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-charcoal mb-1">Batch Identifier</label>
            <input
              type="text"
              required
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg font-mono text-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Harvest (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={harvestKg}
                onChange={(e) => setHarvestKg(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg font-mono text-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Processing (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={processingKg}
                onChange={(e) => setProcessingKg(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg font-mono text-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Bottled (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={bottledKg}
                onChange={(e) => setBottledKg(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg font-mono text-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1">Dispatched (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                required
                value={dispatchedKg}
                onChange={(e) => setDispatchedKg(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg font-mono text-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              icon={<Scale className="w-4 h-4" />}
            >
              Run Dual-Layer Anomaly Inspection
            </Button>
          </div>
        </form>
      </div>

      {/* Results Card */}
      {result && (() => {
        const isRuleViolation =
          result.rule_check.processing_vs_harvest === 'FAIL' ||
          result.rule_check.bottled_vs_processing === 'FAIL' ||
          result.rule_check.dispatched_vs_bottled === 'FAIL';
        const isMlAnomaly = result.ml_prediction === 'ANOMALY';
        const isAnomaly = result.final_status === 'ANOMALY';
        const summaryText = isRuleViolation
          ? `Physical mass violation detected across supply chain custody stages (Processing gap: ${result.gaps.processing_gap_kg.toFixed(1)} kg, Bottling gap: ${result.gaps.bottling_gap_kg.toFixed(1)} kg, Dispatch gap: ${result.gaps.dispatch_gap_kg.toFixed(1)} kg).`
          : isMlAnomaly
          ? `Supportive statistical model identified unusual operational pattern. Deterministic mass balance conserved.`
          : `All physical conservation rules passed. No operational discrepancies flagged across custody stages.`;

        return (
          <div className="bg-white border border-border-warm rounded-2xl p-6 shadow-subtle space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold font-display text-charcoal">Inspection Verdict</span>
                <span className="font-mono text-xs font-bold text-charcoal">Batch: {result.batch_id}</span>
              </div>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                  isAnomaly
                    ? 'bg-terracotta-50 text-terracotta-700 border-terracotta-200'
                    : 'bg-forest-50 text-forest-700 border-forest-200'
                }`}
              >
                {isAnomaly ? 'ANOMALY DETECTED' : 'NORMAL (CONSERVED)'}
              </span>
            </div>

            {/* Dual Layer Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Layer 1: Deterministic Physical Rule */}
              <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-charcoal text-xs">
                    Layer 1: Deterministic Rule
                  </span>
                  <span className="text-[10px] font-mono text-forest-700 font-bold">AUTHORITATIVE</span>
                </div>
                <p className="text-xs text-charcoal-muted">
                  Checks absolute mass conservation across custody handoffs (e.g. Processing &le; Harvest).
                </p>
                <div className="flex items-center gap-1.5 pt-1">
                  {isRuleViolation ? (
                    <span className="text-terracotta-700 font-bold font-mono flex items-center gap-1">
                      <XCircle className="w-4 h-4" /> VIOLATION: Discrepancy Flagged
                    </span>
                  ) : (
                    <span className="text-forest-700 font-bold font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> PASS: Mass Conserved
                    </span>
                  )}
                </div>
              </div>

              {/* Layer 2: Machine Learning Model */}
              <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-charcoal text-xs">
                    Layer 2: ML SVM Detection
                  </span>
                  <span className="text-[10px] font-mono text-charcoal-muted">SUPPORTING</span>
                </div>
                <p className="text-xs text-charcoal-muted">
                  Evaluates non-linear deviation patterns based on historical apiculture loss rates.
                </p>
                <div className="flex items-center gap-1.5 pt-1">
                  {isMlAnomaly ? (
                    <span className="text-honey-800 font-bold font-mono flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" /> Outlier Pattern Flagged
                    </span>
                  ) : (
                    <span className="text-forest-700 font-bold font-mono flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Pattern within Expected Variance
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Explanation */}
            <div
              className={`p-4 rounded-xl border text-xs space-y-1 ${
                isAnomaly
                  ? 'bg-terracotta-50 border-terracotta-200 text-terracotta-900'
                  : 'bg-forest-50 border-forest-200 text-forest-900'
              }`}
            >
              <span className="font-mono uppercase font-bold text-[10px] block">Investigation Summary</span>
              <p className="text-xs leading-relaxed">{summaryText}</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
