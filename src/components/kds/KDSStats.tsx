'use client';

import React, { useEffect, useState } from 'react';

interface Stats {
  ticketCount: number;
  avgPrepMinutes: number;
}

export default function KDSStats() {
  const [stats, setStats] = useState<Stats>({ ticketCount: 0, avgPrepMinutes: 0 });

  useEffect(() => {
    const load = () =>
      fetch('/api/kds/stats')
        .then((r) => r.json())
        .then(setStats)
        .catch(() => {});
    load();
    // Refresh stats every 60 seconds
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex-shrink-0">
      {/* Ticket count */}
      <div className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-700/50 rounded-xl px-4 py-2">
        <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5">
            <path d="M14.5 10c-.83 0-1.5-.67-1.5-1.5v-5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5z"/>
            <path d="M20.5 10H19V8.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
            <path d="M9.5 14c.83 0 1.5.67 1.5 1.5v5c0 .83-.67 1.5-1.5 1.5S8 21.33 8 20.5v-5c0-.83.67-1.5 1.5-1.5z"/>
            <path d="M3.5 14H5v1.5c0 .83-.67 1.5-1.5 1.5S2 16.33 2 15.5 2.67 14 3.5 14z"/>
            <path d="M14 14.5c0-.83.67-1.5 1.5-1.5h5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-5c-.83 0-1.5-.67-1.5-1.5z"/>
            <path d="M15.5 19H14v1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z"/>
            <path d="M10 9.5C10 8.67 9.33 8 8.5 8h-5C2.67 8 2 8.67 2 9.5S2.67 11 3.5 11h5c.83 0 1.5-.67 1.5-1.5z"/>
            <path d="M8.5 5H10V3.5C10 2.67 9.33 2 8.5 2S7 2.67 7 3.5 7.67 5 8.5 5z"/>
          </svg>
        </div>
        <div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-wide">Today's Tickets</p>
          <p className="text-white font-black text-lg leading-tight">{stats.ticketCount}</p>
        </div>
      </div>

      {/* Avg prep time */}
      <div className="flex items-center gap-2.5 bg-slate-800/80 border border-slate-700/50 rounded-xl px-4 py-2">
        <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-wide">Avg Prep Time</p>
          <p className="text-white font-black text-lg leading-tight">
            {stats.avgPrepMinutes > 0 ? `${stats.avgPrepMinutes}m` : '—'}
          </p>
        </div>
      </div>

      {/* Live indicator */}
      <div className="flex items-center gap-1.5 ml-auto">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Live</span>
      </div>
    </div>
  );
}
