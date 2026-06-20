import { prisma } from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher-server';

const STAGE_ORDER = ['TO_COOK', 'PREPARING', 'COMPLETED'] as const;
type KitchenStage = typeof STAGE_ORDER[number];

function nextStage(current: string): KitchenStage {
  const idx = STAGE_ORDER.indexOf(current as KitchenStage);
  return STAGE_ORDER[Math.min(idx + 1, STAGE_ORDER.length - 1)];
}

export class KDSService {
  /** Fetch active kitchen orders (everything not COMPLETED or CANCELLED) */
  static async getKitchenOrders(includeCompleted = false) {
    const whereStatus = includeCompleted
      ? { in: ['SENT_TO_KITCHEN', 'PREPARING', 'COMPLETED'] }
      : { in: ['SENT_TO_KITCHEN', 'PREPARING'] };

    return prisma.order.findMany({
      where: { status: whereStatus },
      include: {
        items: {
          include: {
            product: { include: { category: true } },
          },
        },
        table: true,
      },
      orderBy: { sentToKitchenAt: 'asc' },
    });
  }

  /** Advance the whole order's kitchenStage: TO_COOK → PREPARING → COMPLETED */
  static async advanceOrderStage(orderId: string) {
    // Get current stage from items (use the "lowest" stage as the order's stage)
    const items = await prisma.orderItem.findMany({ where: { orderId } });
    const currentStage = items[0]?.kitchenStage ?? 'TO_COOK';
    const newStage = nextStage(currentStage);

    // Update all items to new stage
    await prisma.orderItem.updateMany({
      where: { orderId },
      data: { kitchenStage: newStage },
    });

    // Derive order-level status
    const newOrderStatus = newStage === 'COMPLETED' ? 'COMPLETED' : 'PREPARING';

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: newOrderStatus,
        ...(newStage === 'COMPLETED' ? { completedAt: new Date() } : {}),
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

    // Broadcast to kds channel
    try {
      await pusherServer.trigger('kds', 'order.stage-updated', updatedOrder);
    } catch (e) {
      console.error('KDS stage-updated broadcast failed', e);
    }

    return updatedOrder;
  }

  /** Toggle a single item's itemDone flag — does NOT change the order stage */
  static async toggleItemDone(itemId: string) {
    const item = await prisma.orderItem.findUnique({ where: { id: itemId } });
    if (!item) throw new Error('Item not found');

    const updated = await prisma.orderItem.update({
      where: { id: itemId },
      data: { itemDone: !item.itemDone },
      include: { product: { include: { category: true } } },
    });

    // Fetch full order to broadcast
    const order = await prisma.order.findUnique({
      where: { id: updated.orderId },
      include: {
        items: { include: { product: { include: { category: true } } } },
        table: true,
      },
    });

    try {
      await pusherServer.trigger('kds', 'order.item-updated', { item: updated, order });
    } catch (e) {
      console.error('KDS item-updated broadcast failed', e);
    }

    return { item: updated, order };
  }

  /** Stats: today's tickets + avg prep time */
  static async getTodayStats() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const orders = await prisma.order.findMany({
      where: {
        sentToKitchenAt: { gte: startOfDay },
      },
      select: {
        id: true,
        sentToKitchenAt: true,
        completedAt: true,
      },
    });

    const ticketCount = orders.length;

    const completedOrders = orders.filter((o) => o.sentToKitchenAt && o.completedAt);
    const avgPrepMs =
      completedOrders.length > 0
        ? completedOrders.reduce((sum, o) => {
            return sum + (o.completedAt!.getTime() - o.sentToKitchenAt!.getTime());
          }, 0) / completedOrders.length
        : 0;

    const avgPrepMinutes = Math.round(avgPrepMs / 60000);

    return { ticketCount, avgPrepMinutes };
  }
}
