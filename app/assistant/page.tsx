'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import QueryInput from '@/components/QueryInput';
import ResultsPane, { ResultsData } from '@/components/ResultsPane';
import DisambiguationModal, { DisambiguationOption } from '@/components/DisambiguationModal';
import { useQueryPoller } from '@/lib/useQueryPoller';
import {
  RotateCcw,
  Sparkles,
  Flame,
  Dna,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';

export interface ChatTurn {
  id: string;
  query: string;
  catalogName?: string;
  status: 'submitting' | 'processing' | 'done' | 'error' | 'disambiguation';
  data?: ResultsData;
  errorMessage?: string;
  timestamp: number;
}

const STARTER_PROMPTS = [
  {
    icon: <Flame size={16} className="text-amber-400" />,
    title: 'Anti-inflammatory Mechanisms',
    prompt: 'Which plants exhibit strong anti-inflammatory properties and what are their active compounds?',
    tag: 'Bioactivity',
  },
  {
    icon: <Dna size={16} className="text-emerald-400" />,
    title: 'Phytochemical Targets',
    prompt: 'What are the main therapeutic uses and protein targets of Curcumin and Withanolides?',
    tag: 'Phytochemicals',
  },
  {
    icon: <ShieldCheck size={16} className="text-cyan-400" />,
    title: 'Respiratory Disorders',
    prompt: 'Can Tulsi (Ocimum tenuiflorum) be used to treat cough and respiratory infections?',
    tag: 'Clinical Use',
  },
];

export default function AssistantPage() {
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [activeTurnId, setActiveTurnId] = useState<string | null>(null);
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const [modalDismissed, setModalDismissed] = useState(false);
  const [stagedPrompt, setStagedPrompt] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data, isError, error } = useQueryPoller(pollingEnabled, activeTurnId || undefined);

  // Synchronize polled query status with the active turn in history
  useEffect(() => {
    if (!activeTurnId) return;

    if (isError && error instanceof Error) {
      toast.error(error.message);
      setTurns((prev) =>
        prev.map((turn) =>
          turn.id === activeTurnId
            ? { ...turn, status: 'error', errorMessage: error.message }
            : turn
        )
      );
      setPollingEnabled(false);
      setActiveTurnId(null);
      return;
    }

    if (data) {
      if (data.status === 'done') {
        setTurns((prev) =>
          prev.map((turn) =>
            turn.id === activeTurnId
              ? { ...turn, status: 'done', data }
              : turn
          )
        );
        setPollingEnabled(false);
        setActiveTurnId(null);
      } else if (data.status === 'disambiguation') {
        setTurns((prev) =>
          prev.map((turn) =>
            turn.id === activeTurnId
              ? { ...turn, status: 'disambiguation', data }
              : turn
          )
        );
      } else if (data.status === 'error') {
        setTurns((prev) =>
          prev.map((turn) =>
            turn.id === activeTurnId
              ? {
                  ...turn,
                  status: 'error',
                  data,
                  errorMessage: 'The knowledge graph query encountered an error on the server.',
                }
              : turn
          )
        );
        setPollingEnabled(false);
        setActiveTurnId(null);
      }
    }
  }, [data, isError, error, activeTurnId]);

  // Smooth auto-scroll down as questions are asked and responses arrive
  useEffect(() => {
    if (turns.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [turns, data]);

  function handlePollingStart(queryText: string, catalogName?: string) {
    const turnId = crypto.randomUUID();
    const newTurn: ChatTurn = {
      id: turnId,
      query: queryText,
      catalogName,
      status: 'processing',
      timestamp: Date.now(),
    };

    setTurns((prev) => [...prev, newTurn]);
    setActiveTurnId(turnId);
    setModalDismissed(false);
    setPollingEnabled(true);
  }

  function handleDisambiguationChoice() {
    if (activeTurnId) {
      setTurns((prev) =>
        prev.map((turn) =>
          turn.id === activeTurnId ? { ...turn, status: 'processing' } : turn
        )
      );
    }
    setPollingEnabled(true);
  }

  function handleReset() {
    setTurns([]);
    setActiveTurnId(null);
    setPollingEnabled(false);
    setModalDismissed(false);
    setStagedPrompt('');
  }

  const activeTurn = turns.find((t) => t.id === activeTurnId);
  const activePrompt = activeTurn?.data?.prompt as string | undefined;
  const activeOptions = (activeTurn?.data as { options?: unknown } | undefined)?.options;

  return (
    <div className="flex flex-col h-full bg-[#0b0f14] text-neutral-200">
      {/* Clean Top Bar */}
      <header className="h-14 border-b border-white/[0.08] px-6 flex items-center justify-between shrink-0 bg-[#0d1117]/80 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
            <MessageSquare size={13} />
          </div>
          <span className="text-white font-medium text-sm">AI Assistant</span>
          {turns.length > 0 && (
            <span className="text-xs text-neutral-400 font-mono">
              · {turns.length} {turns.length === 1 ? 'question' : 'questions'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {turns.length > 0 && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white px-3 py-1.5 rounded-xl border border-white/[0.08] hover:bg-white/[0.04] transition cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>New Session</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Scrollable Canvas */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-8 flex flex-col">
        <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col">
          {/* Blank Hero Slate when no conversation has started */}
          {turns.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center py-10 my-auto text-center gap-8">
              {/* Glowing Emblem */}
              <div className="relative flex items-center justify-center">
                <div className="absolute -inset-4 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
                <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#161b22] to-[#0d1117] border border-white/[0.1] shadow-2xl">
                  <Sparkles size={28} className="text-emerald-400" />
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-2 max-w-lg">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Ayurvedic Knowledge Graph
                </h2>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Ask natural language questions about Ayurvedic medicinal plants, active phytochemicals, biological targets, and therapeutic bioactivities.
                </p>
              </div>

              {/* Starter Query Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-2xl text-left">
                {STARTER_PROMPTS.map((card, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setStagedPrompt(card.prompt)}
                    className="p-4 rounded-xl bg-[#161b22]/80 border border-white/[0.06] hover:border-emerald-500/40 hover:bg-[#161b22] transition-all duration-150 flex flex-col justify-between gap-3 text-left group cursor-pointer shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="p-2 rounded-lg bg-white/[0.04] border border-white/[0.06] group-hover:bg-emerald-500/10 group-hover:border-emerald-500/20 transition">
                        {card.icon}
                      </div>
                      <span className="text-[10px] font-medium font-mono px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-neutral-400 group-hover:text-emerald-300 transition">
                        {card.tag}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xs font-semibold text-neutral-200 group-hover:text-white transition">
                        {card.title}
                      </h3>
                      <p className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                        {card.prompt}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stacked Chat Stream: Questions and Answers stacked chronologically */}
          {turns.length > 0 && (
            <div className="flex flex-col gap-8 pb-6">
              {turns.map((turn) => (
                <div key={turn.id} className="flex flex-col gap-4">
                  {/* User Query Bubble */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl bg-white/[0.08] border border-white/[0.1] px-5 py-3.5 text-sm text-white shadow-md flex flex-col gap-1.5">
                      <p className="whitespace-pre-wrap leading-relaxed">{turn.query}</p>
                      {turn.catalogName && (
                        <div className="pt-1">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                            Catalog: {turn.catalogName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Assistant Response Card */}
                  <ResultsPane
                    status={turn.status}
                    data={turn.data}
                    errorMessage={turn.errorMessage}
                  />
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Disambiguation modal if server asks for clarification on active query */}
          {activeTurn?.status === 'disambiguation' && activePrompt && !modalDismissed && (
            <DisambiguationModal
              prompt={typeof activePrompt === 'string' ? activePrompt : JSON.stringify(activePrompt)}
              options={Array.isArray(activeOptions) ? (activeOptions as DisambiguationOption[]) : []}
              onChoice={handleDisambiguationChoice}
              onClose={() => setModalDismissed(true)}
            />
          )}
        </div>
      </div>

      {/* Floating Bottom Composer */}
      <div className="shrink-0 p-4 sm:p-6 bg-gradient-to-t from-[#0b0f14] via-[#0b0f14]/95 to-transparent">
        <div className="max-w-4xl mx-auto">
          <QueryInput
            onPollingStart={handlePollingStart}
            isPolling={pollingEnabled && !!activeTurnId}
            externalQuery={stagedPrompt}
          />
        </div>
      </div>
    </div>
  );
}
