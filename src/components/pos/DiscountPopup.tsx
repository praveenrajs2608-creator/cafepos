'use client';

import React, { useState } from 'react';

interface DiscountPopupProps {
  onApplyCoupon: (coupon: { code: string; type: 'PERCENTAGE' | 'FLAT'; discount: number; minSpend: number } | null) => void;
  onClose: () => void;
}

export function DiscountPopup({ onApplyCoupon, onClose }: DiscountPopupProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleApply = async () => {
    if (!code) return;
    setError('');
    try {
      const res = await fetch(`/api/coupons?code=${code.toUpperCase()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid code');
        return;
      }
      onApplyCoupon(data.coupon);
      onClose();
    } catch {
      setError('Connection failed. Try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800">Apply Promo Coupon</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Coupon Code</label>
            <input
              type="text"
              placeholder="e.g. WELCOME10"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm uppercase focus:outline-none focus:border-purple-500 font-bold"
            />
          </div>

          {error && <p className="text-xs text-red-500 font-bold">{error}</p>}

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => {
                onApplyCoupon(null);
                onClose();
              }}
              className="py-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm text-slate-600 transition"
            >
              Clear Code
            </button>
            <button
              onClick={handleApply}
              className="py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition"
            >
              Apply Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default DiscountPopup;
