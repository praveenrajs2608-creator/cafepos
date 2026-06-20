import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        items: { include: { product: true } },
        table: true,
        payments: true,
        coupon: true,
      },
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Format raw receipt payload for thermal printing template or screen render
    return NextResponse.json({
      receipt: {
        header: 'CAFE POS INC.',
        address: '123 Gourmet Street, Foodville',
        phone: '+1 (555) 123-4567',
        orderNumber: order.number,
        dateTime: order.createdAt,
        tableName: order.table ? order.table.name : 'Take Away',
        items: order.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
        subtotal: order.subtotal,
        discount: order.discount,
        tax: order.tax,
        total: order.total,
        paymentMethod: order.payments[0]?.method || 'UNPAID',
        footer: 'Thank you for dining with us!',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
