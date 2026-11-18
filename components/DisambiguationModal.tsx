'use client';

import { useEffect, useState } from 'react';
import { startQuery } from '@/lib/api';
import { toast } from 'sonner';
import { X, Loader2, Sparkles, ChevronRight } from 'lucide-react';

export type DisambiguationOption = string | {
  label?: string;
  name?: string;
  text?: string;
  value?: string;
  choice?: string;
  canonical_name?: string;
  [key: string]: unknown;
};

interface Props {
  prompt: string;
  options: DisambiguationOption[];
  onChoice: () => void;
  onClose?: () => void;
}

function getOptionDisplay(opt: DisambiguationOption): string {
  if (typeof opt === 'string') return opt;
  if (!opt || typeof opt !== 'object') return String(opt);
  return (
    opt.label ||
    opt.name ||
    opt.text ||
    opt.canonical_name ||
    opt.value ||
    JSON.stringify(opt)
  );
}

function getOptionSubmitValue(opt: DisambiguationOption): string {
  if (typeof opt === 'string') return opt;
  if (!opt || typeof opt !== 'object') return String(opt);
  return (
    opt.choice ||
    opt.value ||
    opt.canonical_name ||
    opt.name ||
    opt.label ||
    JSON.stringify(opt)
  );
}

export default function DisambiguationModal({ prompt, options, onChoice, onClose }: Props) {
  const [submittingChoice, setSubmittingChoice] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function handleChoice(opt: DisambiguationOption) {
    const submitVal = getOptionSubmitValue(opt);
    if (submittingChoice) return;
    setSubmittingChoice(submitVal);
    try {
      await startQuery({ choice: submitVal });
      onChoice();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit choice');
      setSubmittingChoice(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="disambiguation-title"
        className="w-full max-w-lg rounded-2xl bg-[#161b22] border border-white/[0.12] shadow-2xl p-6 flex flex-col gap-5 text-neutral-200"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Sparkles size={16} />
            </div>
            <div>
              <h2
                id="disambiguation-title"
                className="text-sm font-semibold tracking-tight text-white"
              >
                Disambiguation Required
              </h2>
              <p className="text-[11px] text-neutral-400">
                Select the intended entity from the knowledge graph
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06] transition cursor-pointer"
              aria-label="Close modal"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-neutral-300 leading-relaxed">
          {prompt}
        </div>

        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          {options.map((option, i) => {
            const display = getOptionDisplay(option);
            const submitVal = getOptionSubmitValue(option);
            const isSelected = submittingChoice === submitVal;

            return (
              <button
                key={i}
                onClick={() => handleChoice(option)}
                disabled={Boolean(submittingChoice)}
                className="group w-full text-left rounded-xl border border-white/[0.08] hover:border-emerald-500/40 bg-white/[0.02] hover:bg-emerald-500/[0.08] px-4 py-3 text-xs text-neutral-200 hover:text-white transition duration-150 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 flex items-center justify-between cursor-pointer"
              >
                <span className="font-medium">{display}</span>
                {isSelected ? (
                  <Loader2 size={15} className="animate-spin text-emerald-400 shrink-0 ml-2" />
                ) : (
                  <ChevronRight size={14} className="text-neutral-500 group-hover:text-emerald-400 transition shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
