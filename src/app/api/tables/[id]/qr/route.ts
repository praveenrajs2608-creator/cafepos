import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTableQRUrl, generateQRCodePDF } from '@/lib/qr';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const table = await prisma.table.findUnique({
      where: { id: params.id },
    });
    if (!table) return NextResponse.json({ error: 'Table not found' }, { status: 404 });

    const qrUrl = generateTableQRUrl(table.token);
    const pdfPath = await generateQRCodePDF(table.token);

    return NextResponse.json({ qrUrl, pdfPath });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
