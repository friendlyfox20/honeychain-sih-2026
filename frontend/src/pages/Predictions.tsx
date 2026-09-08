import React, { useState } from 'react';
import { api } from '../api/client';
import { HoneyYieldResponse, DailyProductionResponse } from '../types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import {
  Sparkles,
  Thermometer,
  Droplets,
  Wind,
  Calendar,
  ArrowRight,
  Info,
  Sliders,
  Cpu,
} from 'lucide-react';

export const Predictions: React.FC = () => {
  const [tab, setTab] = useState<'yield' | 'daily'>('yield');

  // Input states
  const [envTemp, setEnvTemp] = useState<number>(22.5);
  const [relHum, setRelHum] = useState<number>(75.0);
  const [hiveTemp, setHiveTemp] = useState<number>(33.5);
  const [hiveHum, setHiveHum] = useState<number>(58.0);
  const [windSpeed, setWindSpeed] = useState<number>(4.5);
  const [date, setDate] = useState<string>('2024-11-15');

  // Optional overrides
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [honeyWeightLag1, setHoneyWeightLag1] = useState<string>('');
  const [rollMean3, setRollMean3] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [yieldResult, setYieldResult] = useState<HoneyYieldResponse | null>(null);
  const [dailyResult, setDailyResult] = useState<DailyProductionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyPreset = (preset: {
    envTemp: number;
    relHum: number;
    hiveTemp: number;
    hiveHum: number;
    windSpeed: number;
    name: string;
  }) => {
    setEnvTemp(preset.envTemp);
    setRelHum(preset.relHum);
    setHiveTemp(preset.hiveTemp);
    setHiveHum(preset.hiveHum);
    setWindSpeed(preset.windSpeed);
  };

  const presets = [
    { name: 'Optimal Spring Bloom', envTemp: 24.0, relHum: 65.0, hiveTemp: 34.5, hiveHum: 55.0, windSpeed: 3.5 },
    { name: 'Monsoon High Humidity', envTemp: 27.5, relHum: 88.0, hiveTemp: 35.0, hiveHum: 72.0, windSpeed: 8.0 },
    { name: 'Dry Summer Season', envTemp: 33.0, relHum: 42.0, hiveTemp: 36.5, hiveHum: 48.0, windSpeed: 5.5 },
  ];

  const handlePredictYield = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: any = {
        environmental_temperature: envTemp,
        relative_humidity: relHum,
        hive_temperature: hiveTemp,
        hive_humidity: hiveHum,
        wind_speed: windSpeed,
        date: date,
      };
      if (honeyWeightLag1) payload.honey_weight_lag1 = parseFloat(honeyWeightLag1);
      if (rollMean3) payload.honey_weight_roll_mean_3 = parseFloat(rollMean3);

      const res = await api.post<HoneyYieldResponse>('/api/v1/predictions/yield', payload);
      setYieldResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate honey yield prediction.');
    } finally {
      setLoading(false);
    }
  };

  const handlePredictDaily = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: any = {
        environmental_temperature: envTemp,
        relative_humidity: relHum,
        hive_temperature: hiveTemp,
        hive_humidity: hiveHum,
        wind_speed: windSpeed,
        date: date,
      };
      const res = await api.post<DailyProductionResponse>('/api/v1/predictions/daily-production', payload);
      setDailyResult(res);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate daily production prediction.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-amber-500" /> Machine Learning Honey Intelligence
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Predictive yield and production estimation using trained scikit-learn & XGBoost inference models
        </p>
      </div>

      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Mode Tabs */}
      <div className="flex border-b border-slate-800 space-x-2 pb-1 text-xs">
        <button
          onClick={() => setTab('yield')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition ${
            tab === 'yield'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Estimated Honey Yield (kg)</span>
        </button>
        <button
          onClick={() => setTab('daily')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition ${
            tab === 'daily'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Daily Production Rate (kg/day)</span>
        </button>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-semibold mr-1">SIH Evaluation Presets:</span>
        {presets.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => applyPreset(p)}
            className="text-xs px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 text-slate-300 font-medium transition"
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <Card className="lg:col-span-2">
          <CardHeader
            title={tab === 'yield' ? 'Yield Prediction Inputs' : 'Daily Production Inputs'}
            subtitle="Environmental and hive climate telemetry parameters"
          />
          <CardContent>
            <form onSubmit={tab === 'yield' ? handlePredictYield : handlePredictDaily} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                    Ambient Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={envTemp}
                    onChange={(e) => setEnvTemp(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-sky-400" />
                    Relative Humidity (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={relHum}
                    onChange={(e) => setRelHum(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                    Internal Hive Temp (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={hiveTemp}
                    onChange={(e) => setHiveTemp(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-indigo-400" />
                    Internal Hive Humidity (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={hiveHum}
                    onChange={(e) => setHiveHum(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                    <Wind className="w-3.5 h-3.5 text-slate-400" />
                    Wind Speed (km/h)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    required
                    value={windSpeed}
                    onChange={(e) => setWindSpeed(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    Date (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm font-mono"
                  />
                </div>
              </div>

              {tab === 'yield' && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    {showAdvanced ? 'Hide Advanced Feature Overrides' : 'Show Advanced Feature Overrides (Historical Lags)'}
                  </button>

                  {showAdvanced && (
                    <div className="grid grid-cols-2 gap-3 mt-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <div>
                        <label className="block text-slate-400 mb-1">Lag-1 Honey Weight Override (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Automatic lookup"
                          value={honeyWeightLag1}
                          onChange={(e) => setHoneyWeightLag1(e.target.value)}
                          className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 mb-1">3-Day Rolling Mean (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Automatic lookup"
                          value={rollMean3}
                          onChange={(e) => setRollMean3(e.target.value)}
                          className="w-full p-2 rounded-lg bg-slate-900 border border-slate-800 text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button type="submit" size="lg" className="w-full mt-4" isLoading={loading}>
                Run ML Inference Engine <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <div className="space-y-6">
          <Card className="border border-amber-500/30 glow-honey">
            <CardHeader
              title="Inference Result"
              subtitle="Trained model prediction output"
            />
            <CardContent className="p-6 text-center space-y-4">
              {tab === 'yield' ? (
                yieldResult ? (
                  <div className="space-y-2 py-4">
                    <p className="text-xs uppercase font-bold text-slate-400">Estimated Honey Yield</p>
                    <h2 className="text-4xl sm:text-5xl font-black font-mono text-amber-400">
                      {yieldResult.predicted_yield_kg.toFixed(2)}{' '}
                      <span className="text-2xl text-slate-400 font-sans">kg</span>
                    </h2>
                    <p className="text-[11px] text-slate-400 font-mono pt-2">
                      Model: {yieldResult.model}
                    </p>
                  </div>
                ) : (
                  <div className="py-10 text-slate-500 text-xs">
                    Configure parameters and click "Run ML Inference Engine" to calculate yield estimate.
                  </div>
                )
              ) : dailyResult ? (
                <div className="space-y-2 py-4">
                  <p className="text-xs uppercase font-bold text-slate-400">Estimated Daily Production</p>
                  <h2 className="text-4xl sm:text-5xl font-black font-mono text-emerald-400">
                    {dailyResult.predicted_production_kg.toFixed(3)}{' '}
                    <span className="text-2xl text-slate-400 font-sans">kg/day</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 font-mono pt-2">
                    Model: {dailyResult.model}
                  </p>
                </div>
              ) : (
                <div className="py-10 text-slate-500 text-xs">
                  Configure parameters and click "Run ML Inference Engine" to calculate daily production.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Honest Model Note */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-300">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Scientific ML Framing</span>
            </div>
            <p className="leading-relaxed">
              Trained on empirical 2024 apiculture observations. Leaked features (e.g. Total Weight, Extract Honey) were strictly excluded from model feature sets to preserve realistic predictive validity.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
