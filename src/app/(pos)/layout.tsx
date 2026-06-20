'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';

export default function POSLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout, session } = useSession();
  const router = useRouter();

  const links = [
    { name: 'Register POS', path: '/pos' },
    { name: 'Order Logs', path: '/orders' },
    { name: 'Tables Status', path: '/tables' },
    { name: 'Loyalty Customers', path: '/customers' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 bg-slate-900 text-white flex items-center justify-between px-6 border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-8">
          <Link href="/pos" className="text-lg font-black tracking-wider text-purple-400">
            CAFE TERMINAL
          </Link>
          <nav className="flex gap-1">
            {links.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition ${
                    isActive ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          {session?.role === 'ADMIN' && (
            <Link
              href="/dashboard"
              className="text-xs bg-slate-800 border border-slate-700 hover:bg-slate-700 text-purple-300 font-bold px-3.5 py-2 rounded-xl transition"
            >
              Management Console
            </Link>
          )}

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">Cashier: {session?.name || 'Loading...'}</span>
            <button
              onClick={async () => {
                await logout();
                router.push('/login');
              }}
              className="text-xs text-red-400 hover:text-red-300 font-bold bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700/50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* View Container */}
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
