import React, { useState, useRef } from 'react';
import { api } from '../api/client';
import { VoiceQueryResponse } from '../types';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import {
  Mic,
  MicOff,
  Send,
  Layers,
  Sparkles,
  Search,
  Volume2,
  RefreshCw,
  MessageSquare,
} from 'lucide-react';

export const VoiceAssistant: React.FC = () => {
  const [queryText, setQueryText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VoiceQueryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const exampleQueries = [
    'Show trace of BATCH-2026-0001',
    'What is the status of BATCH-2026-0001?',
    'What is the yield prediction?',
    'Check reconciliation for BATCH-2026-0001',
    'Show lab test results for BATCH-2026-0001',
    'Show genealogy of BATCH-2026-0001',
  ];

  const handleTextQuery = async (textToSubmit?: string) => {
    const query = textToSubmit || queryText;
    if (!query.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api.post<VoiceQueryResponse>('/api/v1/voice/query', { text: query });
      setResult(res);
      setQueryText(query);
    } catch (err: any) {
      setError(err.message || 'Voice query failed to process.');
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await sendAudioQuery(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      setError('Microphone access unavailable or denied. You can use the text inquiry input below.');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioQuery = async (audioBlob: Blob) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice_query.wav');

      const res = await api.post<VoiceQueryResponse>('/api/v1/voice/ask', formData);
      setResult(res);
      setQueryText(res.transcript || '');
    } catch (err: any) {
      setError(err.message || 'Speech recognition processing failed. Try speaking closer to microphone or use text.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-charcoal font-display tracking-tight flex items-center gap-2.5">
          <MessageSquare className="w-7 h-7 text-forest-700" />
          <span>Ask HoneyChain</span>
        </h1>
        <p className="text-xs sm:text-sm text-charcoal-muted mt-1">
          Spoken voice inquiry & natural language query assistant for beekeepers and field operators
        </p>
      </div>

      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Voice Recording Center */}
      <div className="bg-white border border-border-warm rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-subtle">
        <div className="space-y-2 max-w-md mx-auto">
          <h2 className="text-base font-bold font-display text-charcoal">Voice Query Input</h2>
          <p className="text-xs text-charcoal-muted leading-relaxed">
            Click the microphone and speak your batch inquiry in English, Hindi, or Marathi.
          </p>
        </div>

        {/* Tactile Microphone Button (>= 56px touch target) */}
        <div className="flex flex-col items-center justify-center gap-3">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={loading}
            className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all cursor-pointer select-none shadow-subtle ${
              isRecording
                ? 'bg-terracotta-700 text-white animate-pulse border-2 border-terracotta-800'
                : 'bg-forest-700 hover:bg-forest-800 active:bg-forest-900 text-white border-2 border-forest-800'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            aria-label={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>

          <span className="font-mono text-xs font-semibold text-charcoal">
            {isRecording
              ? 'Recording audio... click again to process'
              : loading
              ? 'Analyzing speech & intent...'
              : 'Tap to Speak'}
          </span>
        </div>

        {/* Text Input Fallback */}
        <div className="pt-6 border-t border-border-subtle max-w-xl mx-auto space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTextQuery();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Or type your inquiry (e.g. Show trace of BATCH-2026-0001)..."
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-surface-subtle border border-border-warm rounded-lg text-xs sm:text-sm text-charcoal placeholder:text-charcoal-muted/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-600/20 focus:border-forest-600"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              icon={<Send className="w-4 h-4" />}
            >
              Ask
            </Button>
          </form>

          {/* Quick Example Query Chips */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center pt-2 text-xs">
            <span className="text-[11px] font-mono text-charcoal-muted mr-1">Examples:</span>
            {exampleQueries.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleTextQuery(q)}
                className="px-2.5 py-1 rounded-md bg-surface-subtle hover:bg-surface-tint border border-border-subtle text-[11px] font-mono text-charcoal-muted hover:text-charcoal transition"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Query Result Card */}
      {result && (
        <div className="bg-white border border-border-warm rounded-2xl p-6 shadow-subtle space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="text-xs font-bold font-display text-charcoal">Query Resolution</span>
              <Badge variant="emerald" size="sm">
                INTENT: {result.intent}
              </Badge>
              {result.batch_id && (
                <Badge variant="amber" size="sm">
                  BATCH: {result.batch_id}
                </Badge>
              )}
            </div>
            {result.provider && (
              <span className="text-[11px] font-mono text-charcoal-muted">STT: {result.provider}</span>
            )}
          </div>

          {result.transcript && (
            <div className="p-3 rounded-lg bg-surface-subtle border border-border-subtle text-xs space-y-0.5">
              <span className="text-[10px] font-mono text-charcoal-muted uppercase">Recognized Transcript</span>
              <p className="font-mono text-charcoal font-medium">"{result.transcript}"</p>
            </div>
          )}

          <div className="p-4 rounded-xl bg-forest-50 border border-forest-200 text-xs space-y-1">
            <span className="text-[10px] font-mono text-forest-700 uppercase font-bold">System Response</span>
            <p className="text-sm font-semibold text-forest-900 leading-relaxed">{result.message}</p>
          </div>

          {/* Structured Context Data */}
          {result.data && (
            <div className="space-y-1.5 text-xs">
              <span className="text-[11px] font-mono text-charcoal-muted uppercase font-semibold">
                Operational Batch Details
              </span>
              <pre className="p-3 bg-surface-subtle border border-border-subtle rounded-lg font-mono text-[11px] text-charcoal overflow-x-auto">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
