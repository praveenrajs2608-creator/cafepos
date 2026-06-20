'use client';

import React, { useEffect, useState } from 'react';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}

export default function AdminPaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    fetch('/api/payment-methods')
      .then((res) => res.json())
      .then((data) => setMethods(data.paymentMethods || []));
  }, []);

  return (
    <div className="max-w-2xl bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="font-extrabold text-slate-800 text-lg">Active Payment Channels</h3>
        <p className="text-xs text-slate-400 mt-0.5">Toggle and configure cashier payment gateways</p>
      </div>

      <div className="divide-y divide-slate-100 p-6 space-y-4">
        {methods.map((m) => (
          <div key={m.id} className="flex justify-between items-center py-2">
            <div>
              <h4 className="font-extrabold text-slate-800 text-base">{m.name}</h4>
              <span className="text-xs text-slate-400 font-bold block mt-0.5">ID: {m.id} • Status: Active</span>
            </div>
            <span className="text-xs bg-green-500/10 border border-green-500/20 text-green-600 px-3 py-1 font-black rounded-full uppercase">
              Online
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
