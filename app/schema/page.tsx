'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchSchema } from '@/lib/api';
import type { SchemaData } from '@/lib/types';
import NodeCard from '@/components/NodeCard';
import RelationshipTable from '@/components/RelationshipTable';
import FulltextIndexTable from '@/components/FulltextIndexTable';
import SchemaLoadingSkeleton from '@/components/SchemaLoadingSkeleton';
import SchemaError from '@/components/SchemaError';
import {
  RotateCcw,
  Network,
  Database,
  Layers,
  Search,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SchemaPage() {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery<SchemaData>({
    queryKey: ['schema'],
    queryFn: () => fetchSchema(),
    staleTime: 60 * 60 * 1000, // 1 hour — matches backend TTL
    retry: 1,
  });

  async function handleForceRefresh() {
    const toastId = toast.loading('Fetching fresh schema from knowledge graph…');
    try {
      // Force refresh bypasses the server-side TTL cache
      await fetchSchema(undefined, true);
      await refetch();
      toast.success('Schema refreshed successfully!', { id: toastId });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to refresh schema';
      toast.error(message, { id: toastId });
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#0b0f14] text-neutral-200">
      {/* Top Application Bar */}
      <header className="h-14 border-b border-white/[0.08] px-6 flex items-center justify-between shrink-0 bg-[#0d1117]/80 backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span>Knowledge Graph</span>
          <ChevronRight size={13} className="text-neutral-600" />
          <span className="text-white font-medium">Live Schema</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleForceRefresh}
            disabled={isFetching || isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] hover:border-emerald-500/40 bg-white/[0.04] hover:bg-emerald-500/[0.08] text-xs font-medium text-neutral-300 hover:text-white transition disabled:opacity-50 cursor-pointer"
          >
            {isFetching ? (
              <Loader2 size={13} className="animate-spin text-emerald-400" />
            ) : (
              <RotateCcw size={13} className="text-emerald-400" />
            )}
            <span>{isFetching ? 'Refreshing…' : 'Force Refresh'}</span>
          </button>
        </div>
      </header>

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">
        {isLoading && <SchemaLoadingSkeleton />}

        {isError && (
          <SchemaError
            message={(error as Error)?.message || 'An error occurred while fetching schema.'}
            onRetry={() => refetch()}
          />
        )}

        {data && (
          <div className="flex flex-col gap-10 max-w-5xl w-full mx-auto">
            {/* Header info */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono font-semibold uppercase tracking-wider">
                <Network size={14} />
                Live Graph Schema
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Knowledge Graph Schema
              </h1>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Live schema from knowledge graph · {data.node_labels.length} node types ·{' '}
                {data.relationships.length} relationships
              </p>
              {data.catalogs && data.catalogs.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-neutral-500">Catalogs:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {data.catalogs.map((cat, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-white/[0.04] border border-white/[0.08] text-neutral-300"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 1: Node Labels */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <Database size={13} className="text-emerald-400" />
                  Node Labels ({data.node_labels.length})
                </h2>
                <span className="text-xs font-mono text-neutral-500">
                  Entity types & properties
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.node_labels.map((label) => (
                  <NodeCard
                    key={label}
                    label={label}
                    properties={data.properties[label] ?? []}
                  />
                ))}
              </div>
            </section>

            {/* Section 2: Relationships */}
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                  <Layers size={13} className="text-emerald-400" />
                  Relationships ({data.relationships.length})
                </h2>
                <span className="text-xs font-mono text-neutral-500">
                  Directed graph edges
                </span>
              </div>

              <RelationshipTable relationships={data.relationships} />
            </section>

            {/* Section 3: Fulltext Indexes */}
            {data.fulltext_indexes && data.fulltext_indexes.length > 0 && (
              <section className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 flex items-center gap-2">
                    <Search size={13} className="text-cyan-400" />
                    Fulltext Indexes ({data.fulltext_indexes.length})
                  </h2>
                  <span className="text-xs font-mono text-neutral-500">
                    Fast entity resolution indexes
                  </span>
                </div>

                <FulltextIndexTable indexes={data.fulltext_indexes} />
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
