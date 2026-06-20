'use client';

import React, { useEffect, useState } from 'react';

interface SalesReport {
  totalSales: number;
  totalOrders: number;
}

export default function AdminReportsPage() {
  const [report, setReport] = useState<SalesReport | null>(null);

  useEffect(() => {
    fetch('/api/reports/dashboard')
      .then((res) => res.json())
      .then((data) => setReport(data.reports || null));
  }, []);

  return (
    <div className="space-y-6 max-w-xl">
      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-extrabold text-slate-800 text-lg border-b border-slate-100 pb-3">Accounting Ledgers</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-xl text-center">
            <span className="text-xs font-bold text-slate-400 uppercase block">Total Sales</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">
              ${report?.totalSales.toFixed(2) || '0.00'}
            </span>
          </div>
          <div className="bg-slate-50 p-4 rounded-xl text-center">
            <span className="text-xs font-bold text-slate-400 uppercase block">Total Orders</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">{report?.totalOrders || 0}</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm flex items-center justify-between">
        <div>
          <h4 className="font-bold text-slate-800">Raw Data Exporter</h4>
          <span className="text-xs text-slate-400 block mt-0.5">Download full orders record CSV file</span>
        </div>
        <a
          href="/api/reports/export"
          download
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl transition"
        >
          Download CSV
        </a>
      </div>
    </div>
  );
}
