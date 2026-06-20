'use client';

import React from 'react';

interface Order {
  id: string;
  number: number;
  status: string;
  total: number;
  createdAt: string;
  table?: { name: string } | null;
}

interface OrderSummaryProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
}

export function OrderSummary({ orders, onSelectOrder }: OrderSummaryProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-100 text-amber-800';
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800';
      case 'READY':
        return 'bg-emerald-100 text-emerald-800';
      case 'COMPLETED':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col h-full shadow-sm">
      <div className="p-5 border-b border-slate-100">
        <h3 className="font-extrabold text-slate-800 text-lg">Orders History</h3>
        <p className="text-xs text-slate-400 mt-0.5">Realtime order tracker</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {orders.length === 0 ? (
          <p className="text-center text-slate-400 text-sm mt-8">No orders found</p>
        ) : (
          orders.map((order) => (
            <button
              key={order.id}
              onClick={() => onSelectOrder(order)}
              className="w-full text-left p-4 rounded-xl border border-slate-100 hover:border-purple-300 hover:shadow-md transition flex justify-between items-center bg-slate-50/50"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-slate-700">Order #{order.number}</span>
                  <span className={`text-[10px] px-2 py-0.5 font-black rounded-full uppercase ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <span className="text-xs text-slate-400 mt-1 block">
                  {order.table ? `Table: ${order.table.name}` : 'Take Away'} • {new Date(order.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <span className="font-black text-purple-600">₹{order.total.toFixed(2)}</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
export default OrderSummary;
