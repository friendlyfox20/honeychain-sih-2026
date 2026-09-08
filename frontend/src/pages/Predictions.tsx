import React, { useState } from 'react';
import { api } from '../api/client';
import { HoneyYieldResponse, DailyProductionResponse } from '../types';
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
  CheckCircle2,
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

  const presets = [
    { name: 'Optimal Spring Bloom', envTemp: 24.0, relHum: 65.0, hiveTemp: 34.5, hiveHum: 55.0, windSpeed: 3.5 },
    { name: 'Monsoon High Humidity', envTemp: 27.5, relHum: 88.0, hiveTemp: 35.0, hiveHum: 72.0, windSpeed: 8.0 },
    { name: 'Dry Summer Season', envTemp: 33.0, relHum: 42.0, hiveTemp: 36.5, hiveHum: 48.0, windSpeed: 5.5 },
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setEnvTemp(preset.envTemp);
    setRelHum(preset.relHum);
    setHiveTemp(preset.hiveTemp);
    setHiveHum(preset.hiveHum);
    setWindSpeed(preset.windSpeed);
  };

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
      setError(err.message || 'Failed to calculate honey yield estimation.');
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
      setError(err.message || 'Failed to calculate daily production estimation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-charcoal font-display tracking-tight flex items-center gap-2.5">
          <Sparkles className="w-7 h-7 text-forest-700" />
          <span>Honey Production Intelligence</span>
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
          Predictive decision support models forecasting harvest volume and daily apiary production
        </p>
      </div>

      {/* Model Selection Tabs */}
      <div className="flex items-center gap-2 border-b border-border-warm pb-1">
        <button
          onClick={() => setTab('yield')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
            tab === 'yield'
              ? 'bg-forest-700 text-white shadow-subtle'
              : 'text-charcoal-muted hover:text-charcoal hover:bg-surface-tint'
          }`}
        >
          Estimated Honey Yield (kg)
        </button>
        <button
          onClick={() => setTab('daily')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${
            tab === 'daily'
              ? 'bg-forest-700 text-white shadow-subtle'
              : 'text-charcoal-muted hover:text-charcoal hover:bg-surface-tint'
          }`}
        >
          Estimated Daily Production (kg/day)
        </button>
      </div>

      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Input Form & Presets */}
      <div className="bg-white border border-border-warm rounded-2xl p-6 shadow-subtle space-y-6">
        {/* Field Scenario Presets */}
        <div className="space-y-2 pb-4 border-b border-border-subtle">
          <span className="text-[11px] font-mono font-semibold uppercase text-charcoal-muted block">
            Agricultural Scenario Presets
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {presets.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyPreset(p)}
                className="px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface-tint border border-border-subtle text-xs text-charcoal font-medium transition"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Input Parameters Form */}
        <form onSubmit={tab === 'yield' ? handlePredictYield : handlePredictDaily} className="space-y-5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-forest-700" />
                <span>Ambient Temp (°C)</span>
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={envTemp}
                onChange={(e) => setEnvTemp(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg font-mono text-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-forest-700" />
                <span>Ambient Relative Humidity (%)</span>
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={relHum}
                onChange={(e) => setRelHum(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg font-mono text-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1 flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-forest-700" />
                <span>Wind Velocity (km/h)</span>
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={windSpeed}
                onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg font-mono text-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1 flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-honey-600" />
                <span>Internal Brood Temp (°C)</span>
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={hiveTemp}
                onChange={(e) => setHiveTemp(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg font-mono text-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-honey-600" />
                <span>Hive Internal Humidity (%)</span>
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={hiveHum}
                onChange={(e) => setHiveHum(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg font-mono text-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-charcoal mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-charcoal-muted" />
                <span>Observation Date</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-surface-subtle border border-border-warm rounded-lg font-mono text-charcoal focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-charcoal-muted hover:text-charcoal underline"
            >
              {showAdvanced ? 'Hide Historical Lag Inputs' : 'Show Historical Lag Inputs (Optional)'}
            </button>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              icon={<Sparkles className="w-4 h-4" />}
            >
              {tab === 'yield' ? 'Calculate Estimated Yield' : 'Calculate Daily Production'}
            </Button>
          </div>

          {showAdvanced && (
            <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-charcoal mb-1">Previous Extraction Lag (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 24.5"
                  value={honeyWeightLag1}
                  onChange={(e) => setHoneyWeightLag1(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-border-warm rounded-lg font-mono text-charcoal text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-charcoal mb-1">Rolling Mean (3 extractions)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 22.8"
                  value={rollMean3}
                  onChange={(e) => setRollMean3(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-border-warm rounded-lg font-mono text-charcoal text-xs"
                />
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Results Card */}
      {((tab === 'yield' && yieldResult) || (tab === 'daily' && dailyResult)) && (
        <div className="bg-white border border-border-warm rounded-2xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <span className="text-xs font-bold font-display text-charcoal">
              {tab === 'yield' ? 'Seasonal Yield Forecast' : 'Daily Colony Production Rate'}
            </span>
            <span className="text-[11px] font-mono text-forest-700 bg-forest-50 px-2 py-0.5 rounded border border-forest-200">
              {tab === 'yield' ? yieldResult?.model : dailyResult?.model}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 p-5 rounded-xl bg-forest-50 border border-forest-200">
            <div>
              <span className="text-xs font-mono text-forest-800 uppercase block">
                {tab === 'yield' ? 'Estimated Total Extraction' : 'Estimated Daily Rate'}
              </span>
              <div className="text-3xl font-extrabold font-mono text-forest-900 tabular-nums mt-1">
                {tab === 'yield'
                  ? `${yieldResult?.predicted_yield_kg.toFixed(2)} kg`
                  : `${dailyResult?.predicted_production_kg.toFixed(2)} kg/day`}
              </div>
            </div>
            <p className="text-xs text-forest-800 font-medium sm:text-right max-w-xs">
              Based on floristic temperature, hive humidity, and ambient wind conditions.
            </p>
          </div>

          <p className="text-[11px] text-charcoal-muted leading-relaxed">
            * Decision support tool designed for seasonal apiary planning and logistics preparation. Actual hive output varies based on queen health, pest management, and floral nectar secretion.
          </p>
        </div>
      )}
    </div>
  );
};
