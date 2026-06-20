import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher-server';
import { sendReceiptEmail } from '@/lib/resend';
import { sendPushNotification } from '@/lib/onesignal';
import { broadcastDisplayState } from '@/lib/broadcastDisplayState';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { method, amount, customerEmail } = await req.json();
    const orderId = params.id;

    if (!method || amount === undefined) {
      return NextResponse.json({ error: 'Payment method and amount are required' }, { status: 400 });
    }

    // 1. Log payment record
    await prisma.payment.create({
      data: {
        orderId,
        amount: parseFloat(amount),
        method,
        status: 'COMPLETED',
      },
    });

    // 2. Set all OrderItem.kitchenStage = TO_COOK, itemDone = false
    await prisma.orderItem.updateMany({
      where: { orderId },
      data: { kitchenStage: 'TO_COOK', itemDone: false },
    });

    // 3. Mark order SENT_TO_KITCHEN + stamp sentToKitchenAt (payment = kitchen dispatch)
    //    The KDS will then advance it: SENT_TO_KITCHEN → PREPARING → COMPLETED
    const now = new Date();
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SENT_TO_KITCHEN',
        sentToKitchenAt: now,
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

    // 4. Fire customer display event
    if (order.sessionId) {
      try {
        await broadcastDisplayState(order.sessionId, {
          view: 'completion',
          payload: { total: order.total },
        });
      } catch (e) {
        console.error('Customer display broadcast failed (non-fatal):', e);
      }
    }

    // 5. Fire kds Pusher event — same event shape KDS page listens for
    try {
      await pusherServer.trigger('kds', 'order.sent', order);
    } catch (e) {
      console.error('KDS Pusher trigger failed (non-fatal):', e);
    }

    // 5. OneSignal staff alert — new ticket in kitchen
    try {
      await sendPushNotification(`Order #${order.number} paid — now in kitchen queue!`, { role: 'KITCHEN' });
    } catch (e) {
      // Non-critical
    }

    // 6. Optional receipt email
    if (customerEmail) {
      try {
        await sendReceiptEmail(customerEmail, order);
      } catch (e) {
        // Non-critical
      }
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
