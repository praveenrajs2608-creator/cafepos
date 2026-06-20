'use client';

import React from 'react';

export default function AdminBookingsPage() {
  const dummyBookings = [
    { id: 1, name: 'Alice Smith', guests: 4, date: '2026-06-21', time: '18:30', status: 'CONFIRMED' },
    { id: 2, name: 'Bob Johnson', guests: 2, date: '2026-06-21', time: '19:00', status: 'PENDING' },
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden max-w-4xl">
      <div className="p-6 border-b border-slate-100">
        <h3 className="font-extrabold text-slate-800 text-lg">Table Reservations</h3>
        <p className="text-xs text-slate-400 mt-0.5">Dine-in booking manager logs</p>
      </div>

      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Customer</th>
            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase text-center">Party Size</th>
            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Schedule</th>
            <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase text-right">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {dummyBookings.map((b) => (
            <tr key={b.id} className="hover:bg-slate-50/50 transition">
              <td className="px-6 py-4 font-bold text-slate-700">{b.name}</td>
              <td className="px-6 py-4 font-bold text-slate-500 text-center">{b.guests} Guests</td>
              <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                {b.date} at {b.time}
              </td>
              <td className="px-6 py-4 text-right">
                <span className={`text-[10px] px-2 py-0.5 font-bold rounded-full uppercase ${
                  b.status === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                }`}>
                  {b.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
