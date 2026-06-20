'use client';

import React from 'react';
import type { KDSOrder } from '@/hooks/useKDSOrders';

interface TicketCardProps {
  order: KDSOrder;
  onAdvanceStage: (orderId: string) => void;
  onToggleItem: (itemId: string) => void;
}

const STAGE_COLORS: Record<string, { card: string; badge: string; badgeText: string; btn: string }> = {
  TO_COOK: {
    card: 'border-amber-500 bg-white shadow-sm',
    badge: 'bg-amber-50 text-amber-700 border border-amber-200',
    badgeText: 'To Cook',
    btn: 'bg-amber-600 hover:bg-amber-500 text-white',
  },
  PREPARING: {
    card: 'border-blue-500 bg-white shadow-sm',
    badge: 'bg-blue-50 text-blue-700 border border-blue-200',
    badgeText: 'Preparing',
    btn: 'bg-blue-600 hover:bg-blue-500 text-white',
  },
  COMPLETED: {
    card: 'border-emerald-500 bg-white shadow-sm',
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    badgeText: 'Completed',
    btn: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  },
};

function getElapsed(date: string | null): string {
  if (!date) return '—';
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 1) return 'just now';
  return `${mins}m ago`;
}

function getOrderStage(order: KDSOrder): string {
  // Use first item's kitchenStage as the card's stage (all items advance together)
  return order.items[0]?.kitchenStage ?? 'TO_COOK';
}

export default function TicketCard({ order, onAdvanceStage, onToggleItem }: TicketCardProps) {
  const stage = getOrderStage(order);
  const colors = STAGE_COLORS[stage] ?? STAGE_COLORS.TO_COOK;
  const kdsItems = order.items.filter((i) => i.product.kdsEnabled);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't advance if clicking an item row — that's handled separately
    if ((e.target as HTMLElement).closest('[data-item-row]')) return;
    if (stage !== 'COMPLETED') {
      onAdvanceStage(order.id);
    }
  };

  const nextLabel = stage === 'TO_COOK' ? '→ Start Preparing' : stage === 'PREPARING' ? '✓ Mark Complete' : 'Completed';

  return (
    <div
      onClick={handleCardClick}
      className={`border-2 rounded-2xl flex flex-col select-none transition-all duration-200 overflow-hidden cursor-pointer
        ${colors.card} ${stage !== 'COMPLETED' ? 'hover:scale-[1.01] hover:shadow-md' : 'opacity-80'}`}
    >
      {/* Card Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-slate-900 font-black text-lg">#{order.number}</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${colors.badge}`}>
              {colors.badgeText}
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5 font-semibold">
            {order.table ? `Table ${order.table.name}` : 'Take Away'} &bull; {getElapsed(order.sentToKitchenAt)}
          </p>
        </div>
        <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wide bg-slate-100 text-slate-600`}>
          {order.type === 'DINE_IN' ? 'Dine In' : 'Takeaway'}
        </span>
      </div>

      {/* Items */}
      <div className="flex-1 px-4 py-3 space-y-2 min-h-[120px] max-h-[220px] overflow-y-auto">
        {kdsItems.length === 0 && (
          <p className="text-slate-500 text-xs italic">No KDS items</p>
        )}
        {kdsItems.map((item) => (
          <div
            key={item.id}
            data-item-row="true"
            onClick={(e) => {
              e.stopPropagation();
              onToggleItem(item.id);
            }}
            className={`flex items-start gap-3 rounded-xl px-3 py-2 cursor-pointer transition-all
              ${item.itemDone
                ? 'bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-100'
                : 'bg-slate-50 hover:bg-slate-100/80 border border-slate-100'
              }`}
          >
            {/* Done indicator */}
            <div className={`w-5 h-5 mt-0.5 rounded-md flex items-center justify-center flex-shrink-0 border transition
              ${item.itemDone ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 bg-white'}`}>
              {item.itemDone && <span className="text-white text-[10px] font-black">✓</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-slate-500 text-xs font-black">{item.quantity}×</span>
                <span className={`text-sm font-bold truncate ${item.itemDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                  {item.product.name}
                </span>
              </div>
              {item.note && (
                <p className="text-amber-700 text-[10px] font-semibold mt-0.5 ml-5">{item.note}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Advance Stage Button */}
      {stage !== 'COMPLETED' && (
        <div className="px-4 pb-4">
          <button
            onClick={(e) => { e.stopPropagation(); onAdvanceStage(order.id); }}
            className={`w-full py-2.5 text-white font-black text-xs uppercase tracking-wide rounded-xl transition ${colors.btn}`}
          >
            {nextLabel}
          </button>
        </div>
      )}
    </div>
  );
}
