'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { checkHealth } from '@/lib/api';
import {
  Sparkles,
  Network,
  Menu,
  X,
  Activity,
  ChevronRight,
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [healthy, setHealthy] = useState<boolean | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    checkHealth().then(setHealthy);
    const id = setInterval(() => checkHealth().then(setHealthy), 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const navLinks = [
    {
      href: '/assistant',
      label: 'AI Assistant',
      description: 'Ask questions & search plants',
      icon: <Sparkles size={16} className="text-emerald-400" />,
    },
    {
      href: '/schema',
      label: 'Graph Schema',
      description: 'Knowledge graph structure',
      icon: <Network size={16} className="text-cyan-400" />,
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-[#0d1117] border-r border-white/[0.08] text-neutral-300">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent border border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span className="text-lg">🌿</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight text-white">
                AyurAgent
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 tracking-tight">
              Knowledge Graph Assistant
            </p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.06]"
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 py-4 flex flex-col gap-6 overflow-y-auto">
        <div className="flex flex-col gap-1.5">
          <div className="px-3 pb-1 text-[10px] font-semibold tracking-wider uppercase text-neutral-400">
            Menu
          </div>
          {navLinks.map(({ href, label, description, icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ${
                  active
                    ? 'bg-gradient-to-r from-emerald-500/[0.12] to-teal-500/[0.05] border border-emerald-500/25 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                )}
                <div
                  className={`p-1.5 rounded-lg ${
                    active
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-white/[0.04] text-neutral-400 group-hover:text-neutral-200'
                  }`}
                >
                  {icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium tracking-tight truncate">
                    {label}
                  </div>
                  <div className="text-[10px] text-neutral-400 truncate">
                    {description}
                  </div>
                </div>
                {active && (
                  <ChevronRight size={13} className="text-emerald-400/80" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Footer Backend Status Pill */}
      <div className="p-4 border-t border-white/[0.08]">
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2 w-2 shrink-0">
              {healthy ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.9)]" />
                </>
              ) : healthy === false ? (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.9)]" />
              ) : (
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neutral-400 animate-pulse" />
              )}
            </span>
            <span className="text-[11px] font-medium text-neutral-300 truncate">
              {healthy === null
                ? 'Connecting…'
                : healthy
                ? 'Online'
                : 'Offline'}
            </span>
          </div>
          <Activity size={13} className="text-neutral-400 shrink-0" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Navbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 bg-[#0d1117]/90 backdrop-blur-md border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">🌿</span>
          <span className="font-semibold text-sm text-white">AyurAgent</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-neutral-300 hover:text-white hover:bg-white/[0.06]"
          aria-label="Open sidebar"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer Panel */}
      <aside
        className={`md:hidden fixed top-0 bottom-0 left-0 z-50 w-72 shadow-2xl transform transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {content}
      </aside>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 h-screen">
        {content}
      </aside>
    </>
  );
}
