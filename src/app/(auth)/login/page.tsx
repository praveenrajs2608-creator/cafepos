'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function roleHome(role: string): string {
  if (role === 'ADMIN') return '/dashboard';
  if (role === 'KITCHEN') return '/kds';
  if (role === 'CUSTOMER') return '/customer-dashboard'; // or wherever customers go
  return '/pos';
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }

      const role: string = data.user?.role ?? 'CASHIER';
      const home = roleHome(role);

      // Honor redirect param only if it points to a valid path for this role
      if (redirect && redirect !== '/login') {
        const isAdminPath = redirect.startsWith('/dashboard') || redirect.startsWith('/products') ||
          redirect.startsWith('/categories') || redirect.startsWith('/users');
        const isPOSPath = redirect.startsWith('/pos') || redirect.startsWith('/orders') ||
          redirect.startsWith('/tables') || redirect.startsWith('/customers');
        const isKDSPath = redirect.startsWith('/kds');

        const allowed =
          (isAdminPath && role === 'ADMIN') ||
          (isPOSPath && (role === 'CASHIER' || role === 'ADMIN')) ||
          (isKDSPath && (role === 'KITCHEN' || role === 'ADMIN')) ||
          (!isAdminPath && !isPOSPath && !isKDSPath); // Allow generic/customer paths

        router.push(allowed ? redirect : home);
      } else {
        router.push(home);
      }
    } catch {
      setError('Connection failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-slate-800 border border-slate-700/50 p-8 rounded-3xl w-full max-w-md shadow-2xl flex flex-col">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-2xl shadow-lg">☕</div>
          <span className="text-3xl font-black text-white">CafePOS</span>
        </div>

        <h1 className="text-xl font-black text-white text-center mt-2">Welcome Back</h1>
        <p className="text-xs text-slate-400 text-center mt-1 font-semibold">
          Sign in to your account
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-3 rounded-xl mt-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5 mt-6">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
              placeholder="you@email.com"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl transition shadow-lg shadow-purple-900/30 disabled:opacity-50 mt-2 text-sm"
          >
            {loading ? 'Authenticating…' : 'Sign In →'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-8 font-semibold">
          Don't have an account?{' '}
          <Link href="/signup" className="text-purple-400 hover:text-purple-300 transition font-bold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900" />}>
      <LoginForm />
    </Suspense>
  );
}
