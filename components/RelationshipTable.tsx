'use client';

import type { Relationship } from '@/lib/types';
import { ArrowRight } from 'lucide-react';

interface Props {
  relationships: Relationship[];
}

export default function RelationshipTable({ relationships }: Props) {
  if (!relationships || relationships.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-[#161b22] border border-white/[0.08] text-xs text-neutral-400">
        No relationships recorded in schema.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#161b22] overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.03] text-neutral-400 font-medium">
              <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[11px]">
                Source Node
              </th>
              <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[11px] text-center">
                Relationship
              </th>
              <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[11px]">
                Destination Node
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {relationships.map((rel, i) => (
              <tr
                key={i}
                className="hover:bg-white/[0.02] transition duration-100"
              >
                <td className="px-5 py-3 font-mono font-medium text-neutral-200">
                  {rel.source}
                </td>
                <td className="px-5 py-3 text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 shadow-2xs">
                    <span>{rel.type}</span>
                    <ArrowRight size={11} className="text-emerald-400 opacity-70" />
                  </span>
                </td>
                <td className="px-5 py-3 font-mono font-medium text-neutral-200">
                  {rel.dest}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
