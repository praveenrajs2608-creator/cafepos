'use client';

import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface UpiQrCodeProps {
  upiId: string;
  amount: number;
  storeName: string;
}

export default function UpiQrCode({ upiId, amount, storeName }: UpiQrCodeProps) {
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(storeName)}&am=${amount}&cu=INR`;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100/80">
        <QRCodeSVG
          value={upiUrl}
          size={200}
          level="M"
          includeMargin={false}
        />
      </div>
      <div className="text-center space-y-1">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Scan to Pay via any UPI App</p>
        <p className="text-lg font-black text-slate-800">₹{amount.toFixed(2)}</p>
        <p className="text-xs font-bold text-slate-500">{storeName}</p>
        <p className="text-[10px] font-semibold text-slate-400">{upiId}</p>
      </div>
    </div>
  );
}
