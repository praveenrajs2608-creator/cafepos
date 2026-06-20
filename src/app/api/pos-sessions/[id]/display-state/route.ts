import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { broadcastDisplayState } from '@/lib/broadcastDisplayState';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionId = params.id;

    const session = await prisma.pOSSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const activeOrder = await prisma.order.findFirst({
      where: {
        sessionId,
        status: 'PENDING',
      },
      include: {
        items: {
          include: { product: true },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (activeOrder) {
      const payment = activeOrder.payments[0];
      if (payment) {
        return NextResponse.json({
          view: 'payment',
          payload: {
            method: payment.method === 'QR' ? 'UPI' : (payment.method as 'CASH' | 'CARD' | 'UPI'),
            amount: payment.amount,
          },
        });
      }

      return NextResponse.json({
        view: 'cart',
        payload: {
          items: activeOrder.items.map((item) => ({
            id: item.id,
            name: item.product.name,
            price: item.price,
            quantity: item.quantity,
          })),
          subtotal: activeOrder.subtotal,
          tax: activeOrder.tax,
          discount: activeOrder.discount,
          total: activeOrder.total,
        },
      });
    }

    const lastPaidOrder = await prisma.order.findFirst({
      where: {
        sessionId,
        status: { notIn: ['PENDING', 'CANCELLED'] },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (lastPaidOrder && (new Date().getTime() - new Date(lastPaidOrder.updatedAt).getTime()) < 30000) {
      return NextResponse.json({
        view: 'completion',
        payload: { total: lastPaidOrder.total },
      });
    }

    return NextResponse.json({
      view: 'cart',
      payload: {
        items: [],
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionId = params.id;
    const state = await req.json();
    await broadcastDisplayState(sessionId, state);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
