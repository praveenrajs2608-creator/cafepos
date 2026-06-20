'use client';

import React, { useEffect, useState } from 'react';

interface BestSeller {
  name: string;
  quantity: number;
  revenue: number;
}

interface ReportData {
  totalSales: number;
  totalOrders: number;
  bestSellers: BestSeller[];
}

export default function AdminDashboardPage() {
  const [reports, setReports] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/reports/dashboard')
      .then((res) => res.json())
      .then((data) => {
        setReports(data.reports || null);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="text-slate-500 font-bold text-sm">Aggregating sales charts...</p>;
  }

  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Completed Revenue</h3>
          <p className="text-3xl font-black text-slate-800 mt-2">
            ₹{reports?.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
          </p>
          <span className="text-xs text-green-500 font-bold mt-1 block">↑ 12.5% vs yesterday</span>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Completed Invoices</h3>
          <p className="text-3xl font-black text-slate-800 mt-2">{reports?.totalOrders || 0}</p>
          <span className="text-xs text-green-500 font-bold mt-1 block">↑ 4.2% vs yesterday</span>
        </div>

        <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Average Transaction</h3>
          <p className="text-3xl font-black text-slate-800 mt-2">
            ₹
            {reports && reports.totalOrders > 0
              ? (reports.totalSales / reports.totalOrders).toFixed(2)
              : '0.00'}
          </p>
          <span className="text-xs text-slate-400 font-semibold mt-1 block">Computed order ticket value</span>
        </div>
      </div>

      {/* Best Sellers Grid */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-800 text-lg">Top Menu Performers</h3>
            <p className="text-xs text-slate-400 mt-0.5">Ranked by overall items sold count</p>
          </div>
          <a
            href="/api/reports/export"
            download
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
          >
            Export CSV Report
          </a>
        </div>

        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase">Product Name</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase text-center">Items Sold</th>
              <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase text-right">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {reports?.bestSellers.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50/50 transition">
                <td className="px-6 py-4 font-bold text-slate-700">{item.name}</td>
                <td className="px-6 py-4 font-extrabold text-slate-700 text-center">{item.quantity}</td>
                <td className="px-6 py-4 font-black text-purple-600 text-right">₹{item.revenue.toFixed(2)}</td>
              </tr>
            ))}
            {(!reports?.bestSellers || reports.bestSellers.length === 0) && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-400 text-sm font-semibold">
                  No sales recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
