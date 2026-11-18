'use client';

import { useState, FormEvent, KeyboardEvent, useRef, useEffect } from 'react';
import { startQuery, transcribeAudio } from '@/lib/api';
import { toast } from 'sonner';
import {
  ArrowUp,
  Loader2,
  Database,
  CornerDownLeft,
  Mic,
  Square,
  Languages,
} from 'lucide-react';

interface Props {
  onPollingStart: (queryText: string) => void;
  isPolling: boolean;
  externalQuery?: string;
}

const SUPPORTED_LANGUAGES = [
  { code: 'unknown', label: 'Auto-detect (22+ Languages)' },
  { code: 'en-IN', label: 'English (India)' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'te-IN', label: 'Telugu' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'ml-IN', label: 'Malayalam' },
  { code: 'mr-IN', label: 'Marathi' },
  { code: 'gu-IN', label: 'Gujarati' },
  { code: 'bn-IN', label: 'Bengali' },
];

export default function QueryInput({ onPollingStart, isPolling, externalQuery }: Props) {
  const [query, setQuery] = useState('');
  const [catalogName, setCatalogName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCatalogInput, setShowCatalogInput] = useState(false);
  const [showLanguageSelect, setShowLanguageSelect] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('unknown');

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (externalQuery) {
      setQuery(externalQuery);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [externalQuery]);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [query]);

  // Clean up recording timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const busy = isSubmitting || isPolling || isTranscribing;

  async function handleSubmit(e?: FormEvent) {
    if (e) e.preventDefault();
    if (!query.trim() || busy) return;
    const submittedQuery = query.trim();
    setIsSubmitting(true);
    try {
      await startQuery({
        query: submittedQuery,
        catalog_name: catalogName.trim() || undefined,
      });
      onPollingStart(submittedQuery);
      setQuery('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to start query');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  // Start voice recording with MediaRecorder
  async function startRecording() {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      toast.error('Voice recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      // Determine best supported mime type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : '';

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        // Stop all audio tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }

        const rawMime = recorder.mimeType || 'audio/webm';
        const cleanMime = rawMime.split(';')[0].trim() || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, {
          type: cleanMime,
        });

        if (audioBlob.size === 0) {
          toast.error('No audio captured. Please try speaking again.');
          setIsRecording(false);
          setRecordingSeconds(0);
          return;
        }

        await processTranscription(audioBlob);
      };

      recorder.start(250); // collect chunks every 250ms
      setIsRecording(true);
      setRecordingSeconds(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to access microphone';
      if (message.includes('Permission') || message.includes('denied')) {
        toast.error('Microphone access was denied. Please allow microphone permissions in your browser.');
      } else {
        toast.error(`Microphone error: ${message}`);
      }
      setIsRecording(false);
    }
  }

  // Stop voice recording
  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }

  // Transcribe recorded audio with Sarvam AI
  async function processTranscription(blob: Blob) {
    setIsTranscribing(true);
    const toastId = toast.loading('Transcribing speech with Sarvam AI…');
    try {
      const res = await transcribeAudio(blob, selectedLanguage);
      const transcribedText = res.transcript?.trim();

      if (transcribedText) {
        setQuery((prev) => {
          const combined = prev.trim() ? `${prev.trim()} ${transcribedText}` : transcribedText;
          return combined;
        });
        toast.success('Speech transcribed successfully!', { id: toastId });
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      } else {
        toast.info('No speech detected in audio. Please speak clearly into your mic.', { id: toastId });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to transcribe audio';
      toast.error(message, { id: toastId });
    } finally {
      setIsTranscribing(false);
      setRecordingSeconds(0);
    }
  }

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className={`relative flex flex-col rounded-2xl bg-[#161b22]/95 border transition-all duration-200 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl ${
          isRecording
            ? 'border-red-500/60 shadow-[0_8px_32px_rgba(239,68,68,0.15)] ring-1 ring-red-500/30'
            : isTranscribing
            ? 'border-cyan-500/50 shadow-[0_8px_32px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30'
            : 'border-white/[0.12] focus-within:border-emerald-500/50 focus-within:shadow-[0_8px_32px_rgba(16,185,129,0.12)]'
        }`}
      >
        {/* Optional catalog banner if open */}
        {showCatalogInput && (
          <div className="px-4 pt-3 pb-1 border-b border-white/[0.06] flex items-center gap-2">
            <Database size={13} className="text-emerald-400" />
            <input
              type="text"
              placeholder="Specify custom catalog name (default: default_catalog)"
              value={catalogName}
              onChange={(e) => setCatalogName(e.target.value)}
              className="w-full bg-transparent text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setCatalogName('');
                setShowCatalogInput(false);
              }}
              className="text-[11px] text-neutral-400 hover:text-white px-1.5 py-0.5 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Optional language selection banner if open */}
        {showLanguageSelect && (
          <div className="px-4 py-2 border-b border-white/[0.06] flex items-center gap-2 bg-white/[0.02]">
            <Languages size={13} className="text-cyan-400 shrink-0" />
            <span className="text-[11px] text-neutral-400 shrink-0">STT Language:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-[#0d1117] text-xs text-neutral-200 border border-white/[0.1] rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-500"
            >
              {SUPPORTED_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowLanguageSelect(false)}
              className="text-[11px] text-neutral-400 hover:text-white px-1.5 py-0.5 ml-auto cursor-pointer"
            >
              Done
            </button>
          </div>
        )}

        {/* Recording active banner */}
        {isRecording && (
          <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between text-xs text-red-200 rounded-t-2xl animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
              </span>
              <span className="font-medium">Listening to your voice…</span>
              <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300">
                {formatSeconds(recordingSeconds)}
              </span>
            </div>
            <button
              type="button"
              onClick={stopRecording}
              className="text-[11px] font-medium text-red-300 hover:text-white px-2 py-0.5 rounded-md bg-red-500/20 hover:bg-red-500/30 transition cursor-pointer"
            >
              Click to Stop & Transcribe
            </button>
          </div>
        )}

        {/* Transcribing active banner */}
        {isTranscribing && (
          <div className="px-4 py-2 bg-cyan-500/10 border-b border-cyan-500/20 flex items-center gap-2 text-xs text-cyan-200 rounded-t-2xl">
            <Loader2 size={13} className="animate-spin text-cyan-400" />
            <span>Transcribing with Sarvam AI Saaras model…</span>
          </div>
        )}

        {/* Text Input Area */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={busy}
          placeholder="Ask anything about Ayurvedic herbs, compounds, or bioactivities… or click the mic to speak"
          className="w-full bg-transparent px-4 pt-3.5 pb-2 text-sm text-neutral-100 placeholder-neutral-400 resize-none focus:outline-none leading-relaxed max-h-[220px]"
        />

        {/* Action Toolbar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1 text-xs text-neutral-400">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Catalog toggle */}
            <button
              type="button"
              onClick={() => setShowCatalogInput(!showCatalogInput)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                catalogName || showCatalogInput
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-neutral-200 border border-white/[0.06]'
              }`}
            >
              <Database size={12} />
              <span>{catalogName ? `Catalog: ${catalogName}` : 'Catalog'}</span>
            </button>

            {/* Language toggle for Sarvam AI STT */}
            <button
              type="button"
              onClick={() => setShowLanguageSelect(!showLanguageSelect)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${
                selectedLanguage !== 'unknown' || showLanguageSelect
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-neutral-400 hover:text-neutral-200 border border-white/[0.06]'
              }`}
              title="Select Sarvam AI Speech-to-Text Language"
            >
              <Languages size={12} />
              <span>
                {selectedLanguage === 'unknown'
                  ? 'Voice: Auto'
                  : selectedLanguage.toUpperCase()}
              </span>
            </button>

            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-neutral-400">
              <CornerDownLeft size={10} /> Enter to send
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Sarvam AI Microphone Button */}
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isSubmitting || isTranscribing}
              className={`relative flex items-center justify-center h-8 w-8 rounded-xl transition-all duration-150 cursor-pointer ${
                isRecording
                  ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.7)] animate-pulse'
                  : isTranscribing
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 cursor-wait'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-neutral-300 hover:text-white border border-white/[0.08]'
              }`}
              title={
                isRecording
                  ? 'Stop recording and transcribe'
                  : 'Speak prompt (Sarvam AI Speech-to-Text)'
              }
              aria-label="Microphone"
            >
              {isTranscribing ? (
                <Loader2 size={15} className="animate-spin" />
              ) : isRecording ? (
                <Square size={14} className="fill-current" />
              ) : (
                <Mic size={15} />
              )}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={busy || !query.trim()}
              className="flex items-center justify-center h-8 w-8 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-30 disabled:cursor-not-allowed text-white shadow-sm transition-all duration-150 cursor-pointer"
              aria-label="Send query"
            >
              {busy ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <ArrowUp size={16} className="stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
