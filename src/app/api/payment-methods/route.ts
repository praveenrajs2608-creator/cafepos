import { NextResponse } from 'next/server';

export async function GET() {
  // Returns supported payment methods list
  const paymentMethods = [
    { id: 'CASH', name: 'Cash payment', icon: 'DollarSign' },
    { id: 'CARD', name: 'Credit/Debit Card', icon: 'CreditCard' },
    { id: 'QR', name: 'Quick QR Code Scan', icon: 'QrCode' },
  ];
  return NextResponse.json({ paymentMethods });
}
