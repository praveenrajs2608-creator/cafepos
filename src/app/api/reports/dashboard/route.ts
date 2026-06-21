import { NextRequest, NextResponse } from 'next/server';
import { ReportService } from '@/server/services/report.service';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const startStr = searchParams.get('startDate');
    const endStr = searchParams.get('endDate');

    const startDate = startStr ? new Date(startStr) : undefined;
    const endDate = endStr ? new Date(endStr) : undefined;

    // Ensure the end date covers the entire day
    if (endDate) {
      endDate.setUTCHours(23, 59, 59, 999);
    }

    const reports = await ReportService.getSalesSummary(startDate, endDate);
    return NextResponse.json({ reports });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
