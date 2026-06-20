'use client';

import React, { useEffect, useState } from 'react';

interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: string;
  minSpend: number;
  expiry: string;
  isActive: boolean;
}

interface PromoSelectorProps {
  subtotal: number;
  onApplyCoupon: (coupon: { code: string; type: 'PERCENTAGE' | 'FLAT'; discount: number; minSpend: number } | null) => void;
  appliedCode?: string;
  onClose: () => void;
}

export function PromoSelector({ subtotal, onApplyCoupon, appliedCode, onClose }: PromoSelectorProps) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(appliedCode ?? null);

  useEffect(() => {
    fetch('/api/coupons')
      .then((r) => r.json())
      .then((d) => {
        // Only show active, non-expired coupons
        const now = new Date();
        const valid = (d.coupons || []).filter(
          (c: Coupon) => c.isActive && new Date(c.expiry) >= now
        );
        setCoupons(valid);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = (coupon: Coupon) => {
    if (selected === coupon.code) {
      // Deselect
      setSelected(null);
      return;
    }
    setSelected(coupon.code);
  };

  const handleApply = () => {
    if (!selected) {
      onApplyCoupon(null);
      onClose();
      return;
    }
    const coupon = coupons.find((c) => c.code === selected);
    if (!coupon) return;
    onApplyCoupon({
      code: coupon.code,
      type: coupon.type as 'PERCENTAGE' | 'FLAT',
      discount: coupon.discount,
      minSpend: coupon.minSpend,
    });
    onClose();
  };

  const isEligible = (coupon: Coupon) => subtotal >= coupon.minSpend;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-black text-slate-800">Apply Promo</h2>
            <p className="text-xs text-slate-400 mt-0.5">Select a coupon to apply</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl transition">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-80">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : coupons.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p className="text-2xl mb-2">🏷️</p>
              <p className="text-sm font-bold">No active promos available</p>
            </div>
          ) : (
            coupons.map((coupon) => {
              const eligible = isEligible(coupon);
              const isSelected = selected === coupon.code;
              return (
                <button
                  key={coupon.id}
                  onClick={() => eligible && handleSelect(coupon)}
                  disabled={!eligible}
                  className={`w-full text-left rounded-2xl border-2 p-4 transition-all
                    ${isSelected
                      ? 'border-purple-500 bg-purple-50/60'
                      : eligible
                      ? 'border-slate-200 hover:border-purple-300 hover:bg-purple-50/30'
                      : 'border-slate-100 bg-slate-50/50 opacity-50 cursor-not-allowed'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Check circle */}
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition
                        ${isSelected ? 'bg-purple-600 border-purple-600' : 'border-slate-300'}`}>
                        {isSelected && <span className="text-white text-[10px] font-black">✓</span>}
                      </div>

                      <div>
                        <p className="font-black text-slate-800 text-sm">{coupon.code}</p>
                        {coupon.minSpend > 0 && (
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                            Min spend ${coupon.minSpend.toFixed(2)}
                            {!eligible && <span className="text-amber-500 ml-1">(need ${(coupon.minSpend - subtotal).toFixed(2)} more)</span>}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Expires {new Date(coupon.expiry).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Discount badge */}
                    <div className="text-right">
                      <span className={`text-base font-black ${isSelected ? 'text-purple-600' : 'text-green-600'}`}>
                        {coupon.type === 'PERCENTAGE' ? `${coupon.discount}% off` : `$${coupon.discount.toFixed(2)} off`}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 grid grid-cols-2 gap-3">
          <button
            onClick={() => { setSelected(null); onApplyCoupon(null); onClose(); }}
            className="py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-sm text-slate-600 transition"
          >
            Clear Promo
          </button>
          <button
            onClick={handleApply}
            disabled={!selected && !appliedCode}
            className="py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition disabled:opacity-40"
          >
            {selected ? 'Apply' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PromoSelector;
