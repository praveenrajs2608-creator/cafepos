import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, description, discount, type, scope, minQuantity, minOrderAmount, isActive } = await req.json();

    const promotion = await prisma.promotion.update({
      where: { id: params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(discount !== undefined && { discount: parseFloat(discount) }),
        ...(type !== undefined && { type }),
        ...(scope !== undefined && { scope }),
        ...(minQuantity !== undefined && { minQuantity: minQuantity ? parseInt(minQuantity) : null }),
        ...(minOrderAmount !== undefined && { minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ success: true, promotion });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const promotion = await prisma.promotion.update({
      where: { id: params.id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true, promotion });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
