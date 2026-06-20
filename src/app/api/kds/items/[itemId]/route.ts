import { NextRequest, NextResponse } from 'next/server';
import { KDSService } from '@/server/services/kds.service';

/** PUT /api/kds/items/[itemId] — toggle itemDone for a single line item */
export async function PUT(req: NextRequest, { params }: { params: { itemId: string } }) {
  try {
    const result = await KDSService.toggleItemDone(params.itemId);
    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
