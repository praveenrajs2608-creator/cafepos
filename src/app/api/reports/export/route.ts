import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Simple CSV generator
    let csv = 'Order ID,Number,Status,Type,Total,Date\n';
    orders.forEach((o) => {
      csv += `"${o.id}",${o.number},"${o.status}","${o.type}",${o.total},"${o.createdAt.toISOString()}"\n`;
    });

    const response = new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="sales-export.csv"',
      },
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
