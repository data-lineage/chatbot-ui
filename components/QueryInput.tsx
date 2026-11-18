'use client';

import { useState, FormEvent, KeyboardEvent, useRef, useEffect } from 'react';
import { startQuery } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowUp, Loader2, Database, CornerDownLeft } from 'lucide-react';

interface Props {
  onPollingStart: (queryText: string) => void;
  isPolling: boolean;
  externalQuery?: string;
}

export default function QueryInput({ onPollingStart, isPolling, externalQuery }: Props) {
  const [query, setQuery] = useState('');
  const [catalogName, setCatalogName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCatalogInput, setShowCatalogInput] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const busy = isSubmitting || isPolling;

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

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="relative flex flex-col rounded-2xl bg-[#161b22]/95 border border-white/[0.12] shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-xl focus-within:border-emerald-500/50 focus-within:shadow-[0_8px_32px_rgba(16,185,129,0.12)] transition-all duration-200"
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
              className="text-[11px] text-neutral-400 hover:text-white px-1.5 py-0.5"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Text Input */}
        <textarea
          ref={textareaRef}
          rows={1}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={busy}
          placeholder="Ask anything about Ayurvedic herbs, compounds, bioactivities, or targets… (Shift+Enter for new line)"
          className="w-full bg-transparent px-4 pt-3.5 pb-2 text-sm text-neutral-100 placeholder-neutral-400 resize-none focus:outline-none leading-relaxed max-h-[220px]"
        />

        {/* Action Toolbar */}
        <div className="flex items-center justify-between px-3 pb-2.5 pt-1 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
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

            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-neutral-400">
              <CornerDownLeft size={10} /> Enter to send
            </span>
          </div>

          <div className="flex items-center gap-2">
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
