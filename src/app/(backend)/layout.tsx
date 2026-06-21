'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, logout } = useSession();
  const router = useRouter();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Products Menu', path: '/products' },
    { name: 'Categories', path: '/categories' },
    { name: 'Tables & Floors', path: '/floors-tables' },
    { name: 'User Management', path: '/users' },
    { name: 'Customers', path: '/manage-customers' },
    { name: 'Coupon Codes', path: '/coupons-promotions' },
    { name: 'Self Ordering', path: '/self-ordering' },
    { name: 'Bookings', path: '/booking' },
    { name: 'Sales Reports', path: '/reports' },
    { name: 'POS Terminal', path: '/pos' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <Image src="/logo-48.png" alt="Savora Atlas" width={48} height={48} className="object-contain" />
          <div>
            <span className="text-sm font-black text-white tracking-wide block">Savora Atlas</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Management Console</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition duration-200 ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/10'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-800 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-600/30 flex items-center justify-center font-bold text-purple-400 text-sm">
              {session?.name ? session.name[0] : 'A'}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-300 leading-none">{session?.name || 'Loading...'}</p>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 inline-block font-black">
                {session?.role || 'ADMIN'}
              </span>
            </div>
          </div>
          <button
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            className="w-full mt-2 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-red-400 hover:text-red-300 border border-slate-700/50 rounded-xl transition"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200/60 flex items-center justify-between px-8">
          <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">
            {navItems.find((i) => i.path === pathname)?.name || 'Admin Panel'}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-400">{new Date().toLocaleDateString()}</span>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
