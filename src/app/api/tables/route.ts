import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tables = await prisma.table.findMany({
      include: { floor: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ tables });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, floorId } = await req.json();
    if (!name || !floorId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const table = await prisma.table.create({
      data: {
        name,
        floorId,
        token: Math.random().toString(36).substring(2, 10),
      },
    });

    return NextResponse.json({ success: true, table });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
