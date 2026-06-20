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

    // Calculate best selling products
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        const prod = item.product;
        if (!productSales[prod.id]) {
          productSales[prod.id] = { name: prod.name, quantity: 0, revenue: 0 };
        }
        productSales[prod.id].quantity += item.quantity;
        productSales[prod.id].revenue += item.quantity * item.price;
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
