import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <span className="text-4xl">🌿</span>
      <h2 className="text-lg font-semibold text-white">Page Not Found</h2>
      <p className="text-xs text-neutral-400 max-w-sm">
        The requested resource or page does not exist.
      </p>
      <Link
        href="/oracle"
        className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition"
      >
        Return to AI Assistant
      </Link>
    </div>
  );
}
