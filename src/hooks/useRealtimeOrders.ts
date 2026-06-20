import { useEffect, useState } from 'react';
import { pusherClient } from '@/lib/pusher-client';

export function useRealtimeOrders() {
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    // Fetch initial pending orders
    fetch('/api/orders?status=PENDING,PREPARING,READY')
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .catch((err) => console.error('Failed to fetch initial orders', err));

    if (!pusherClient) return;

    // Subscribe to Pusher orders channel
    const channel = pusherClient.subscribe('orders-channel');

    channel.bind('order-created', (newOrder: any) => {
      setOrders((prev) => [newOrder, ...prev]);
    });

    channel.bind('order-updated', (updatedOrder: any) => {
      setOrders((prev) =>
        prev.map((order) => (order.id === updatedOrder.id ? updatedOrder : order))
      );
    });

    channel.bind('order-deleted', (deletedOrderId: string) => {
      setOrders((prev) => prev.filter((order) => order.id !== deletedOrderId));
    });

    return () => {
      if (pusherClient) {
        pusherClient.unsubscribe('orders-channel');
      }
    };
  }, []);

  return { orders, setOrders };
}
