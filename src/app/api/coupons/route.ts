import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (code) {
      const coupon = await prisma.coupon.findUnique({
        where: { code, isActive: true },
      });
      if (!coupon) return NextResponse.json({ error: 'Coupon not found or inactive' }, { status: 404 });
      if (new Date(coupon.expiry) < new Date()) {
        return NextResponse.json({ error: 'Coupon expired' }, { status: 400 });
      }
      return NextResponse.json({ coupon });
    }

    const coupons = await prisma.coupon.findMany({ orderBy: { expiry: 'asc' } });
    return NextResponse.json({ coupons });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { code, discount, type, minSpend, expiry } = await req.json();

    if (!code || discount === undefined || !type || !expiry) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discount: parseFloat(discount),
        type,
        minSpend: minSpend ? parseFloat(minSpend) : 0,
        expiry: new Date(expiry),
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, coupon });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
