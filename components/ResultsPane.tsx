'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  AlertTriangle,
  Copy,
  Check,
  Database,
  Sparkles,
  Tag,
  Bot,
  FileCode,
} from 'lucide-react';

export interface CanonicalEntityObject {
  original_text?: string;
  canonical_name?: string;
  node_type?: string;
  score?: number;
  match_type?: string;
  matched_property?: string;
  canonical_property?: string;
  index?: number;
  resolved?: boolean;
}

export type CanonicalEntity = string | CanonicalEntityObject;

export interface ResultsData {
  status: string;
  answer?: string | Record<string, unknown>;
  canonical_entities?: CanonicalEntity[];
  cypher_query?: string | Record<string, unknown>;
  errors?: (string | Record<string, unknown>)[];
}

interface Props {
  status: string | undefined;
  data: ResultsData | undefined;
  currentQueryText?: string;
}

function LoadingThinkingState() {
  return (
    <div className="flex flex-col gap-5 p-6 rounded-2xl bg-[#161b22]/70 border border-white/[0.08] shadow-lg animate-pulse">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          <Sparkles size={16} className="animate-spin" />
        </div>
        <div className="flex flex-col gap-1">
          <div className="h-4 bg-white/10 rounded w-48" />
          <div className="h-3 bg-white/5 rounded w-32" />
        </div>
      </div>

      <div className="space-y-2.5 pt-2">
        <div className="h-3.5 bg-white/10 rounded w-full" />
        <div className="h-3.5 bg-white/10 rounded w-11/12" />
        <div className="h-3.5 bg-white/10 rounded w-4/5" />
        <div className="h-3.5 bg-white/10 rounded w-3/5" />
      </div>

      <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400/90 font-medium">
        <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
        Searching knowledge graph & synthesizing response…
      </div>
    </div>
  );
}

function parseEntity(entity: CanonicalEntity) {
  if (typeof entity === 'string') {
    return { name: entity, original: '', type: 'Entity', score: null };
  }
  return {
    name: entity.canonical_name || entity.original_text || 'Entity',
    original: entity.original_text || '',
    type: entity.node_type || 'Entity',
    score: typeof entity.score === 'number' ? (entity.score * 100).toFixed(0) : null,
    matchedProperty: entity.matched_property,
  };
}

