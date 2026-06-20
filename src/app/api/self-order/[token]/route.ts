import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/self-order/[token] — returns table + menu (products with variants/addons + categories) + brand config
export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const table = await prisma.table.findUnique({
      where: { token: params.token },
      include: { floor: true },
    });

    if (!table) {
      return NextResponse.json({ error: 'Invalid or expired QR token' }, { status: 404 });
    }

    const [products, categories, config] = await Promise.all([
      prisma.product.findMany({
        where: { isActive: true },
        include: {
          category: true,
          variants: { orderBy: { name: 'asc' } },
          addons: { orderBy: { name: 'asc' } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.category.findMany({ orderBy: { name: 'asc' } }),
      prisma.selfOrderingConfig.findFirst(),
    ]);

    return NextResponse.json({ table, products, categories, config });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
