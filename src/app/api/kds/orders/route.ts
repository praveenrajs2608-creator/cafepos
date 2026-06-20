import { NextRequest, NextResponse } from 'next/server';
import { KDSService } from '@/server/services/kds.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const includeCompleted = searchParams.get('completed') === 'true';
    const orders = await KDSService.getKitchenOrders(includeCompleted);
    return NextResponse.json({ orders });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
