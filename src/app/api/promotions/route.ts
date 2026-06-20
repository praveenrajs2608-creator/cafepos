import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';

    const promotions = await prisma.promotion.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ promotions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, description, discount, type, scope, minQuantity, minOrderAmount } = await req.json();

    if (!name || discount === undefined || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const promotion = await prisma.promotion.create({
      data: {
        name,
        description,
        discount: parseFloat(discount),
        type,
        scope: scope || 'ORDER',
        minQuantity: minQuantity ? parseInt(minQuantity) : null,
        minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, promotion });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
