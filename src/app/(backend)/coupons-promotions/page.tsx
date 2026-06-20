'use client';

import React, { useEffect, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Coupon {
  id: string;
  code: string;
  discount: number;
  type: string;
  minSpend: number;
  expiry: string;
  isActive: boolean;
}

interface Promotion {
  id: string;
  name: string;
  description?: string;
  discount: number;
  type: string;
  scope: string;
  minQuantity?: number | null;
  minOrderAmount?: number | null;
  isActive: boolean;
}

// ─── Coupon Modal ─────────────────────────────────────────────────────────────

function CouponModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: Partial<Coupon> | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial?.id;
  const [code, setCode] = useState(initial?.code ?? '');
  const [discount, setDiscount] = useState(String(initial?.discount ?? ''));
  const [type, setType] = useState(initial?.type ?? 'PERCENTAGE');
  const [minSpend, setMinSpend] = useState(String(initial?.minSpend ?? '0'));
  const [expiry, setExpiry] = useState(
    initial?.expiry ? new Date(initial.expiry).toISOString().split('T')[0] : ''
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = { code, discount, type, minSpend, expiry, isActive };
      const url = isEdit ? `/api/coupons/${initial!.id}` : '/api/coupons';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Save failed'); return; }
      onSaved();
      onClose();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-lg">{isEdit ? 'Edit Coupon' : 'New Coupon'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl font-black">×</button>
        </div>

        {error && <p className="text-xs text-red-500 font-bold bg-red-50 border border-red-200 rounded-xl p-2">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Code</label>
              <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-purple-500" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-purple-500">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat (₹)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Discount Value</label>
              <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Min Spend (₹)</label>
              <input type="number" value={minSpend} onChange={(e) => setMinSpend(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Expiry Date</label>
            <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500" required />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-purple-600" />
            <span className="text-sm font-semibold text-slate-600">Active</span>
          </label>

          <button type="submit" disabled={saving}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition disabled:opacity-50">
            {saving ? 'Saving…' : isEdit ? 'Update Coupon' : 'Create Coupon'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Promotion Modal ──────────────────────────────────────────────────────────

function PromotionModal({
  initial,
  onClose,
  onSaved,
}: {
  initial: Partial<Promotion> | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial?.id;
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [discount, setDiscount] = useState(String(initial?.discount ?? ''));
  const [type, setType] = useState(initial?.type ?? 'PERCENTAGE');
  const [scope, setScope] = useState(initial?.scope ?? 'ORDER');
  const [minQuantity, setMinQuantity] = useState(String(initial?.minQuantity ?? ''));
  const [minOrderAmount, setMinOrderAmount] = useState(String(initial?.minOrderAmount ?? ''));
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body = { name, description, discount, type, scope, minQuantity: minQuantity || null, minOrderAmount: minOrderAmount || null, isActive };
      const url = isEdit ? `/api/promotions/${initial!.id}` : '/api/promotions';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Save failed'); return; }
      onSaved();
      onClose();
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-800 text-lg">{isEdit ? 'Edit Promotion' : 'New Promotion'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-xl font-black">×</button>
        </div>

        {error && <p className="text-xs text-red-500 font-bold bg-red-50 border border-red-200 rounded-xl p-2">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500" required />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Scope</label>
              <select value={scope} onChange={(e) => setScope(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-purple-500">
                <option value="ORDER">Order</option>
                <option value="PRODUCT">Product</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                {scope === 'PRODUCT' ? 'Min Quantity' : 'Min Order (₹)'}
              </label>
              {scope === 'PRODUCT' ? (
                <input type="number" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)}
                  placeholder="e.g. 2"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
              ) : (
                <input type="number" value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500" />
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Discount</label>
              <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-purple-500" required />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold focus:outline-none focus:border-purple-500">
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FLAT">Flat (₹)</option>
              </select>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 accent-purple-600" />
            <span className="text-sm font-semibold text-slate-600">Active</span>
          </label>

          <button type="submit" disabled={saving}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition disabled:opacity-50">
            {saving ? 'Saving…' : isEdit ? 'Update Promotion' : 'Create Promotion'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Role badge helper ────────────────────────────────────────────────────────

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border
      ${active ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-slate-100 border-slate-200 text-slate-400'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCouponsPromotionsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  const [couponModal, setCouponModal] = useState<Partial<Coupon> | null | false>(false);
  const [promotionModal, setPromotionModal] = useState<Partial<Promotion> | null | false>(false);

  const fetchAll = () => {
    fetch('/api/coupons').then((r) => r.json()).then((d) => setCoupons(d.coupons || []));
    fetch('/api/promotions').then((r) => r.json()).then((d) => setPromotions(d.promotions || []));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Deactivate this coupon?')) return;
    await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  const handleDeletePromotion = async (id: string) => {
    if (!confirm('Deactivate this promotion?')) return;
    await fetch(`/api/promotions/${id}`, { method: 'DELETE' });
    fetchAll();
  };

  return (
    <div className="space-y-8">
      {/* ── Coupons ─────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-lg">Coupon Codes</h3>
            <p className="text-xs text-slate-400 mt-0.5">Create and manage discount voucher codes</p>
          </div>
          <button
            onClick={() => setCouponModal({})}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl transition"
          >
            + New Coupon
          </button>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-3 text-xs font-black text-slate-400 uppercase">Code</th>
              <th className="px-6 py-3 text-xs font-black text-slate-400 uppercase">Discount</th>
              <th className="px-6 py-3 text-xs font-black text-slate-400 uppercase">Min Spend</th>
              <th className="px-6 py-3 text-xs font-black text-slate-400 uppercase">Expiry</th>
              <th className="px-6 py-3 text-xs font-black text-slate-400 uppercase">Status</th>
              <th className="px-6 py-3 text-xs font-black text-slate-400 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {coupons.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-3 font-black text-slate-700">{c.code}</td>
                <td className="px-6 py-3 font-bold text-slate-700">
                  {c.type === 'PERCENTAGE' ? `${c.discount}%` : `₹${c.discount.toFixed(2)}`}
                </td>
                <td className="px-6 py-3 text-sm text-slate-500">₹{c.minSpend.toFixed(2)}</td>
                <td className="px-6 py-3 text-xs text-slate-500">{new Date(c.expiry).toLocaleDateString()}</td>
                <td className="px-6 py-3"><StatusBadge active={c.isActive} /></td>
                <td className="px-6 py-3 text-right space-x-2">
                  <button onClick={() => setCouponModal(c)}
                    className="text-xs font-bold text-purple-600 hover:text-purple-800 transition">Edit</button>
                  <button onClick={() => handleDeleteCoupon(c.id)}
                    className="text-xs font-bold text-rose-500 hover:text-rose-700 transition">Deactivate</button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-sm">No coupons yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Promotions ───────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-lg">Promotions</h3>
            <p className="text-xs text-slate-400 mt-0.5">Automatic discounts by order value or product quantity</p>
          </div>
          <button
            onClick={() => setPromotionModal({})}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl transition"
          >
            + New Promotion
          </button>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-3 text-xs font-black text-slate-400 uppercase">Name</th>
              <th className="px-6 py-3 text-xs font-black text-slate-400 uppercase">Scope</th>
              <th className="px-6 py-3 text-xs font-black text-slate-400 uppercase">Trigger</th>
              <th className="px-6 py-3 text-xs font-black text-slate-400 uppercase">Discount</th>
              <th className="px-6 py-3 text-xs font-black text-slate-400 uppercase">Status</th>
              <th className="px-6 py-3 text-xs font-black text-slate-400 uppercase text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {promotions.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-3 font-bold text-slate-700">
                  <div>{p.name}</div>
                  {p.description && <div className="text-[11px] text-slate-400 mt-0.5">{p.description}</div>}
                </td>
                <td className="px-6 py-3">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase
                    ${p.scope === 'PRODUCT' ? 'bg-blue-500/10 text-blue-600' : 'bg-violet-500/10 text-violet-600'}`}>
                    {p.scope}
                  </span>
                </td>
                <td className="px-6 py-3 text-xs text-slate-500 font-semibold">
                  {p.scope === 'PRODUCT'
                    ? p.minQuantity ? `≥ ${p.minQuantity} qty` : '—'
                    : p.minOrderAmount ? `≥ ₹${p.minOrderAmount}` : '—'}
                </td>
                <td className="px-6 py-3 font-bold text-slate-700">
                  {p.type === 'PERCENTAGE' ? `${p.discount}%` : `₹${p.discount.toFixed(2)}`}
                </td>
                <td className="px-6 py-3"><StatusBadge active={p.isActive} /></td>
                <td className="px-6 py-3 text-right space-x-2">
                  <button onClick={() => setPromotionModal(p)}
                    className="text-xs font-bold text-purple-600 hover:text-purple-800 transition">Edit</button>
                  <button onClick={() => handleDeletePromotion(p.id)}
                    className="text-xs font-bold text-rose-500 hover:text-rose-700 transition">Deactivate</button>
                </td>
              </tr>
            ))}
            {promotions.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-sm">No promotions yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {couponModal !== false && (
        <CouponModal
          initial={couponModal}
          onClose={() => setCouponModal(false)}
          onSaved={fetchAll}
        />
      )}
      {promotionModal !== false && (
        <PromotionModal
          initial={promotionModal}
          onClose={() => setPromotionModal(false)}
          onSaved={fetchAll}
        />
      )}
    </div>
  );
}
