'use client';

import React, { useState, useEffect } from 'react';
import UpiQrCode from '@/components/shared/UpiQrCode';

interface PaymentPanelProps {
  total: number;
  onPay: (method: string, amount: number, customerInfo: { name: string; phone: string; email?: string }) => void;
  onClose: () => void;
  onMethodChange?: (method: 'CASH' | 'CARD' | 'UPI') => void;
}

export function PaymentPanel({ total, onPay, onClose, onMethodChange }: PaymentPanelProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('CASH');
  const [cashReceived, setCashReceived] = useState<string>(total.toFixed(2));

  // Customer fields
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const numReceived = parseFloat(cashReceived) || 0;
  const changeDue = Math.max(0, numReceived - total);

  useEffect(() => {
    if (onMethodChange) {
      onMethodChange(selectedMethod === 'QR' ? 'UPI' : (selectedMethod as 'CASH' | 'CARD'));
    }
  }, [selectedMethod, onMethodChange]);

  const handleAuthorize = () => {
    setNameError('');
    setPhoneError('');

    onPay(selectedMethod, total, {
      name: custName.trim() || 'Walk-in Customer',
      phone: custPhone.trim() || '',
      email: custEmail.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h2 className="text-lg font-black text-slate-800">Complete Payment</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition text-xl">✕</button>
        </div>

        <div className="p-5 space-y-5 overflow-y-auto max-h-[80vh]">
          {/* Customer Info — mandatory */}
          <div className="space-y-3">
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Customer Info <span className="text-slate-400">(Optional)</span></p>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={custName}
                  onChange={(e) => { setCustName(e.target.value); setNameError(''); }}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition
                    ${nameError ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-purple-500'}`}
                />
                {nameError && <p className="text-[10px] text-red-500 font-bold">{nameError}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500">Phone</label>
                <input
                  type="tel"
                  placeholder="+1 555 0000"
                  value={custPhone}
                  onChange={(e) => { setCustPhone(e.target.value); setPhoneError(''); }}
                  className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition
                    ${phoneError ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-purple-500'}`}
                />
                {phoneError && <p className="text-[10px] text-red-500 font-bold">{phoneError}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">Email (for receipt, optional)</label>
              <input
                type="email"
                placeholder="customer@email.com"
                value={custEmail}
                onChange={(e) => setCustEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          </div>

          {/* Payment method */}
          <div className="space-y-2">
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Payment Method</p>
            <div className="grid grid-cols-3 gap-2">
              {['CASH', 'CARD', 'QR'].map((method) => (
                <button
                  key={method}
                  onClick={() => setSelectedMethod(method)}
                  className={`py-3 rounded-xl font-black text-sm border-2 transition
                    ${selectedMethod === method
                      ? 'border-purple-600 bg-purple-50 text-purple-600'
                      : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {/* Amount summary */}
          <div className="bg-slate-50 p-4 rounded-xl space-y-2.5">
            <div className="flex justify-between text-sm text-slate-500 font-semibold">
              <span>Amount Due</span>
              <span className="font-black text-slate-800">₹{total.toFixed(2)}</span>
            </div>

            {selectedMethod === 'CASH' && (
              <>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
                  <span className="text-sm text-slate-500 font-semibold">Cash Tendered</span>
                  <input
                    type="number"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    className="w-28 text-right bg-white border border-slate-200 rounded-lg px-2 py-1.5 font-black text-slate-700 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex justify-between text-sm font-semibold border-t border-slate-200 pt-2.5">
                  <span className="text-slate-500">Change Due</span>
                  <span className="text-purple-600 font-black text-base">₹{changeDue.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          {selectedMethod === 'QR' && (
            <div className="pt-2">
              <UpiQrCode
                upiId={process.env.NEXT_PUBLIC_UPI_ID || 'merchant@upi'}
                amount={total}
                storeName={process.env.NEXT_PUBLIC_STORE_NAME || 'Cafe Gourmet'}
              />
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleAuthorize}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black transition shadow-lg shadow-purple-100"
          >
            Authorize ₹{total.toFixed(2)} Transaction
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentPanel;
