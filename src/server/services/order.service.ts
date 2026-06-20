import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher-server';

export class OrderService {
  static async createOrder(data: {
    tableId?: string;
    sessionId?: string;
    items: Array<{ productId: string; quantity: number; price: number; note?: string }>;
    type: 'DINE_IN' | 'TAKE_AWAY';
    couponCode?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
  }) {
    // 1. Calculate totals
    let discount = 0;
    let couponId: string | undefined;

    const subtotal = data.items.reduce((acc, item) => acc + item.price * item.quantity, 0);

    if (data.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: data.couponCode, isActive: true },
      });
      if (coupon && subtotal >= coupon.minSpend) {
        couponId = coupon.id;
        discount = coupon.type === 'PERCENTAGE' ? subtotal * (coupon.discount / 100) : coupon.discount;
      }
    }

    const tax = (subtotal - discount) * 0.08;
    const total = subtotal - discount + tax;

    // 2. Upsert customer if name + phone provided
    let customerId: string | undefined;
    if (data.customerName && data.customerPhone && data.customerPhone.trim().length > 0) {
      const customer = await prisma.customer.upsert({
        where: { phone: data.customerPhone },
        update: {
          name: data.customerName,
          ...(data.customerEmail && { email: data.customerEmail }),
        },
        create: {
          name: data.customerName,
          phone: data.customerPhone,
          ...(data.customerEmail && { email: data.customerEmail }),
        },
      });
      customerId = customer.id;
    }

    // 3. Get incremental order number
    const count = await prisma.order.count();
    const orderNumber = count + 1000;

    const order = await prisma.order.create({
      data: {
        number: orderNumber,
        status: 'PENDING',
        type: data.type,
        tableId: data.tableId,
        sessionId: data.sessionId,
        customerId,
        subtotal,
        discount,
        tax,
        total,
        couponId,
        items: {
          create: data.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            note: item.note,
            status: 'PENDING',
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        table: true,
        customer: true,
      },
    });

    // Broadcast to POS terminals
    try {
      await pusherServer.trigger('orders-channel', 'order-created', order);
    } catch (e) {
      console.error('Pusher trigger failed', e);
    }

    return order;
  }

  static async updateOrderStatus(orderId: string, status: string) {
    const order = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: {
        items: { include: { product: true } },
        table: true,
        customer: true,
      },
    });

    try {
      await pusherServer.trigger('orders-channel', 'order-updated', order);
    } catch (e) {
      console.error('Pusher trigger failed', e);
    }

    return order;
  }
}
