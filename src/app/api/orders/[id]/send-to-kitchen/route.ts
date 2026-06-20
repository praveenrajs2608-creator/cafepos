import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher-server';
import { sendPushNotification } from '@/lib/onesignal';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = params.id;

    // 1. Set every OrderItem's kitchenStage = TO_COOK
    await prisma.orderItem.updateMany({
      where: { orderId },
      data: { kitchenStage: 'TO_COOK', itemDone: false },
    });

    // 2. Set Order.status = SENT_TO_KITCHEN and record timestamp
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SENT_TO_KITCHEN',
        sentToKitchenAt: new Date(),
      },
      include: {
        items: {
          include: {
            product: { include: { category: true } },
          },
        },
        table: true,
      },
    });

    // 3. Push immediately to the "kds" Pusher channel — does NOT wait for payment
    try {
      await pusherServer.trigger('kds', 'order.sent', order);
    } catch (e) {
      console.error('Pusher kds trigger failed', e);
    }

    // 4. Optional: push notification to kitchen screens
    try {
      await sendPushNotification(`New order #${order.number} sent to kitchen!`, { role: 'KITCHEN' });
    } catch (e) {
      // Non-critical
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
