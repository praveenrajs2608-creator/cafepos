import { NextRequest, NextResponse } from 'next/server';
import { KDSService } from '@/server/services/kds.service';

/** GET /api/kds/stats — today's ticket count + avg prep time */
export async function GET(req: NextRequest) {
  try {
    const stats = await KDSService.getTodayStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
