import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { endCash } = await req.json();

    if (endCash === undefined) {
      return NextResponse.json({ error: 'Ending cash is required' }, { status: 400 });
    }

    const updatedSession = await prisma.pOSSession.update({
      where: { id: params.id },
      data: {
        status: 'CLOSED',
        closeTime: new Date(),
        endCash: parseFloat(endCash),
      },
    });

    return NextResponse.json({ success: true, session: updatedSession });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
