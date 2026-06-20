'use client';

import React from 'react';

interface KDSTopBarProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function KDSTopBar({ onToggleSidebar, sidebarOpen }: KDSTopBarProps) {
  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center px-4 gap-3 flex-shrink-0 z-10">
      {/* Hamburger */}
      <button
        onClick={onToggleSidebar}
        className="w-8 h-8 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-slate-800 transition"
        title="Toggle Filters"
      >
        <span className={`block w-4 h-0.5 bg-slate-400 transition-all ${sidebarOpen ? 'rotate-45 translate-y-2' : ''}`} />
        <span className={`block w-4 h-0.5 bg-slate-400 transition-all ${sidebarOpen ? 'opacity-0' : ''}`} />
        <span className={`block w-4 h-0.5 bg-slate-400 transition-all ${sidebarOpen ? '-rotate-45 -translate-y-2' : ''}`} />
      </button>

      {/* Logo + Label */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
          <span className="text-white text-sm">☕</span>
        </div>
        <span className="text-white font-black text-sm tracking-wide">CafePOS</span>
        <span className="text-slate-600 font-black text-sm">|</span>
        <span className="text-amber-400 font-black text-sm tracking-widest uppercase">KDS</span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Icon buttons */}
      <button className="w-8 h-8 rounded-lg hover:bg-slate-800 transition flex items-center justify-center text-slate-400 hover:text-white" title="Refresh">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
          <path d="M21 3v5h-5"/>
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
          <path d="M8 16H3v5"/>
        </svg>
      </button>

      <button className="w-8 h-8 rounded-lg hover:bg-slate-800 transition flex items-center justify-center text-slate-400 hover:text-white" title="Full Screen">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 3 21 3 21 9"/>
          <polyline points="9 21 3 21 3 15"/>
          <line x1="21" y1="3" x2="14" y2="10"/>
          <line x1="3" y1="21" x2="10" y2="14"/>
        </svg>
      </button>

      {/* Profile avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center cursor-pointer hover:opacity-90 transition" title="Account">
        <span className="text-white text-xs font-black">K</span>
      </div>
    </header>
  );
}
