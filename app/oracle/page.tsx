'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import QueryInput from '@/components/QueryInput';
import ResultsPane from '@/components/ResultsPane';
import DisambiguationModal from '@/components/DisambiguationModal';
import { useQueryPoller } from '@/lib/useQueryPoller';
import {
  RotateCcw,
  Sparkles,
  Flame,
  Dna,
  ShieldCheck,
} from 'lucide-react';

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

export default function OraclePage() {
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const [modalDismissed, setModalDismissed] = useState(false);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [stagedPrompt, setStagedPrompt] = useState<string>('');

  const { data, isError, error } = useQueryPoller(pollingEnabled);

  const status = data?.status ?? (pollingEnabled ? 'processing' : 'idle');

  useEffect(() => {
    if (isError && error instanceof Error) {
      toast.error(error.message);
    }
  }, [isError, error]);

  function handlePollingStart(queryText: string) {
    setCurrentQuery(queryText);
    setModalDismissed(false);
    setPollingEnabled(true);
  }

  function handleDisambiguationChoice() {
    setPollingEnabled(true);
  }

  function handleReset() {
    setPollingEnabled(false);
    setModalDismissed(false);
    setCurrentQuery('');
    setStagedPrompt('');
  }

  return (
    <div className="flex flex-col h-full bg-[#0b0f14] text-neutral-200">
      {/* Clean Top Bar */}
      <header className="h-14 border-b border-white/[0.08] px-6 flex items-center justify-between shrink-0 bg-[#0d1117]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium text-sm">AI Assistant</span>
        </div>

        <div className="flex items-center gap-2">
          {status !== 'idle' && (
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
          {/* Blank Hero Slate */}
          {status === 'idle' && (
            <div className="flex-1 flex flex-col items-center justify-center py-10 my-auto text-center gap-8">
              {/* Glowing Emblem */}
              <div className="relative flex items-center justify-center">
                <div className="absolute -inset-4 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
                <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-b from-[#1b232e] to-[#121720] border border-emerald-500/30 text-emerald-400 shadow-2xl">
                  <Sparkles size={28} />
                </div>
              </div>

              {/* Title & Description */}
              <div className="max-w-md flex flex-col gap-2">
                <h2 className="text-2xl font-bold tracking-tight text-white">
                  Ayurveda AI Assistant
                </h2>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Ask natural language questions about medicinal plants, phytochemical constituents, and therapeutic applications powered by the knowledge graph.
                </p>
              </div>

              {/* Starter Query Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 w-full max-w-3xl text-left">
                {STARTER_PROMPTS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => setStagedPrompt(item.prompt)}
                    className="group p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-emerald-500/40 transition-all duration-150 flex flex-col justify-between gap-3 text-left cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06] group-hover:scale-105 transition">
                        {item.icon}
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400 px-2 py-0.5 rounded-full bg-white/[0.04]">
                        {item.tag}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-semibold text-neutral-200 group-hover:text-emerald-300 transition">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.prompt}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results Output */}
          {status !== 'idle' && (
            <div className="pb-36 pt-2">
              <ResultsPane
                status={status}
                data={data}
                currentQueryText={currentQuery}
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Composer */}
      <div className="sticky bottom-0 z-20 pb-5 pt-2 px-4 sm:px-6 bg-gradient-to-t from-[#0b0f14] via-[#0b0f14]/90 to-transparent">
        <div className="max-w-4xl w-full mx-auto">
          <QueryInput
            onPollingStart={handlePollingStart}
            isPolling={pollingEnabled && status === 'processing'}
            externalQuery={stagedPrompt}
          />
        </div>
      </div>

      {/* Disambiguation Modal */}
      {status === 'disambiguation' && data?.prompt && !modalDismissed && (
        <DisambiguationModal
          prompt={data.prompt}
          options={data.options ?? []}
          onChoice={handleDisambiguationChoice}
          onClose={() => setModalDismissed(true)}
        />
      )}
    </div>
  );
}
