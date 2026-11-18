'use client';

import { useState } from 'react';
import type { NodeProperty } from '@/lib/types';
import { Tag, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  label: string;
  properties: NodeProperty[];
}

export default function NodeCard({ label, properties }: Props) {
  const [expanded, setExpanded] = useState(false);
  const count = properties?.length || 0;
  const displayedProps = expanded ? properties : properties.slice(0, 5);

  return (
    <div className="flex flex-col rounded-2xl bg-[#161b22] border border-white/[0.08] hover:border-emerald-500/30 transition-all duration-150 overflow-hidden shadow-xs">
      {/* Header with emerald accent bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-4 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
          <h3 className="font-semibold text-sm text-white tracking-tight">
            {label}
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
          {count} {count === 1 ? 'property' : 'properties'}
        </span>
      </div>

      {/* Property list */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        {count === 0 ? (
          <p className="text-xs text-neutral-500 italic py-2">
            No properties recorded
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {displayedProps.map((prop, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white/[0.02] border border-white/[0.04]"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Tag size={11} className="text-neutral-500 shrink-0" />
                  <span className="font-mono text-neutral-200 truncate">
                    {prop.name}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/40 border border-cyan-800/30 px-1.5 py-0.2 rounded shrink-0 ml-2">
                  {prop.type}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Show more toggle if more than 5 properties */}
        {count > 5 && (
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="mt-3 flex items-center justify-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-medium py-1 rounded-lg bg-emerald-500/5 hover:bg-emerald-500/10 transition cursor-pointer"
          >
            <span>{expanded ? 'Show fewer' : `+${count - 5} more properties`}</span>
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>
    </div>
  );
}
