import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const floors = await prisma.floor.findMany({
      include: { tables: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json({ floors });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    const floor = await prisma.floor.create({ data: { name } });
    return NextResponse.json({ success: true, floor });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
