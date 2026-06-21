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
    // 1. Validate items and get DB prices
    let subtotal = 0;
    const validatedItems = [];

    for (const item of data.items) {
      if (item.quantity <= 0) {
        throw new Error('Quantity must be greater than zero.');
      }
      const dbProduct = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!dbProduct) throw new Error(`Product ${item.productId} not found`);

      subtotal += dbProduct.price * item.quantity;
      validatedItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price: dbProduct.price, // Trust DB price, not client payload
        note: item.note,
        status: 'PENDING',
      });
    }

    // 2. Calculate discounts and totals
    let discount = 0;
    let couponId: string | undefined;

    if (data.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: data.couponCode, isActive: true },
      });
      // Add expiry check
      if (coupon && coupon.expiry > new Date() && subtotal >= coupon.minSpend) {
        couponId = coupon.id;
        discount = coupon.type === 'PERCENTAGE' ? subtotal * (coupon.discount / 100) : coupon.discount;
      }
    }

    // Floor the discounted total to 0 to prevent negative totals
    const totalAfterDiscount = Math.max(0, subtotal - discount);
    
    // Ensure discount recorded doesn't exceed subtotal
    discount = Math.min(discount, subtotal);

    const tax = totalAfterDiscount * 0.08;
    const total = totalAfterDiscount + tax;

    // 3. Upsert customer if name + phone provided
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

    // 4. Get incremental order number
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
          create: validatedItems,
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