export default function ResultsPane({ status, data, currentQueryText }: Props) {
  const [activeTab, setActiveTab] = useState<'answer' | 'entities' | 'cypher'>('answer');
  const [copied, setCopied] = useState(false);

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  if (!status || status === 'idle') {
    return null;
  }

  if (status === 'processing' || status === 'submitting') {
    return (
      <div className="space-y-6">
        {currentQueryText && (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl bg-white/[0.06] border border-white/[0.08] px-5 py-3 text-sm text-neutral-100 shadow-md">
              {currentQueryText}
            </div>
          </div>
        )}
        <LoadingThinkingState />
      </div>
    );
  }

  if (status === 'disambiguation') {
    return null; // Handled by DisambiguationModal
  }

  if (status === 'error') {
    return (
      <div className="space-y-6">
        {currentQueryText && (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl bg-white/[0.06] border border-white/[0.08] px-5 py-3 text-sm text-neutral-100 shadow-md">
              {currentQueryText}
            </div>
          </div>
        )}
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 text-sm text-rose-200 flex items-start gap-3.5 shadow-lg backdrop-blur-md">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-400" />
          <div>
            <p className="font-semibold text-rose-100">Query Failed</p>
            <p className="text-xs mt-1 text-rose-300/80">
              Could not complete the request. Please check if the backend is running and reachable.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'done' && data) {
    const rawAnswer = data.answer;
    const answerMarkdown = typeof rawAnswer === 'string'
      ? rawAnswer
      : rawAnswer ? JSON.stringify(rawAnswer, null, 2) : '';

    const rawCypher = data.cypher_query;
    const cypherText = typeof rawCypher === 'string'
      ? rawCypher
      : rawCypher ? JSON.stringify(rawCypher, null, 2) : '';

    const entityList = Array.isArray(data.canonical_entities) ? data.canonical_entities : [];
    const errorsList = Array.isArray(data.errors) ? data.errors : [];

    return (
      <div className="space-y-6">
        {/* User Query Bubble */}
        {currentQueryText && (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl bg-white/[0.08] border border-white/[0.1] px-5 py-3.5 text-sm text-white shadow-md">
              {currentQueryText}
            </div>
          </div>
        )}

        {/* Clean Assistant Response Card */}
        <div className="flex flex-col rounded-2xl bg-[#161b22]/90 border border-white/[0.08] shadow-xl overflow-hidden backdrop-blur-md">
          {/* Header & Clean Tabs */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.08] bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <Bot size={15} />
              </div>
              <span className="font-semibold text-sm tracking-tight text-white">
                AyurAgent
              </span>
            </div>

            {/* Segmented Controls */}
            <div className="flex items-center p-1 rounded-xl bg-[#0d1117] border border-white/[0.06] text-xs">
              <button
                onClick={() => setActiveTab('answer')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                  activeTab === 'answer'
                    ? 'bg-emerald-500/15 text-emerald-300 shadow-xs'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Sparkles size={12} />
                <span>Answer</span>
              </button>

              {entityList.length > 0 && (
                <button
                  onClick={() => setActiveTab('entities')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                    activeTab === 'entities'
                      ? 'bg-emerald-500/15 text-emerald-300 shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Tag size={12} />
                  <span>Entities ({entityList.length})</span>
                </button>
              )}

              {cypherText && (
                <button
                  onClick={() => setActiveTab('cypher')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                    activeTab === 'cypher'
                      ? 'bg-emerald-500/15 text-emerald-300 shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <FileCode size={12} />
                  <span>Cypher</span>
                </button>
              )}
            </div>
          </div>

          {/* Tab Content Panes */}
          <div className="p-6">
            {/* Tab 1: Answer */}
            {activeTab === 'answer' && (
              <div className="prose prose-sm prose-invert max-w-none leading-relaxed">
                <ReactMarkdown>{answerMarkdown}</ReactMarkdown>
              </div>
            )}

            {/* Tab 2: Entities */}
            {activeTab === 'entities' && (
              <div className="flex flex-col gap-4">
                <div className="text-xs text-neutral-400 font-medium">
                  The following entities were extracted from your query and matched to the knowledge graph:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {entityList.map((item, idx) => {
                    const e = parseEntity(item);
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-emerald-500/40 transition flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-sm text-emerald-300 tracking-tight">
                            {e.name}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                            {e.type}
                          </span>
                        </div>

                        {e.original && e.original.toLowerCase() !== e.name.toLowerCase() && (
                          <div className="text-xs text-neutral-400">
                            Mentioned as: <span className="text-neutral-200 italic font-mono">&ldquo;{e.original}&rdquo;</span>
                          </div>
                        )}

                        {e.score && (
                          <div className="flex items-center gap-2 pt-1 border-t border-white/[0.04] text-[11px] text-neutral-400">
                            <span>Match confidence:</span>
                            <span className="font-mono text-emerald-400 font-medium">{e.score}%</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Tab 3: Cypher */}
            {activeTab === 'cypher' && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-neutral-400 flex items-center gap-1.5">
                    <Database size={13} className="text-emerald-400" />
                    Knowledge Graph Query
                  </span>
                  <button
                    onClick={() => copyToClipboard(cypherText)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-neutral-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] transition cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check size={13} className="text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span>Copy Query</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative rounded-xl overflow-hidden border border-white/[0.08] bg-[#0d1117]">
                  <pre className="p-4 text-xs font-mono text-emerald-200/90 whitespace-pre-wrap overflow-x-auto leading-relaxed">
                    {cypherText}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Diagnostic Warnings */}
          {errorsList.length > 0 && (
            <div className="px-6 pb-6 flex flex-col gap-2">
              {errorsList.map((err, i) => {
                const message = typeof err === 'string'
                  ? err
                  : (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string')
                    ? (err as { message: string }).message
                    : (err && typeof err === 'object' && 'error' in err && typeof (err as { error: unknown }).error === 'string')
                      ? (err as { error: string }).error
                      : JSON.stringify(err);
                return (
                  <div
                    key={i}
                    className="flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200"
                  >
                    <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-400" />
                    <span className="leading-relaxed">{message}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
