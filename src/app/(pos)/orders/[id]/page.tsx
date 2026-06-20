'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Receipt {
  header: string;
  address: string;
  phone: string;
  orderNumber: number;
  dateTime: string;
  tableName: string;
  items: Array<{ name: string; quantity: number; price: number; total: number }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  footer: string;
}

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/orders/${params.id}/receipt`)
      .then((res) => res.json())
      .then((data) => setReceipt(data.receipt || null));
  }, [params.id]);

  if (!receipt) return <p className="p-8 text-slate-500 font-bold">Querying order invoice details...</p>;

  return (
    <div className="p-8 max-w-lg space-y-6">
      <button onClick={() => router.back()} className="text-xs font-bold text-slate-500 hover:text-slate-800 transition">
        ← Back to Logs
      </button>

      {/* Receipt card */}
      <div className="bg-white border border-slate-200/80 p-8 rounded-2xl shadow-md space-y-4 font-mono text-xs text-slate-700">
        <div className="text-center space-y-1 pb-4 border-b border-dashed border-slate-200">
          <h2 className="font-extrabold text-sm text-slate-800 uppercase tracking-widest">{receipt.header}</h2>
          <p className="text-[10px] text-slate-400">{receipt.address}</p>
          <p className="text-[10px] text-slate-400">{receipt.phone}</p>
        </div>

        <div className="flex justify-between font-bold">
          <span>Invoice No: #{receipt.orderNumber}</span>
          <span>{new Date(receipt.dateTime).toLocaleDateString()}</span>
        </div>
        <div className="font-bold">Table: {receipt.tableName}</div>

        <div className="border-b border-dashed border-slate-200 py-3 space-y-2">
          {receipt.items.map((item, i) => (
            <div key={i} className="flex justify-between items-start">
              <span>
                {item.name} x {item.quantity}
              </span>
              <span>${item.total.toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1.5 pb-4 border-b border-dashed border-slate-200">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>${receipt.subtotal.toFixed(2)}</span>
          </div>
          {receipt.discount > 0 && (
            <div className="flex justify-between text-green-600 font-bold">
              <span>Discount</span>
              <span>-${receipt.discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span>Taxes (8%)</span>
            <span>${receipt.tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-extrabold text-slate-800 pt-1.5">
            <span>Grand Total</span>
            <span>${receipt.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="text-center font-bold space-y-1 pt-2">
          <p>Settled via: {receipt.paymentMethod}</p>
          <p className="text-[10px] text-slate-400">{receipt.footer}</p>
        </div>
      </div>
    </div>
  );
}
