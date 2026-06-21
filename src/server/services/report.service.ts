import { prisma } from '@/lib/prisma';

export class ReportService {
  static async getSalesSummary(startDate?: Date, endDate?: Date) {
    const now = new Date();
    const start = startDate ?? new Date(now.getFullYear(), now.getMonth(), 1);
    const end   = endDate   ?? now;

    // Previous period (same duration)
    const duration = end.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - duration);
    const prevEnd   = new Date(start.getTime() - 1);

    const [orders, prevOrders] = await Promise.all([
      prisma.order.findMany({
        where: { status: 'COMPLETED', createdAt: { gte: start, lte: end } },
        include: { items: { include: { product: { include: { category: true } } } } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.order.findMany({
        where: { status: 'COMPLETED', createdAt: { gte: prevStart, lte: prevEnd } },
        select: { total: true },
      }),
    ]);

    // ── KPIs ──────────────────────────────────────────────────────────────────
    const totalSales    = orders.reduce((a, o) => a + o.total, 0);
    const totalOrders   = orders.length;
    const avgOrder      = totalOrders > 0 ? totalSales / totalOrders : 0;
    const prevSales     = prevOrders.reduce((a, o) => a + o.total, 0);
    const salesGrowth   = prevSales > 0 ? ((totalSales - prevSales) / prevSales) * 100 : 0;

    // ── Daily trend (last 30 days or date range) ──────────────────────────────
    const dailyMap: Record<string, number> = {};
    orders.forEach((o) => {
      const day = o.createdAt.toISOString().slice(0, 10);
      dailyMap[day] = (dailyMap[day] ?? 0) + o.total;
    });
    const dailySales = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));

    // ── Hourly distribution ───────────────────────────────────────────────────
    const hourlyMap: Record<number, number> = {};
    orders.forEach((o) => {
      const h = o.createdAt.getHours();
      hourlyMap[h] = (hourlyMap[h] ?? 0) + 1;
    });
    const hourlySales = Array.from({ length: 24 }, (_, h) => ({
      hour: `${h.toString().padStart(2, '0')}:00`,
      orders: hourlyMap[h] ?? 0,
    }));

    // ── Category breakdown ────────────────────────────────────────────────────
    const catMap: Record<string, { name: string; revenue: number; qty: number }> = {};
    orders.forEach((o) => {
      const df = o.subtotal > 0 ? (o.subtotal - o.discount) / o.subtotal : 1;
      o.items.forEach((item) => {
        const catId   = item.product.categoryId ?? 'uncategorised';
        const catName = item.product.category?.name ?? 'Uncategorised';
        if (!catMap[catId]) catMap[catId] = { name: catName, revenue: 0, qty: 0 };
        catMap[catId].revenue += item.quantity * item.price * df;
        catMap[catId].qty     += item.quantity;
      });
    });
    const categoryBreakdown = Object.values(catMap).sort((a, b) => b.revenue - a.revenue);

    // ── Top products ──────────────────────────────────────────────────────────
    const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {};
    orders.forEach((o) => {
      const df = o.subtotal > 0 ? (o.subtotal - o.discount) / o.subtotal : 1;
      o.items.forEach((item) => {
        const pid = item.product.id;
        if (!productMap[pid]) productMap[pid] = { name: item.product.name, quantity: 0, revenue: 0 };
        productMap[pid].quantity += item.quantity;
        productMap[pid].revenue  += item.quantity * item.price * df;
      });
    });
    const bestSellers = Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // ── Top orders ────────────────────────────────────────────────────────────
    const topOrders = [...orders]
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
      .map((o) => ({
        id:        o.id,
        number:    o.number,
        total:     o.total,
        type:      o.type,
        status:    o.status,
        createdAt: o.createdAt.toISOString(),
        itemCount: o.items.reduce((s, i) => s + i.quantity, 0),
      }));

    return {
      totalSales,
      totalOrders,
      avgOrder,
      salesGrowth,
      dailySales,
      hourlySales,
      categoryBreakdown,
      bestSellers,
      topOrders,
    };
  }
}
