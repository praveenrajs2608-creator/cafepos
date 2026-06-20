'use client';

import { useEffect, useState, useCallback } from 'react';
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

    if (!pusherClient) return;

    // Subscribe to the dedicated "kds" channel
    const channel = pusherClient.subscribe('kds');

    // New order arrived from POS "Send to Kitchen"
    channel.bind('order.sent', (order: KDSOrder) => {
      setOrders((prev) => {
        // Avoid duplicates
        if (prev.some((o) => o.id === order.id)) return prev;
        return [order, ...prev];
      });
    });

    // Stage advanced (TO_COOK → PREPARING → COMPLETED)
    channel.bind('order.stage-updated', (updatedOrder: KDSOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
      );
    });

    // Single item itemDone toggled
    channel.bind('order.item-updated', ({ order }: { item: any; order: KDSOrder }) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? order : o))
      );
    });

    return () => {
      if (pusherClient) {
        pusherClient.unsubscribe('kds');
      }
    };
  }, [fetchOrders]);

  return { orders, setOrders, loading, refetch: fetchOrders };
}
