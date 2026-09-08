import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { SystemMonitoringResponse } from '../../types';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import {
  Activity,
  Database,
  Cpu,
  Lock,
  QrCode,
  Mic,
  RefreshCw,
  CheckCircle2,
  Server,
} from 'lucide-react';

export const AdminMonitoring: React.FC = () => {
  const [mon, setMon] = useState<SystemMonitoringResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonitoring = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<SystemMonitoringResponse>('/api/v1/admin/monitoring');
      setMon(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch subsystem monitoring telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoring();
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal font-display tracking-tight flex items-center gap-2.5">
            <Activity className="w-7 h-7 text-forest-700" />
            <span>Subsystem Telemetry & Monitoring</span>
          </h1>
          <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
            Real-time health verification covering Database, ML Model Artifacts, Blockchain Provider, QR Engine, and Speech-to-Text
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          onClick={fetchMonitoring}
        >
          Ping Subsystems
        </Button>
      </div>

      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Overall Health Status Banner */}
      {mon && (
        <div className="p-5 sm:p-6 rounded-2xl bg-white border border-border-warm shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-forest-50 border border-forest-200 text-forest-700 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-charcoal-muted font-mono">HoneyChain Daemon:</span>
                <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold border ${
                  mon.application_status === 'HEALTHY'
                    ? 'bg-forest-50 text-forest-700 border-forest-200'
                    : 'bg-terracotta-50 text-terracotta-700 border-terracotta-200'
                }`}>
                  {mon.application_status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-charcoal-muted mt-0.5 font-mono">
                Version: {mon.version} • Last Ping: {new Date(mon.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <Badge variant={mon.application_status === 'HEALTHY' ? 'emerald' : 'amber'} size="lg">
            {mon.application_status === 'HEALTHY' ? 'All Subsystems Operational' : 'Subsystem Warning'}
          </Badge>
        </div>
      )}

      {/* Subsystems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Database Subsystem */}
        <div className="bg-white border border-border-warm rounded-2xl p-5 shadow-subtle space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-forest-700" />
              <h2 className="font-bold text-sm text-charcoal font-display">Authoritative Database</h2>
            </div>
            <Badge variant={mon?.database?.status === 'HEALTHY' ? 'emerald' : 'rose'} size="sm">
              {mon?.database?.status || 'CHECKING'}
            </Badge>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-surface-subtle border border-border-subtle">
              <span className="text-charcoal-muted">Database Engine</span>
              <span className="font-mono text-charcoal font-semibold">{mon?.database?.details?.engine || 'SQLite'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-surface-subtle border border-border-subtle">
              <span className="text-charcoal-muted">Connection State</span>
              <span className="font-mono text-forest-700 font-bold">{mon?.database?.details?.status || 'CONNECTED'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-surface-subtle border border-border-subtle">
              <span className="text-charcoal-muted">Integrity Rule</span>
              <span className="font-mono text-charcoal font-bold">Mass Conserved</span>
            </div>
          </div>
        </div>

        {/* 2. ML Models */}
        <div className="bg-white border border-border-warm rounded-2xl p-5 shadow-subtle space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-forest-700" />
              <h2 className="font-bold text-sm text-charcoal font-display">ML Intelligence Models</h2>
            </div>
            <Badge variant={mon?.ml_models?.status === 'HEALTHY' ? 'emerald' : 'rose'} size="sm">
              {mon?.ml_models?.status || 'CHECKING'}
            </Badge>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-subtle border border-border-subtle">
              <span className="text-charcoal-muted">Yield Model (XGBoost)</span>
              <Badge variant={mon?.ml_models?.details?.yield_model === 'LOADED' ? 'emerald' : 'rose'} size="sm">
                {mon?.ml_models?.details?.yield_model || 'CHECKING'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-subtle border border-border-subtle">
              <span className="text-charcoal-muted">Daily Production Rate</span>
              <Badge variant={mon?.ml_models?.details?.daily_production_model === 'LOADED' ? 'emerald' : 'rose'} size="sm">
                {mon?.ml_models?.details?.daily_production_model || 'CHECKING'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-surface-subtle border border-border-subtle">
              <span className="text-charcoal-muted">2-Layer Anomaly SVM</span>
              <Badge variant={mon?.ml_models?.details?.anomaly_model === 'LOADED' ? 'emerald' : 'rose'} size="sm">
                {mon?.ml_models?.details?.anomaly_model || 'CHECKING'}
              </Badge>
            </div>
          </div>
        </div>

        {/* 3. Blockchain Provider */}
        <div className="bg-white border border-border-warm rounded-2xl p-5 shadow-subtle space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-forest-700" />
              <h2 className="font-bold text-sm text-charcoal font-display">Blockchain Integrity</h2>
            </div>
            <Badge variant={mon?.blockchain?.status === 'HEALTHY' ? 'emerald' : 'rose'} size="sm">
              {mon?.blockchain?.status || 'CHECKING'}
            </Badge>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-surface-subtle border border-border-subtle">
              <span className="text-charcoal-muted">Integrity Anchor</span>
              <span className="font-mono text-forest-700 font-bold">{mon?.blockchain?.details?.enabled ? 'ACTIVE' : 'DISABLED'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-surface-subtle border border-border-subtle">
              <span className="text-charcoal-muted">Provider Abstraction</span>
              <span className="font-mono text-charcoal font-bold uppercase">{mon?.blockchain?.details?.provider || 'MOCK'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-surface-subtle border border-border-subtle">
              <span className="text-charcoal-muted">Target Network</span>
              <span className="font-mono text-charcoal-muted uppercase">{mon?.blockchain?.details?.network || 'LOCAL'}</span>
            </div>
          </div>
        </div>

        {/* 4. QR Engine */}
        <div className="bg-white border border-border-warm rounded-2xl p-5 shadow-subtle space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <QrCode className="w-4 h-4 text-forest-700" />
              <h2 className="font-bold text-sm text-charcoal font-display">QR Packaging Engine</h2>
            </div>
            <Badge variant={mon?.qr_capability?.status === 'HEALTHY' ? 'emerald' : 'rose'} size="sm">
              {mon?.qr_capability?.status || 'CHECKING'}
            </Badge>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-surface-subtle border border-border-subtle">
              <span className="text-charcoal-muted">Capability</span>
              <span className="font-mono text-forest-700 font-bold">{mon?.qr_capability?.details?.capability || 'AVAILABLE'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-surface-subtle border border-border-subtle">
              <span className="text-charcoal-muted">Token Format</span>
              <span className="font-mono text-charcoal font-semibold">{mon?.qr_capability?.details?.token_format || 'UUIDv4_HEX64'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-surface-subtle border border-border-subtle">
              <span className="text-charcoal-muted">Public Endpoint</span>
              <span className="font-mono text-charcoal font-bold">/verify/:token</span>
            </div>
          </div>
        </div>

        {/* 5. Voice STT */}
        <div className="bg-white border border-border-warm rounded-2xl p-5 shadow-subtle space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-forest-700" />
              <h2 className="font-bold text-sm text-charcoal font-display">Speech-to-Text & Intent</h2>
            </div>
            <Badge variant={mon?.voice_stt?.status === 'HEALTHY' ? 'emerald' : 'rose'} size="sm">
              {mon?.voice_stt?.status || 'CHECKING'}
            </Badge>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-surface-subtle border border-border-subtle">
              <span className="text-charcoal-muted">Subsystem Status</span>
              <span className="font-mono text-forest-700 font-bold">{mon?.voice_stt?.details?.status || 'AVAILABLE'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-surface-subtle border border-border-subtle">
              <span className="text-charcoal-muted">Active STT Provider</span>
              <span className="font-mono text-charcoal font-semibold">{mon?.voice_stt?.details?.active_provider || 'speech_recognition'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-surface-subtle border border-border-subtle">
              <span className="text-charcoal-muted">Audio Inputs</span>
              <span className="font-mono text-charcoal-muted">WAV, MP3, OGG</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
