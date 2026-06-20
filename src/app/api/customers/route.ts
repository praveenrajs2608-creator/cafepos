import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    if (phone) {
      const customer = await prisma.customer.findUnique({
        where: { phone },
      });
      return NextResponse.json({ customer });
    }

    const customers = await prisma.customer.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ customers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, phone, email } = await req.json();

    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const customer = await prisma.customer.create({
      data: { name, phone, email },
    });

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
