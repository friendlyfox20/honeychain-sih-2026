import React, { useState, useRef } from 'react';
import { api } from '../api/client';
import { VoiceQueryResponse } from '../types';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Bot,
  Layers,
  Search,
  Volume2,
  Terminal,
  Activity,
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
      setError('Microphone access denied or unavailable. You can use the text input below.');
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
      setError(err.message || 'Audio transcription or query processing failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Mic className="w-8 h-8 text-amber-500" /> Voice Query & Intent Assistant
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Speech-to-Text conversion integrated with operational HoneyChain RBAC and query intent parser
        </p>
      </div>

      {error && (
        <Alert type="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Voice Control Station */}
      <Card className="text-center p-8 border border-amber-500/20 bg-gradient-to-b from-amber-500/5 via-slate-900 to-slate-900">
        <CardContent className="p-0 space-y-6">
          <div className="space-y-2">
            <div className="relative inline-block">
              {isRecording && (
                <div className="absolute -inset-3 rounded-full bg-rose-500/30 animate-ping pointer-events-none" />
              )}
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={loading}
                className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl ${
                  isRecording
                    ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-rose-600/50 scale-105'
                    : 'bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 hover:scale-105 shadow-amber-500/30'
                }`}
              >
                {isRecording ? <MicOff className="w-10 h-10" /> : <Mic className="w-10 h-10 stroke-[2.2]" />}
              </button>
            </div>

            <p className="text-sm font-bold text-white tracking-tight pt-2">
              {isRecording ? 'Listening... Click to Finish & Process' : 'Click Microphone to Speak Query'}
            </p>
            <p className="text-xs text-slate-400">
              {isRecording ? 'Capturing audio stream' : 'Or type your inquiry in natural language below'}
            </p>
          </div>

          {/* Text Input Fallback */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleTextQuery();
            }}
            className="flex items-center gap-2 max-w-xl mx-auto"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Ask e.g. 'Show trace of BATCH-2026-0001'..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <Button type="submit" isLoading={loading} icon={<Send className="w-4 h-4" />}>
              Ask
            </Button>
          </form>

          {/* Quick Example Query Pills */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
              Example Voice Intent Prompts:
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {exampleQueries.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setQueryText(ex);
                    handleTextQuery(ex);
                  }}
                  className="text-xs px-3 py-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-300 transition"
                >
                  "{ex}"
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Structured Query Response Card */}
      {result && (
        <Card className="border border-emerald-500/30 glow-emerald">
          <CardHeader
            title="Assistant Response"
            subtitle="Parsed intent and structured data execution"
            badge={
              <Badge variant="emerald">
                <Sparkles className="w-3 h-3" /> Intent: {result.intent}
              </Badge>
            }
          />
          <CardContent className="p-6 space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <Bot className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-400">
                  Transcribed Input: <span className="text-slate-200 italic">"{result.transcript}"</span>
                </p>
                <p className="text-sm font-bold text-white leading-relaxed">{result.message}</p>
              </div>
            </div>

            {result.batch_id && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Target Batch Reference:</span>
                <span className="font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                  {result.batch_id}
                </span>
              </div>
            )}

            {result.data && (
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Execution Payload Data:
                </span>
                <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-850 font-mono text-xs text-amber-300 overflow-x-auto max-h-64">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
