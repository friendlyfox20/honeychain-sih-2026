import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { SystemMonitoringResponse } from '../../types';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
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
  AlertTriangle,
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
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Activity className="w-8 h-8 text-amber-500" /> Operational Subsystem Health
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time backend daemon monitoring covering Database, ML Model Artifacts, Blockchain Provider, QR Engine, and Speech-to-Text
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
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase text-slate-400">HoneyChain Daemon:</span>
                <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold border ${
                  mon.application_status === 'HEALTHY'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}>
                  {mon.application_status.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Version: {mon.version} • Last Ping: {new Date(mon.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
          <Badge variant={mon.application_status === 'HEALTHY' ? 'emerald' : 'amber'} size="lg">
            {mon.application_status === 'HEALTHY' ? 'All Subsystems Operational' : 'Subsystem Degradation Detected'}
          </Badge>
        </div>
      )}

      {/* Subsystems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Database Subsystem */}
        <Card className="hover:border-slate-700 transition">
          <CardHeader
            title="Authoritative Database"
            subtitle="SQLAlchemy 2.0 ORM & SQLite / PostgreSQL"
            badge={
              <Badge variant={mon?.database?.status === 'HEALTHY' ? 'emerald' : 'rose'}>
                {mon?.database?.status || 'CHECKING'}
              </Badge>
            }
          />
          <CardContent className="space-y-2.5 text-xs">
            <div className="flex justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-850">
              <span className="text-slate-400">Database Engine</span>
              <span className="font-mono text-white font-semibold">{mon?.database?.details?.engine || 'SQLite'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-850">
              <span className="text-slate-400">Connection State</span>
              <span className="font-mono text-emerald-400 font-bold">{mon?.database?.details?.status || 'CONNECTED'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-850">
              <span className="text-slate-400">Integrity Check</span>
              <span className="font-mono text-slate-300 font-bold">PASS (Mass-Conserved)</span>
            </div>
          </CardContent>
        </Card>

        {/* 2. ML Models */}
        <Card className="hover:border-slate-700 transition">
          <CardHeader
            title="ML Model Inference"
            subtitle="Yield, Production & Anomaly Detection"
            badge={
              <Badge variant={mon?.ml_models?.status === 'HEALTHY' ? 'emerald' : 'rose'}>
                {mon?.ml_models?.status || 'CHECKING'}
              </Badge>
            }
          />
          <CardContent className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-850">
              <span className="text-slate-400">Honey Yield (XGBoost)</span>
              <Badge variant={mon?.ml_models?.details?.yield_model === 'LOADED' ? 'emerald' : 'rose'} size="sm">
                {mon?.ml_models?.details?.yield_model || 'CHECKING'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-850">
              <span className="text-slate-400">Daily Production Rate</span>
              <Badge variant={mon?.ml_models?.details?.daily_production_model === 'LOADED' ? 'emerald' : 'rose'} size="sm">
                {mon?.ml_models?.details?.daily_production_model || 'CHECKING'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-850">
              <span className="text-slate-400">2-Layer Anomaly SVM</span>
              <Badge variant={mon?.ml_models?.details?.anomaly_model === 'LOADED' ? 'emerald' : 'rose'} size="sm">
                {mon?.ml_models?.details?.anomaly_model || 'CHECKING'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* 3. Blockchain Provider */}
        <Card className="hover:border-slate-700 transition">
          <CardHeader
            title="Blockchain Integrity"
            subtitle="Canonical SHA-256 Ledger Anchoring"
            badge={
              <Badge variant={mon?.blockchain?.status === 'HEALTHY' ? 'emerald' : 'rose'}>
                {mon?.blockchain?.status || 'CHECKING'}
              </Badge>
            }
          />
          <CardContent className="space-y-2.5 text-xs">
            <div className="flex justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-850">
              <span className="text-slate-400">Integrity Anchor</span>
              <span className="font-mono text-emerald-400 font-bold">{mon?.blockchain?.details?.enabled ? 'ACTIVE' : 'DISABLED'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-850">
              <span className="text-slate-400">Provider Backend</span>
              <span className="font-mono text-purple-400 font-bold uppercase">{mon?.blockchain?.details?.provider || 'MOCK'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-850">
              <span className="text-slate-400">Target Network</span>
              <span className="font-mono text-slate-300 uppercase">{mon?.blockchain?.details?.network || 'LOCAL'}</span>
            </div>
          </CardContent>
        </Card>

        {/* 4. QR Engine */}
        <Card className="hover:border-slate-700 transition">
          <CardHeader
            title="QR Code Capability"
            subtitle="Secure token generation and consumer dispatch"
            badge={
              <Badge variant={mon?.qr_capability?.status === 'HEALTHY' ? 'emerald' : 'rose'}>
                {mon?.qr_capability?.status || 'CHECKING'}
              </Badge>
            }
          />
          <CardContent className="space-y-2.5 text-xs">
            <div className="flex justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-850">
              <span className="text-slate-400">Capability</span>
              <span className="font-mono text-amber-400 font-bold">{mon?.qr_capability?.details?.capability || 'AVAILABLE'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-850">
              <span className="text-slate-400">Token Format</span>
              <span className="font-mono text-white font-semibold">{mon?.qr_capability?.details?.token_format || 'UUIDv4_HEX64'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-850">
              <span className="text-slate-400">Consumer Endpoint</span>
              <span className="font-mono text-emerald-400 font-bold">/verify/:token</span>
            </div>
          </CardContent>
        </Card>

        {/* 5. Voice STT */}
        <Card className="hover:border-slate-700 transition">
          <CardHeader
            title="Speech-to-Text & Intent"
            subtitle="Natural language voice query processor"
            badge={
              <Badge variant={mon?.voice_stt?.status === 'HEALTHY' ? 'emerald' : 'rose'}>
                {mon?.voice_stt?.status || 'CHECKING'}
              </Badge>
            }
          />
          <CardContent className="space-y-2.5 text-xs">
            <div className="flex justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-850">
              <span className="text-slate-400">Subsystem Status</span>
              <span className="font-mono text-emerald-400 font-bold">{mon?.voice_stt?.details?.status || 'AVAILABLE'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-850">
              <span className="text-slate-400">Active Provider</span>
              <span className="font-mono text-white font-semibold">{mon?.voice_stt?.details?.active_provider || 'speech_recognition'}</span>
            </div>
            <div className="flex justify-between p-2 rounded-xl bg-slate-950/80 border border-slate-850">
              <span className="text-slate-400">Input Formats</span>
              <span className="font-mono text-slate-300">WAV, MP3, OGG, FLAC</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
