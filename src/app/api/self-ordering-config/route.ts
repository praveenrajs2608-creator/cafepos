import { NextRequest, NextResponse } from 'next/server';

// Mock system config state in memory (or database settings)
let selfOrderingConfig = {
  allowCustomerCheckout: true,
  taxRatePercent: 8,
  welcomePromoTitle: 'Welcome to Savora Atlas!',
  themeColor: '#FF6B6B',
};

export async function GET() {
  return NextResponse.json({ config: selfOrderingConfig });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    selfOrderingConfig = { ...selfOrderingConfig, ...body };
    return NextResponse.json({ success: true, config: selfOrderingConfig });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
