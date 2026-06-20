import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { code, discount, type, minSpend, expiry, isActive } = await req.json();

    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: {
        ...(code !== undefined && { code: code.toUpperCase() }),
        ...(discount !== undefined && { discount: parseFloat(discount) }),
        ...(type !== undefined && { type }),
        ...(minSpend !== undefined && { minSpend: parseFloat(minSpend) }),
        ...(expiry !== undefined && { expiry: new Date(expiry) }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Soft-delete: mark inactive rather than hard delete (preserves order history)
    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: { isActive: false },
    });
    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
