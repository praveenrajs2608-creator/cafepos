'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

interface Order {
  id: string;
  number: number;
  status: string;
  type: string;
  total: number;
  createdAt: string;
  table?: { name: string } | null;
}

export default function POSOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch('/api/orders')
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []));
  }, []);

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Order Logs</h1>
          <p className="text-xs text-slate-400 mt-0.5">Archive list of active dine-in and takeaway tickets</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Order</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Serving Type</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Table Layout</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Grand Total</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Timestamp</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase text-right">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4 font-bold text-slate-700">Order #{o.number}</td>
                <td className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">{o.type}</td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-500">{o.table ? o.table.name : 'Take Away'}</td>
                <td className="px-6 py-4 font-extrabold text-purple-600">₹{o.total.toFixed(2)}</td>
                <td className="px-6 py-4 text-xs font-semibold text-slate-400">
                  {new Date(o.createdAt).toLocaleTimeString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/orders/${o.id}`}
                    className="text-xs font-bold text-purple-600 hover:text-purple-800 transition"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
