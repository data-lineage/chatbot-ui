'use client';

import { useState, useMemo } from 'react';
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
  Table as TableIcon,
  Download,
  Search,
  FileSpreadsheet,
  ArrowUpDown,
  Layers,
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

export interface CsvDownloadInfo {
  filename?: string;
  description?: string;
  row_count?: number;
  columns?: string[];
  preview_rows?: Record<string, unknown>[];
  url?: string;
}

export interface ResultsData {
  status: string;
  answer?: string | Record<string, unknown>;
  canonical_entities?: CanonicalEntity[];
  cypher_query?: string | Record<string, unknown>;
  errors?: (string | Record<string, unknown>)[];
  retrieval_results?: Record<string, unknown>[];
  csv_downloads?: CsvDownloadInfo[];
  prompt?: string | Record<string, unknown>;
  options?: unknown[];
}

interface Props {
  status: string | undefined;
  data: ResultsData | undefined;
  currentQueryText?: string;
  errorMessage?: string;
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

function formatColumnHeader(rawKey: string): { display: string; raw: string } {
  const withoutPrefix = rawKey.includes('.') ? rawKey.split('.').slice(1).join('.') : rawKey;
  const words = withoutPrefix.replace(/_/g, ' ').split(' ');
  const display = words
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return { display: display || rawKey, raw: rawKey };
}

function formatCellValue(val: unknown): React.ReactNode {
  if (val === null || val === undefined || val === '') {
    return <span className="text-neutral-500 italic">—</span>;
  }
  if (typeof val === 'boolean') {
    return (
      <span
        className={`px-2 py-0.5 rounded text-[11px] font-mono ${
          val
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
        }`}
      >
        {val ? 'true' : 'false'}
      </span>
    );
  }
  if (typeof val === 'number') {
    return <span className="font-mono text-cyan-300">{val.toLocaleString()}</span>;
  }
  if (Array.isArray(val)) {
    return (
      <div className="flex flex-wrap gap-1">
        {val.map((item, idx) => (
          <span
            key={idx}
            className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-neutral-300 text-xs font-mono"
          >
            {typeof item === 'object' ? JSON.stringify(item) : String(item)}
          </span>
        ))}
      </div>
    );
  }
  if (typeof val === 'object') {
    return (
      <span className="font-mono text-xs text-neutral-300">
        {JSON.stringify(val)}
      </span>
    );
  }
  return <span className="text-neutral-200">{String(val)}</span>;
}

function downloadCsv(data: Record<string, unknown>[], filename = 'knowledge_graph_results.csv') {
  if (!data || data.length === 0) return;
  const keys = Object.keys(data[0]);
  const header = keys.map((k) => `"${k.replace(/"/g, '""')}"`).join(',');
  const rows = data.map((row) =>
    keys
      .map((k) => {
        const val = row[k];
        const str =
          val === null || val === undefined
            ? ''
            : typeof val === 'object'
            ? JSON.stringify(val)
            : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(',')
  );
  const csvContent = [header, ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

interface ResultsTableProps {
  results: Record<string, unknown>[];
  csvDownloads?: CsvDownloadInfo[];
  initialLimit?: number;
  compact?: boolean;
  onViewAll?: () => void;
}

function RetrievalResultsTable({
  results,
  csvDownloads,
  initialLimit = 15,
  compact = false,
  onViewAll,
}: ResultsTableProps) {
  const [filterText, setFilterText] = useState('');
  const [limit, setLimit] = useState<number>(initialLimit);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const columns = useMemo(() => {
    if (!results || results.length === 0) return [];
    return Object.keys(results[0]);
  }, [results]);

  const filteredResults = useMemo(() => {
    if (!results) return [];
    let list = results;
    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      list = list.filter((row) =>
        Object.values(row).some((val) =>
          String(val ?? '').toLowerCase().includes(q)
        )
      );
    }
    if (sortKey) {
      list = [...list].sort((a, b) => {
        const aVal = String(a[sortKey] ?? '');
        const bVal = String(b[sortKey] ?? '');
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      });
    }
    return list;
  }, [results, filterText, sortKey, sortAsc]);

  const displayedRows = useMemo(() => {
    return filteredResults.slice(0, limit);
  }, [filteredResults, limit]);

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const defaultFilename = csvDownloads?.[0]?.filename || 'retrieval_results.csv';

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {/* Table Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
            <Layers size={13} />
            <span>
              Showing {displayedRows.length} of {results.length} records
            </span>
          </span>

          {filterText.trim() && (
            <span className="text-[11px] text-neutral-400">
              ({filteredResults.length} matching)
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Filter */}
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
            />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter records…"
              className="w-36 sm:w-48 pl-7 pr-3 py-1 text-xs rounded-lg bg-white/[0.04] border border-white/[0.08] focus:border-emerald-500/40 focus:outline-none text-white placeholder-neutral-500 transition"
            />
          </div>

          {/* Limit selector */}
          <div className="hidden sm:flex items-center rounded-lg bg-white/[0.04] border border-white/[0.08] p-0.5 text-xs">
            <button
              onClick={() => setLimit(15)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                limit === 15
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              15
            </button>
            <button
              onClick={() => setLimit(50)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                limit === 50
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              50
            </button>
            <button
              onClick={() => setLimit(results.length)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                limit >= results.length
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              All
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={() => downloadCsv(results, defaultFilename)}
            title="Download full results as CSV"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition cursor-pointer shadow-xs"
          >
            <Download size={12} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="relative rounded-xl border border-white/[0.08] bg-[#0d1117] overflow-hidden shadow-inner">
        <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-[#161b22] border-b border-white/[0.08] text-neutral-400 uppercase tracking-wider text-[11px] select-none">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center font-mono text-neutral-500 border-r border-white/[0.04]">
                  #
                </th>
                {columns.map((col) => {
                  const { display, raw } = formatColumnHeader(col);
                  return (
                    <th
                      key={col}
                      onClick={() => handleSort(col)}
                      className="py-2.5 px-4 font-semibold text-neutral-300 hover:text-white cursor-pointer transition hover:bg-white/[0.03]"
                    >
                      <div className="flex items-center gap-1.5">
                        <div className="flex flex-col">
                          <span>{display}</span>
                          {raw !== display && (
                            <span className="text-[9px] font-mono text-neutral-500 lowercase normal-case tracking-normal">
                              {raw}
                            </span>
                          )}
                        </div>
                        <ArrowUpDown size={11} className="text-neutral-500 opacity-60" />
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {displayedRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="py-8 text-center text-neutral-500 text-xs"
                  >
                    No records match your filter.
                  </td>
                </tr>
              ) : (
                displayedRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-white/[0.03] transition group"
                  >
                    <td className="py-2 px-3 text-center font-mono text-neutral-500 text-[11px] border-r border-white/[0.04]">
                      {idx + 1}
                    </td>
                    {columns.map((col) => (
                      <td key={col} className="py-2 px-4 leading-relaxed">
                        {formatCellValue(row[col])}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer if preview is truncated */}
        {compact && limit < results.length && (
          <div className="p-3 bg-white/[0.02] border-t border-white/[0.08] flex items-center justify-between text-xs text-neutral-400">
            <span>
              Showing top {limit} records. Total {results.length} items available.
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLimit(results.length)}
                className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
              >
                Expand all records
              </button>
              {onViewAll && (
                <>
                  <span className="text-neutral-600">·</span>
                  <button
                    onClick={onViewAll}
                    className="text-neutral-300 hover:text-white cursor-pointer"
                  >
                    Open Table Tab
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Server Download metadata notice if present */}
      {csvDownloads && csvDownloads.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs text-neutral-400">
          <FileSpreadsheet size={14} className="text-emerald-400 shrink-0" />
          <span>
            Server download artifact:{' '}
            <span className="font-mono text-neutral-200">
              {csvDownloads[0].filename || 'results.csv'}
            </span>{' '}
            ({csvDownloads[0].row_count ?? results.length} rows)
          </span>
        </div>
      )}
    </div>
  );
}

export default function ResultsPane({
  status,
  data,
  currentQueryText,
  errorMessage,
}: Props) {
  const [activeTab, setActiveTab] = useState<'answer' | 'records' | 'entities' | 'cypher'>('answer');
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
              {errorMessage || 'Could not complete the request. Please check if the backend is running and reachable.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'done' && data) {
    const rawAnswer = data.answer;
    const answerMarkdown =
      typeof rawAnswer === 'string'
        ? rawAnswer
        : rawAnswer
        ? JSON.stringify(rawAnswer, null, 2)
        : '';

    const rawCypher = data.cypher_query;
    const cypherText =
      typeof rawCypher === 'string'
        ? rawCypher
        : rawCypher
        ? JSON.stringify(rawCypher, null, 2)
        : '';

    const entityList = Array.isArray(data.canonical_entities) ? data.canonical_entities : [];
    const errorsList = Array.isArray(data.errors) ? data.errors : [];
    const retrievalResults = Array.isArray(data.retrieval_results) ? data.retrieval_results : [];
    const csvDownloads = Array.isArray(data.csv_downloads) ? data.csv_downloads : [];

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

              {retrievalResults.length > 0 && (
                <button
                  onClick={() => setActiveTab('records')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
                    activeTab === 'records'
                      ? 'bg-emerald-500/15 text-emerald-300 shadow-xs'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <TableIcon size={12} />
                  <span>Records ({retrievalResults.length})</span>
                </button>
              )}

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
              <div className="flex flex-col gap-6">
                {answerMarkdown && (
                  <div className="prose prose-sm prose-invert max-w-none leading-relaxed">
                    <ReactMarkdown>{answerMarkdown}</ReactMarkdown>
                  </div>
                )}

                {/* Inline Table Preview when retrieval results exist */}
                {retrievalResults.length > 0 && (
                  <div className="flex flex-col gap-3 pt-2 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                        <TableIcon size={13} className="text-emerald-400" />
                        Retrieved Results Preview
                      </span>
                    </div>

                    <RetrievalResultsTable
                      results={retrievalResults}
                      csvDownloads={csvDownloads}
                      initialLimit={15}
                      compact={true}
                      onViewAll={() => setActiveTab('records')}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Records (Full Data Table View) */}
            {activeTab === 'records' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs text-neutral-400 font-medium">
                  <span>
                    Direct knowledge graph records retrieved for this query:
                  </span>
                </div>
                <RetrievalResultsTable
                  results={retrievalResults}
                  csvDownloads={csvDownloads}
                  initialLimit={50}
                  compact={false}
                />
              </div>
            )}

            {/* Tab 3: Entities */}
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

            {/* Tab 4: Cypher */}
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
                const message =
                  typeof err === 'string'
                    ? err
                    : err &&
                      typeof err === 'object' &&
                      'message' in err &&
                      typeof (err as { message: unknown }).message === 'string'
                    ? (err as { message: string }).message
                    : err &&
                      typeof err === 'object' &&
                      'error' in err &&
                      typeof (err as { error: unknown }).error === 'string'
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
