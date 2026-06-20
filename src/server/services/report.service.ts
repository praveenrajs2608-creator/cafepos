import { prisma } from '@/lib/prisma';

export class ReportService {
  static async getSalesSummary(startDate?: Date, endDate?: Date) {
    const filter: any = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.gte = startDate;
      if (endDate) filter.createdAt.lte = endDate;
    }

    const orders = await prisma.order.findMany({
      where: {
        ...filter,
        status: 'COMPLETED',
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const totalSales = orders.reduce((acc, order) => acc + order.total, 0);
    const totalOrders = orders.length;

    // Calculate best selling products — revenue uses discounted bill values
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    orders.forEach((order) => {
      // Proportional discount factor: how much of the subtotal was actually billed
      const discountFactor = order.subtotal > 0
        ? (order.subtotal - order.discount) / order.subtotal
        : 1;

      order.items.forEach((item) => {
        const prod = item.product;
        if (!productSales[prod.id]) {
          productSales[prod.id] = { name: prod.name, quantity: 0, revenue: 0 };
        }
        productSales[prod.id].quantity += item.quantity;
        // Scale item revenue by the discount factor applied to the whole order
        productSales[prod.id].revenue += item.quantity * item.price * discountFactor;
      });
    });

    const bestSellers = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    return {
      totalSales,
      totalOrders,
      bestSellers,
    };
  }
}
