'use client';

export default function SchemaLoadingSkeleton() {
  return (
    <div className="flex flex-col gap-8 max-w-5xl w-full mx-auto animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-6 w-64 bg-white/[0.08] rounded-xl" />
          <div className="h-3.5 w-96 bg-white/[0.04] rounded-lg" />
        </div>
        <div className="h-9 w-24 bg-white/[0.06] rounded-xl" />
      </div>

      {/* Node cards skeleton grid */}
      <div className="flex flex-col gap-3">
        <div className="h-4 w-32 bg-white/[0.06] rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-[#161b22] border border-white/[0.06] p-4 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
                <div className="h-4 w-28 bg-white/[0.08] rounded" />
                <div className="h-3 w-14 bg-white/[0.04] rounded-full" />
              </div>
              <div className="space-y-2 py-2">
                <div className="h-3 w-full bg-white/[0.04] rounded" />
                <div className="h-3 w-4/5 bg-white/[0.04] rounded" />
                <div className="h-3 w-3/4 bg-white/[0.04] rounded" />
              </div>
              <div className="h-2 w-20 bg-white/[0.03] rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Relationships skeleton */}
      <div className="flex flex-col gap-3">
        <div className="h-4 w-32 bg-white/[0.06] rounded" />
        <div className="h-40 rounded-2xl bg-[#161b22] border border-white/[0.06]" />
      </div>
    </div>
  );
}
