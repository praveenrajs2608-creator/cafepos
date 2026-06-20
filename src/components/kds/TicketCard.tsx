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
    card: 'border-amber-400 bg-amber-400/5',
    badge: 'bg-amber-400/20 text-amber-300',
    badgeText: 'To Cook',
    btn: 'bg-amber-500 hover:bg-amber-400',
  },
  PREPARING: {
    card: 'border-blue-400 bg-blue-400/5',
    badge: 'bg-blue-400/20 text-blue-300',
    badgeText: 'Preparing',
    btn: 'bg-blue-500 hover:bg-blue-400',
  },
  COMPLETED: {
    card: 'border-emerald-500 bg-emerald-500/5',
    badge: 'bg-emerald-500/20 text-emerald-300',
    badgeText: 'Completed',
    btn: 'bg-emerald-600 hover:bg-emerald-500',
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
        ${colors.card} ${stage !== 'COMPLETED' ? 'hover:scale-[1.01] hover:shadow-lg hover:shadow-black/30' : 'opacity-80'}`}
    >
      {/* Card Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/10 flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-black text-lg">#{order.number}</span>
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide ${colors.badge}`}>
              {colors.badgeText}
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-0.5 font-semibold">
            {order.table ? `Table ${order.table.name}` : 'Take Away'} &bull; {getElapsed(order.sentToKitchenAt)}
          </p>
        </div>
        <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wide bg-slate-800 text-slate-400`}>
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
                ? 'bg-emerald-900/20 hover:bg-emerald-900/30'
                : 'bg-slate-800/60 hover:bg-slate-700/60'
              }`}
          >
            {/* Done indicator */}
            <div className={`w-5 h-5 mt-0.5 rounded-md flex items-center justify-center flex-shrink-0 border transition
              ${item.itemDone ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
              {item.itemDone && <span className="text-white text-[10px] font-black">✓</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-slate-400 text-xs font-black">{item.quantity}×</span>
                <span className={`text-sm font-bold truncate ${item.itemDone ? 'line-through text-slate-500' : 'text-white'}`}>
                  {item.product.name}
                </span>
              </div>
              {item.note && (
                <p className="text-amber-400 text-[10px] font-semibold mt-0.5 ml-5">{item.note}</p>
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
