import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/orders/[id]/status — lightweight status for customer order tracking
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        number: true,
        status: true,
        total: true,
        createdAt: true,
        items: {
          select: {
            id: true,
            kitchenStage: true,
            quantity: true,
            product: { select: { name: true } },
            variantName: true,
          },
        },
        table: { select: { name: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
