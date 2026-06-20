'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }
      
      const role = data.user?.role || 'CUSTOMER';
      if (role === 'ADMIN') {
        router.push('/dashboard');
      } else {
        router.push('/customer-dashboard'); // Replace with your actual customer home route
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

        <h1 className="text-xl font-black text-white text-center mt-2">Create an Account</h1>
        <p className="text-xs text-slate-400 text-center mt-1 font-semibold">Join us to start ordering online</p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-3 rounded-xl mt-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5 mt-6">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-purple-500 transition"
              placeholder="John Doe"
              required
            />
          </div>

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
            {loading ? 'Creating Account…' : 'Sign Up →'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-8 font-semibold">
          Already have an account?{' '}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 font-bold transition">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
