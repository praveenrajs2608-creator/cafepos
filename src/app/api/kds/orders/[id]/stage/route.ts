import { NextRequest, NextResponse } from 'next/server';
import { KDSService } from '@/server/services/kds.service';

/** PUT /api/kds/orders/[id]/stage — advance this order to the next kitchen stage */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updatedOrder = await KDSService.advanceOrderStage(params.id);
    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
