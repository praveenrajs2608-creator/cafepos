import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher-server';
import { sendPushNotification } from '@/lib/onesignal';
import { calculateOrderTotals, effectivePrice } from '@/lib/pricing';

interface SelfOrderItem {
  productId: string;
  quantity: number;
  price: number;           // base price
  variantName?: string;
  variantDelta?: number;
  addons?: { name: string; priceDelta: number }[];
  note?: string;
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const table = await prisma.table.findUnique({ where: { token: params.token } });
    if (!table) {
      return NextResponse.json({ error: 'Invalid or expired QR token' }, { status: 404 });
    }

    const { items, couponCode }: { items: SelfOrderItem[]; couponCode?: string } = await req.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in order' }, { status: 400 });
    }

    // 1. Resolve coupon
    let couponId: string | undefined;
    let couponDetails = null;
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: couponCode.toUpperCase(), isActive: true },
      });
      if (coupon && new Date(coupon.expiry) >= new Date()) {
        couponId = coupon.id;
        couponDetails = { type: coupon.type as 'PERCENTAGE' | 'FLAT', discount: coupon.discount, minSpend: coupon.minSpend };
      }
    }

    // 2. Compute totals using shared pricing engine
    const pricingItems = items.map((item) => ({
      id: item.productId,
      price: item.price,
      quantity: item.quantity,
      variantDelta: item.variantDelta,
      addonDeltas: item.addons?.map((a) => a.priceDelta),
    }));

    const totals = calculateOrderTotals(pricingItems, couponDetails);

    // 3. Order number
    const count = await prisma.order.count();
    const orderNumber = count + 1000;

    const now = new Date();

    // 4. Create order — SENT_TO_KITCHEN immediately, no cashier review
    const order = await prisma.order.create({
      data: {
        number: orderNumber,
        status: 'SENT_TO_KITCHEN',
        type: 'DINE_IN',
        source: 'SELF_ORDER',
        tableId: table.id,
        couponId,
        subtotal: totals.subtotal,
        discount: totals.discount,
        tax: totals.tax,
        total: totals.total,
        sentToKitchenAt: now,
        items: {
          create: items.map((item) => {
            const variantDelta = item.variantDelta ?? 0;
            const addonDeltas = item.addons?.map((a) => a.priceDelta) ?? [];
            const unitPrice = item.price + variantDelta + addonDeltas.reduce((a, b) => a + b, 0);
            return {
              productId: item.productId,
              quantity: item.quantity,
              price: parseFloat(unitPrice.toFixed(2)),
              status: 'PENDING',
              kitchenStage: 'TO_COOK',
              note: item.note,
              variantName: item.variantName,
              addonsJson: item.addons ? JSON.stringify(item.addons) : null,
            };
          }),
        },
      },
      include: {
        items: { include: { product: true } },
        table: true,
      },
    });

    // 5. Fire KDS Pusher event — same shape payment flow uses
    try {
      await pusherServer.trigger('kds', 'order.sent', order);
    } catch (e) {
      console.error('KDS Pusher trigger failed (non-fatal):', e);
    }

    // 6. Fire POS orders channel — cashier sees self-order appear live
    try {
      await pusherServer.trigger('pos-orders', 'new-self-order', {
        order,
        tableName: table.name,
      });
    } catch (e) {
      console.error('POS Pusher trigger failed (non-fatal):', e);
    }

    // 7. OneSignal alert to staff
    try {
      await sendPushNotification(
        `🍽️ New self-order — Table ${table.name} — #${order.number}`,
        { role: 'CASHIER' }
      );
    } catch (e) {
      console.error('OneSignal push failed (non-fatal):', e);
    }

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
