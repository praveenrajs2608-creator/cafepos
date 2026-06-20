'use client';

import React from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  note?: string;
}

interface CartProps {
  items: CartItem[];
  tableName: string;
  onUpdateQuantity: (id: string, q: number) => void;
  onAddNote: (id: string, note: string) => void;
  onRemoveItem: (id: string) => void;
  onOpenDiscount: () => void;
  onOpenPayment: () => void;
  discountAmount: number;
  subtotal: number;
  tax: number;
  total: number;
}

export function Cart({
  items,
  tableName,
  onUpdateQuantity,
  onAddNote,
  onRemoveItem,
  onOpenDiscount,
  onOpenPayment,
  discountAmount,
  subtotal,
  tax,
  total,
}: CartProps) {
  return (
    <div className="w-[420px] bg-white border-l border-slate-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Current Order</h2>
          <span className="text-sm text-purple-600 font-semibold mt-0.5 inline-block bg-purple-50 px-2.5 py-0.5 rounded-full">
            {tableName}
          </span>
        </div>
        <span className="text-sm font-bold text-slate-400">#{items.length} items</span>
      </div>

      {/* Cart items list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <span className="text-4xl mb-2">🛒</span>
            <p className="font-semibold text-sm">Cart is empty</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="group border-b border-slate-100 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-800">{item.name}</h4>
                  <span className="text-sm text-slate-400 font-semibold">${item.price.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"
                  >
                    -
                  </button>
                  <span className="font-bold w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Prep Notes input */}
              <input
                type="text"
                placeholder="Add preparation note..."
                value={item.note || ''}
                onChange={(e) => onAddNote(item.id, e.target.value)}
                className="w-full mt-2 text-xs border border-slate-100 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-300"
              />
            </div>
          ))
        )}
      </div>

      {/* Pricing Summary */}
      <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-3">
        <div className="flex justify-between text-sm text-slate-500 font-semibold">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600 font-bold">
            <span>Discount</span>
            <span>-${discountAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm text-slate-500 font-semibold">
          <span>Taxes (8%)</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg text-slate-800 font-extrabold pt-2 border-t border-slate-100">
          <span>Total</span>
          <span className="text-purple-600 font-black">${total.toFixed(2)}</span>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 pt-4">
          <button
            onClick={onOpenDiscount}
            className="py-3 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl font-bold text-sm text-slate-600 transition"
          >
            Apply Promo
          </button>
          <button
            onClick={onOpenPayment}
            disabled={items.length === 0}
            className="py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 rounded-xl font-bold text-sm text-white transition shadow-lg shadow-purple-100"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
export default Cart;
