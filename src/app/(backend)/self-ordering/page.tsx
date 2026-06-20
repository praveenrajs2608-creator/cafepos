'use client';

import React, { useEffect, useState } from 'react';

interface Config {
  allowCustomerCheckout: boolean;
  taxRatePercent: number;
  welcomePromoTitle: string;
  themeColor: string;
}

export default function AdminSelfOrderingPage() {
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    fetch('/api/self-ordering-config')
      .then((res) => res.json())
      .then((data) => setConfig(data.config || null));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    await fetch('/api/self-ordering-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    alert('Configurations updated!');
  };

  if (!config) return <p className="text-slate-500 font-bold text-sm">Loading config parameters...</p>;

  return (
    <div className="max-w-xl bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
      <h3 className="font-extrabold text-slate-800 text-lg border-b border-slate-100 pb-3">Self-ordering configurations</h3>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="flex items-center justify-between py-2">
          <div>
            <label className="font-bold text-slate-700 block">Allow Self-Checkout</label>
            <span className="text-xs text-slate-400">Let scanning customers authorize payments directly from phone</span>
          </div>
          <input
            type="checkbox"
            checked={config.allowCustomerCheckout}
            onChange={(e) => setConfig({ ...config, allowCustomerCheckout: e.target.checked })}
            className="w-5 h-5 rounded accent-purple-600"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Welcome Promo Banner</label>
          <input
            type="text"
            value={config.welcomePromoTitle}
            onChange={(e) => setConfig({ ...config, welcomePromoTitle: e.target.value })}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Interface Brand Color</label>
          <input
            type="color"
            value={config.themeColor}
            onChange={(e) => setConfig({ ...config, themeColor: e.target.value })}
            className="w-16 h-10 border border-slate-200 rounded-xl focus:outline-none focus:border-purple-500"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition"
        >
          Save Layout Options
        </button>
      </form>
    </div>
  );
}
