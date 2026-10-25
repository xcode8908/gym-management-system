'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Dumbbell, Users, Receipt, Settings, Plus } from 'lucide-react';
import CollectFeeModal from '@/components/CollectFeeModal';

export default function Navbar() {
  const pathname = usePathname();
  const [isCollectFeeOpen, setIsCollectFeeOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Dashboard', icon: Dumbbell },
    { href: '/admissions', label: 'Admissions', icon: Users },
    { href: '/billing', label: 'Billing & Dues', icon: Receipt },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Top Header for Desktop & Mobile */}
      <header suppressHydrationWarning className="sticky top-0 z-40 bg-[#050811]/90 backdrop-blur-2xl border-b border-white/[0.08] transition-all">
        <div suppressHydrationWarning className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div suppressHydrationWarning className="flex items-center justify-between h-16 sm:h-18">
            {/* Brand Logo */}
            <Link href="/" suppressHydrationWarning className="flex items-center gap-3 group">
              <div suppressHydrationWarning className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-500 flex items-center justify-center text-slate-950 font-black shadow-[0_0_20px_-3px_rgba(16,185,129,0.45),inset_0_1px_0_rgba(255,255,255,0.6)] group-hover:scale-105 group-active:scale-95 transition-all duration-200">
                <Dumbbell suppressHydrationWarning className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-slate-950 stroke-[2.75]" />
              </div>
              <div suppressHydrationWarning>
                <div suppressHydrationWarning className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                  <span className="bg-gradient-to-r from-white via-slate-100 to-emerald-200 bg-clip-text text-transparent">
                    IRON CORE
                  </span>
                  <span className="text-[9px] sm:text-[10px] tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold uppercase shadow-[0_0_12px_-2px_rgba(16,185,129,0.3)]">
                    SMART GYM
                  </span>
                </div>
                <div suppressHydrationWarning className="text-[10px] sm:text-[11px] text-slate-400 font-medium tracking-tight">
                  Lifetime Admission & Billing Engine
                </div>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav suppressHydrationWarning className="hidden md:flex items-center gap-1.5 bg-white/[0.03] p-1.5 rounded-2xl border border-white/[0.06]">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    suppressHydrationWarning
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-gradient-to-b from-emerald-500/25 to-teal-500/15 text-emerald-300 border border-emerald-500/35 shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)] font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <Icon suppressHydrationWarning className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Quick Collect Fee Action */}
            <div suppressHydrationWarning className="flex items-center gap-2.5">
              <button
                suppressHydrationWarning
                onClick={() => setIsCollectFeeOpen(true)}
                className="btn-cyber flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black shadow-[0_0_20px_-3px_rgba(16,185,129,0.4)] active:scale-95 transition-all cursor-pointer"
                title="Collect Gym Fee via Cash or UPI QR"
              >
                <Plus suppressHydrationWarning className="w-4 h-4 stroke-[3]" />
                <span className="hidden xs:inline sm:inline">Collect Fee</span>
                <span className="xs:hidden sm:hidden">Collect</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Thumb-Friendly, Fixed at bottom) */}
      <nav
        suppressHydrationWarning
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#050811]/95 backdrop-blur-2xl border-t border-white/[0.08] px-2 py-2 flex items-center justify-around shadow-[0_-10px_25px_rgba(0,0,0,0.8)]"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              suppressHydrationWarning
              className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-xl transition-all min-w-[64px] ${
                isActive
                  ? 'text-emerald-400 font-extrabold bg-emerald-500/10 shadow-[0_0_12px_-2px_rgba(16,185,129,0.3)]'
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              }`}
            >
              <Icon suppressHydrationWarning className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Collect Fee Modal */}
      <CollectFeeModal
        isOpen={isCollectFeeOpen}
        onClose={() => setIsCollectFeeOpen(false)}
        onSuccess={() => {
          setIsCollectFeeOpen(false);
          window.dispatchEvent(new CustomEvent('reload-billing-data'));
        }}
      />
    </>
  );
}
