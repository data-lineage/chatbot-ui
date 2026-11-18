'use client';

import type { FulltextIndex } from '@/lib/types';
import { Search } from 'lucide-react';

interface Props {
  indexes: FulltextIndex[];
}

export default function FulltextIndexTable({ indexes }: Props) {
  if (!indexes || indexes.length === 0) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-[#161b22] overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/[0.08] bg-white/[0.03] text-neutral-400 font-medium">
              <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[11px]">
                Index Name
              </th>
              <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[11px]">
                Node Label
              </th>
              <th className="px-5 py-3 font-semibold uppercase tracking-wider text-[11px]">
                Indexed Property
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {indexes.map((idx, i) => (
              <tr
                key={i}
                className="hover:bg-white/[0.02] transition duration-100"
              >
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1.5 font-mono font-medium text-cyan-300">
                    <Search size={12} className="text-cyan-400 opacity-70" />
                    {idx.index_name}
                  </span>
                </td>
                <td className="px-5 py-3 font-mono text-neutral-300">
                  {idx.node_label}
                </td>
                <td className="px-5 py-3 font-mono text-emerald-300">
                  {idx.property}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
