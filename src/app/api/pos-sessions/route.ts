import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const activeSession = await prisma.pOSSession.findFirst({
      where: { userId: session.id, status: 'OPEN' },
      include: { user: { select: { name: true } } },
    });

    return NextResponse.json({ activeSession });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = getSession(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { startCash } = await req.json();
    if (startCash === undefined) {
      return NextResponse.json({ error: 'Starting cash is required' }, { status: 400 });
    }

    // Check for open session
    const existing = await prisma.pOSSession.findFirst({
      where: { userId: session.id, status: 'OPEN' },
    });
    if (existing) {
      return NextResponse.json({ error: 'You already have an open session' }, { status: 400 });
    }

    const newSession = await prisma.pOSSession.create({
      data: {
        userId: session.id,
        status: 'OPEN',
        startCash: parseFloat(startCash),
      },
    });

    return NextResponse.json({ success: true, session: newSession });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
