'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';

interface Table {
  id: string;
  name: string;
  token: string;
  floor: {
    id: string;
    name: string;
  };
}

export default function CustomerDashboardPage() {
  const router = useRouter();
  const { session, loading: sessionLoading, logout } = useSession();
  const [tables, setTables] = useState<Table[]>([]);
  const [loadingTables, setLoadingTables] = useState(true);
  const [tableCode, setTableCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [verifying, setVerifying] = useState(false);

  // Load all tables for selection
  useEffect(() => {
    fetch('/api/tables')
      .then((res) => res.json())
      .then((data) => {
        if (data.tables) {
          setTables(data.tables);
        }
        setLoadingTables(false);
      })
      .catch((err) => {
        console.error('Failed to load tables:', err);
        setLoadingTables(false);
      });
  }, []);

  // Group tables by floor
  const floors = useMemo(() => {
    const map = new Map<string, { id: string; name: string; tables: Table[] }>();
    for (const table of tables) {
      const floorId = table.floor.id;
      if (!map.has(floorId)) {
        map.set(floorId, {
          id: floorId,
          name: table.floor.name,
          tables: [],
        });
      }
      map.get(floorId)!.tables.push(table);
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [tables]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableCode.trim()) return;

    setErrorMsg('');
    setVerifying(true);
    try {
      const res = await fetch(`/api/self-order/${tableCode.trim()}`);
      if (res.status === 404) {
        setErrorMsg('Invalid table code. Please check the code or scan the QR code on your table.');
        setVerifying(false);
        return;
      }
      if (!res.ok) {
        throw new Error('Verification failed');
      }
      
      // If code is valid, redirect to the self-ordering screen
      router.push(`/s/${tableCode.trim()}`);
    } catch (err) {
      console.error(err);
      setErrorMsg('Something went wrong. Please try again.');
      setVerifying(false);
    }
  };

  const handleSelectTable = (token: string) => {
    router.push(`/s/${token}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Premium Header */}
      <header className="bg-white border-b border-slate-200/60 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md">
              <span className="text-white text-sm">☕</span>
            </div>
            <span className="text-slate-900 font-black text-lg tracking-wide">CafePOS</span>
          </div>

          <div className="flex items-center gap-4">
            {!sessionLoading && session && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-700">Hello, {session.name}</span>
                <button
                  onClick={async () => {
                    await logout();
                    router.push('/login');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600 rounded-xl transition"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 space-y-10">
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-slate-600 to-slate-800 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
          <div className="z-10 relative space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-slate-300 bg-white/10 px-3 py-1 rounded-full">
              Mobile Ordering
            </span>
            <h2 className="text-3xl font-black md:text-4xl">Order Directly From Your Table</h2>
            <p className="text-slate-200 text-sm md:text-base max-w-xl leading-relaxed">
              Scan the QR code on your table, enter the table code below, or choose your table to view our menu and place your order instantly.
            </p>
          </div>
        </div>

        {/* Enter Code Card & Select Table Row */}
        <div className="grid md:grid-cols-5 gap-8">
          {/* Left: Code Input Card */}
          <div className="md:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Enter Table Code</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Type the 8-character table code shown on the table's QR sticker (e.g. <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold text-slate-700">g31l1o6v</code>).
              </p>
              
              <form onSubmit={handleVerifyCode} className="space-y-3">
                <input
                  type="text"
                  maxLength={8}
                  placeholder="e.g. g31l1o6v"
                  value={tableCode}
                  onChange={(e) => setTableCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-400 focus:bg-white transition"
                />
                
                {errorMsg && (
                  <p className="text-rose-500 text-xs font-bold leading-relaxed">{errorMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={verifying || !tableCode.trim()}
                  className="w-full py-3 bg-slate-600 hover:bg-slate-700 disabled:opacity-50 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition shadow-md"
                >
                  {verifying ? 'Verifying...' : 'Start Ordering'}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Select Table Directory */}
          <div className="md:col-span-3 bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Select Your Table</h3>
              <span className="text-xs font-semibold text-slate-500">
                {tables.length} tables available
              </span>
            </div>

            {loadingTables ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-2">
                <div className="w-6 h-6 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-500 font-bold">Loading table registry...</p>
              </div>
            ) : floors.length === 0 ? (
              <p className="text-sm text-slate-500 italic py-6 text-center">No active tables found in registry.</p>
            ) : (
              <div className="space-y-6 max-h-[300px] overflow-y-auto pr-1">
                {floors.map((floor) => (
                  <div key={floor.id} className="space-y-3">
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 pb-1">
                      {floor.name}
                    </p>
                    <div className="grid grid-cols-3 gap-2.5">
                      {floor.tables.map((table) => (
                        <button
                          key={table.id}
                          onClick={() => handleSelectTable(table.token)}
                          className="flex flex-col items-center justify-center p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200/60 hover:border-slate-300 rounded-2xl text-center transition group"
                        >
                          <span className="text-xs font-black text-slate-800 group-hover:text-slate-900 transition">
                            {table.name}
                          </span>
                          <span className="text-[9px] font-mono font-extrabold text-slate-400 group-hover:text-slate-500 uppercase tracking-wider mt-0.5">
                            {table.token}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
