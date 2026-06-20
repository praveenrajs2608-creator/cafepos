'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { pusherClient } from '@/lib/pusher-client';

export interface KDSOrderItem {
  id: string;
  quantity: number;
  price: number;
  kitchenStage: string;
  itemDone: boolean;
  note: string | null;
  product: {
    id: string;
    name: string;
    kdsEnabled: boolean;
    category: { id: string; name: string };
  };
}

export interface KDSOrder {
  id: string;
  number: number;
  status: string;
  type: string;
  sentToKitchenAt: string | null;
  completedAt: string | null;
  createdAt: string;
  table: { id: string; name: string } | null;
  items: KDSOrderItem[];
}

export function useKDSOrders() {
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/kds/orders?completed=true');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to fetch KDS orders', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    // ── Polling fallback: refresh every 10s (works without Pusher) ──────────
    pollRef.current = setInterval(fetchOrders, 10_000);

    // ── BroadcastChannel: instant update when POS is on same machine ────────
    let bc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined') {
      bc = new BroadcastChannel('cafe-pos-kds');
      bc.onmessage = (event) => {
        if (event.data?.type === 'ORDER_SENT') {
          // A new order just landed — refetch immediately
          fetchOrders();
        }
      };
    }

    // ── Pusher: realtime for multi-machine setups ────────────────────────────
    if (!pusherClient) {
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
        bc?.close();
      };
    }

    const channel = pusherClient.subscribe('kds');

    channel.bind('order.sent', (order: KDSOrder) => {
      setOrders((prev) => {
        if (prev.some((o) => o.id === order.id)) return prev;
        return [order, ...prev];
      });
    });

    channel.bind('order.stage-updated', (updatedOrder: KDSOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
    });

    channel.bind('order.item-updated', ({ order }: { item: any; order: KDSOrder }) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? order : o))
      );
    });

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      bc?.close();
      if (pusherClient) pusherClient.unsubscribe('kds');
    };
  }, [fetchOrders]);

  return { orders, setOrders, loading, refetch: fetchOrders };
}
