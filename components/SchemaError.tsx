'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  message: string;
  onRetry?: () => void;
}

export default function SchemaError({ message, onRetry }: Props) {
  return (
    <div className="max-w-xl mx-auto my-12 p-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 flex flex-col gap-4 text-rose-200 backdrop-blur-md shadow-xl">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="text-rose-400 shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-rose-100">
            Failed to Load Knowledge Graph Schema
          </h2>
          <p className="text-xs text-rose-300/80 leading-relaxed break-words">
            {message}
          </p>
        </div>
      </div>

      <div className="flex justify-end pt-2 border-t border-rose-500/20">
        <button
          type="button"
          onClick={onRetry || (() => window.location.reload())}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-100 text-xs font-medium transition cursor-pointer"
        >
          <RotateCcw size={13} />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
}
