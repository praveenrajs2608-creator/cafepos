'use client';

import React, { useEffect, useMemo, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface DailySale      { date: string; revenue: number }
interface HourlySale     { hour: string; orders: number }
interface CategoryItem   { name: string; revenue: number; qty: number }
interface ProductItem    { name: string; quantity: number; revenue: number }
interface TopOrder       { id: string; number: number; total: number; type: string; status: string; createdAt: string; itemCount: number }

interface Report {
  totalSales:        number;
  totalOrders:       number;
  avgOrder:          number;
  salesGrowth:       number;
  dailySales:        DailySale[];
  hourlySales:       HourlySale[];
  categoryBreakdown: CategoryItem[];
  bestSellers:       ProductItem[];
  topOrders:         TopOrder[];
}

// ─── Palette ──────────────────────────────────────────────────────────────────
const BRAND       = '#6e473b';
const BRAND_LIGHT = '#e1d4c2';
const COLORS      = ['#6e473b','#a0715e','#c4967e','#d9b99b','#e1d4c2','#b08b71','#8a5d4a','#f0e0cc','#7a5344','#c9a88e'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const fmtD = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short' });

// ─── Micro Components ─────────────────────────────────────────────────────────

/** Thin sparkline / bar chart rendered in pure SVG */
function BarChart({ data, height = 120 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 100 / data.length;
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      {data.map((d, i) => {
        const barH = (d.value / max) * (height - 10);
        return (
          <g key={i}>
            <rect
              x={i * w + w * 0.1}
              y={height - barH - 2}
              width={w * 0.8}
              height={barH}
              rx="2"
              fill={BRAND}
              opacity="0.85"
            />
          </g>
        );
      })}
    </svg>
  );
}

/** Area sparkline */
function LineChart({ data, height = 100 }: { data: number[]; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = height - (v / max) * (height - 8) - 4;
    return `${x},${y}`;
  });
  const area = `M${pts[0]} ` + pts.slice(1).map((p) => `L${p}`).join(' ')
    + ` L100,${height} L0,${height} Z`;
  const line = `M${pts[0]} ` + pts.slice(1).map((p) => `L${p}`).join(' ');

  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BRAND} stopOpacity="0.3" />
          <stop offset="100%" stopColor={BRAND} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#areaGrad)" />
      <path d={line} fill="none" stroke={BRAND} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Donut / pie chart */
function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((a, s) => a + s.value, 0) || 1;
  let angle = -90;
  const R = 35; const CX = 50; const CY = 50;
  const arcs = slices.map((s) => {
    const sweep = (s.value / total) * 360;
    const startAngle = angle;
    angle += sweep;
    return { ...s, startAngle, sweep };
  });

  function arc(cx: number, cy: number, r: number, start: number, sweep: number) {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(start));
    const y1 = cy + r * Math.sin(toRad(start));
    const x2 = cx + r * Math.cos(toRad(start + sweep));
    const y2 = cy + r * Math.sin(toRad(start + sweep));
    const large = sweep > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  }

  return (
    <svg viewBox="0 0 100 100" className="w-full max-w-[140px] mx-auto">
      {arcs.map((a, i) => (
        <path
          key={i}
          d={arc(CX, CY, R, a.startAngle, Math.max(a.sweep - 1, 0.5))}
          fill="none"
          stroke={a.color}
          strokeWidth="18"
          strokeLinecap="round"
        />
      ))}
      <circle cx={CX} cy={CY} r="22" fill="white" />
      <text x={CX} y={CY - 4} textAnchor="middle" fontSize="8" fill={BRAND} fontWeight="900">{slices.length}</text>
      <text x={CX} y={CY + 7} textAnchor="middle" fontSize="5" fill="#888">categories</text>
    </svg>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, positive, sparkData }: {
  label: string; value: string; sub?: string; positive?: boolean; sparkData?: number[];
}) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col gap-3">
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</p>
      <p className="text-3xl font-black text-slate-800">{value}</p>
      {sub && (
        <p className={`text-xs font-bold ${positive === undefined ? 'text-slate-400' : positive ? 'text-emerald-600' : 'text-red-500'}`}>
          {sub}
        </p>
      )}
      {sparkData && sparkData.length > 1 && (
        <div className="opacity-60"><LineChart data={sparkData} height={40} /></div>
      )}
    </div>
  );
}

// ─── Date Preset helper ────────────────────────────────────────────────────────
type Preset = '7d' | '30d' | 'month' | 'year' | 'custom';
function getRange(preset: Preset): { start: string; end: string } {
  const now = new Date();
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  if (preset === '7d')    return { start: fmt(new Date(now.getTime() - 7 * 86400000)), end: fmt(now) };
  if (preset === '30d')   return { start: fmt(new Date(now.getTime() - 30 * 86400000)), end: fmt(now) };
  if (preset === 'month') return { start: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), end: fmt(now) };
  if (preset === 'year')  return { start: fmt(new Date(now.getFullYear(), 0, 1)), end: fmt(now) };
  return { start: fmt(new Date(now.getFullYear(), now.getMonth(), 1)), end: fmt(now) };
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminReportsPage() {
  const [report, setReport]   = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset]   = useState<Preset>('30d');
  const [range, setRange]     = useState(getRange('30d'));
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders'>('overview');

  const loadReport = async (r: { start: string; end: string }) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/reports/dashboard?startDate=${r.start}&endDate=${r.end}`);
      const data = await res.json();
      setReport(data.reports || null);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadReport(range); }, []);

  const applyPreset = (p: Preset) => {
    setPreset(p);
    if (p !== 'custom') {
      const r = getRange(p);
      setRange(r);
      loadReport(r);
    }
  };

  const applyCustom = () => loadReport(range);

  // Derived
  const dailyChartData = useMemo(
    () => (report?.dailySales ?? []).map((d) => ({ label: d.date, value: d.revenue })),
    [report],
  );
  const hourlyChartData = useMemo(
    () => (report?.hourlySales ?? []).map((d) => ({ label: d.hour, value: d.orders })),
    [report],
  );
  const categorySlices = useMemo(
    () => (report?.categoryBreakdown ?? []).map((c, i) => ({ label: c.name, value: c.revenue, color: COLORS[i % COLORS.length] })),
    [report],
  );
  const sparkData = useMemo(() => (report?.dailySales ?? []).map((d) => d.revenue), [report]);

  const totalCatRevenue = report?.categoryBreakdown.reduce((a, c) => a + c.revenue, 0) || 1;

  return (
    <div className="space-y-6 pb-12">

      {/* ── Header row ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Analytics Dashboard</h1>
          <p className="text-xs text-slate-400 mt-0.5 font-semibold">Real‑time sales insights &amp; performance</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Preset buttons */}
          {(['7d','30d','month','year','custom'] as Preset[]).map((p) => (
            <button key={p}
              onClick={() => applyPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition border ${
                preset === p
                  ? 'text-white border-transparent'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
              }`}
              style={preset === p ? { background: BRAND } : {}}>
              {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === 'month' ? 'This Month' : p === 'year' ? 'This Year' : 'Custom'}
            </button>
          ))}
          {/* Custom range */}
          {preset === 'custom' && (
            <>
              <input type="date" value={range.start}
                onChange={(e) => setRange((r) => ({ ...r, start: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 bg-white" />
              <span className="text-slate-400 text-xs">→</span>
              <input type="date" value={range.end}
                onChange={(e) => setRange((r) => ({ ...r, end: e.target.value }))}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 bg-white" />
              <button onClick={applyCustom}
                className="px-3 py-1.5 rounded-lg text-xs font-black text-white transition"
                style={{ background: BRAND }}>Apply</button>
            </>
          )}
          {/* Export */}
          <a href="/api/reports/export" download
            className="ml-2 px-4 py-1.5 rounded-lg text-xs font-black text-white flex items-center gap-1.5 transition hover:opacity-90"
            style={{ background: BRAND }}>
            ⬇ Export CSV
          </a>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: BRAND, borderTopColor: 'transparent' }} />
        </div>
      ) : !report ? (
        <div className="text-center text-slate-400 py-24 font-bold">No data found for the selected period.</div>
      ) : (
        <>
          {/* ── KPI cards ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Total Revenue"  value={fmt(report.totalSales)}  sub={`${report.salesGrowth >= 0 ? '▲' : '▼'} ${Math.abs(report.salesGrowth).toFixed(1)}% vs prev period`} positive={report.salesGrowth >= 0} sparkData={sparkData} />
            <KpiCard label="Total Orders"   value={report.totalOrders.toString()} sub={`Avg ${fmt(report.avgOrder)} / order`} positive />
            <KpiCard label="Avg Order Value" value={fmt(report.avgOrder)} sub="Per completed order" />
            <KpiCard label="Top Category"   value={report.categoryBreakdown[0]?.name ?? '—'} sub={report.categoryBreakdown[0] ? fmt(report.categoryBreakdown[0].revenue) + ' revenue' : ''} />
          </div>

          {/* ── Tab nav ────────────────────────────────────────────────────── */}
          <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            {(['overview','products','orders'] as const).map((t) => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-5 py-2 rounded-lg text-xs font-black capitalize transition ${activeTab === t ? 'text-white shadow' : 'text-slate-500 hover:text-slate-800'}`}
                style={activeTab === t ? { background: BRAND } : {}}>
                {t}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ───────────────────────────────────────────────── */}
          {activeTab === 'overview' && (
            <div className="space-y-6">

              {/* Sales trend */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-black text-slate-800">Daily Revenue Trend</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Revenue per day in selected period</p>
                  </div>
                  <span className="text-xs font-black px-3 py-1 rounded-full" style={{ background: BRAND_LIGHT, color: BRAND }}>
                    {report.dailySales.length} days
                  </span>
                </div>
                {report.dailySales.length > 0 ? (
                  <BarChart data={dailyChartData} height={140} />
                ) : (
                  <p className="text-slate-400 text-sm text-center py-10">No daily data for this period.</p>
                )}
                {/* X-axis labels (first / last) */}
                {report.dailySales.length > 1 && (
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-slate-400">{fmtD(report.dailySales[0].date)}</span>
                    <span className="text-[10px] text-slate-400">{fmtD(report.dailySales[report.dailySales.length - 1].date)}</span>
                  </div>
                )}
              </div>

              {/* Category donut + hourly heatmap */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Donut */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <h3 className="font-black text-slate-800 mb-4">Revenue by Category</h3>
                  <div className="flex gap-6 items-center">
                    <DonutChart slices={categorySlices} />
                    <div className="flex flex-col gap-2 flex-1 min-w-0">
                      {report.categoryBreakdown.slice(0, 6).map((c, i) => (
                        <div key={i} className="flex items-center gap-2 min-w-0">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                          <span className="text-xs text-slate-600 font-semibold truncate flex-1">{c.name}</span>
                          <span className="text-xs font-black text-slate-800 flex-shrink-0">
                            {((c.revenue / totalCatRevenue) * 100).toFixed(0)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hourly order distribution */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                  <h3 className="font-black text-slate-800 mb-1">Orders by Hour</h3>
                  <p className="text-xs text-slate-400 mb-4">Peak ordering time distribution</p>
                  <BarChart data={hourlyChartData} height={120} />
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-slate-400">12 AM</span>
                    <span className="text-[10px] text-slate-400">12 PM</span>
                    <span className="text-[10px] text-slate-400">11 PM</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PRODUCTS TAB ───────────────────────────────────────────────── */}
          {activeTab === 'products' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Top Products table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="font-black text-slate-800">Top Products by Quantity</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Best‑selling items in selected period</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-400 font-black uppercase tracking-wider bg-slate-50">
                        <th className="px-5 py-3">#</th>
                        <th className="px-5 py-3">Product</th>
                        <th className="px-5 py-3 text-right">Qty</th>
                        <th className="px-5 py-3 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.bestSellers.map((p, i) => (
                        <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/60 transition">
                          <td className="px-5 py-3.5 text-xs font-black text-slate-400">{i + 1}</td>
                          <td className="px-5 py-3.5 font-semibold text-slate-800">{p.name}</td>
                          <td className="px-5 py-3.5 text-right font-black text-slate-700">{p.quantity}</td>
                          <td className="px-5 py-3.5 text-right font-black" style={{ color: BRAND }}>{fmt(p.revenue)}</td>
                        </tr>
                      ))}
                      {report.bestSellers.length === 0 && (
                        <tr><td colSpan={4} className="text-center py-10 text-slate-400">No product data</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Category revenue table */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="font-black text-slate-800">Category Performance</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Revenue &amp; quantity per category</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-slate-400 font-black uppercase tracking-wider bg-slate-50">
                        <th className="px-5 py-3">Category</th>
                        <th className="px-5 py-3 text-right">Items Sold</th>
                        <th className="px-5 py-3 text-right">Revenue</th>
                        <th className="px-5 py-3 text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.categoryBreakdown.map((c, i) => (
                        <tr key={i} className="border-t border-slate-50 hover:bg-slate-50/60 transition">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                              <span className="font-semibold text-slate-800">{c.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right font-bold text-slate-600">{c.qty}</td>
                          <td className="px-5 py-3.5 text-right font-black" style={{ color: BRAND }}>{fmt(c.revenue)}</td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${(c.revenue / totalCatRevenue) * 100}%`, background: COLORS[i % COLORS.length] }} />
                              </div>
                              <span className="text-xs font-black text-slate-500 w-8 text-right">
                                {((c.revenue / totalCatRevenue) * 100).toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {report.categoryBreakdown.length === 0 && (
                        <tr><td colSpan={4} className="text-center py-10 text-slate-400">No category data</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── ORDERS TAB ─────────────────────────────────────────────────── */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-800">Top Orders</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Highest‑value completed orders</p>
                </div>
                <span className="text-xs font-black px-3 py-1 rounded-full" style={{ background: BRAND_LIGHT, color: BRAND }}>
                  Top {report.topOrders.length}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-400 font-black uppercase tracking-wider bg-slate-50">
                      <th className="px-5 py-3">Order #</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3 text-center">Items</th>
                      <th className="px-5 py-3">Date &amp; Time</th>
                      <th className="px-5 py-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.topOrders.map((o, i) => (
                      <tr key={o.id} className="border-t border-slate-50 hover:bg-slate-50/60 transition">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-400">#{i + 1}</span>
                            <span className="font-black text-slate-800">#{o.number}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs font-black px-2.5 py-1 rounded-full capitalize" style={{ background: BRAND_LIGHT, color: BRAND }}>
                            {o.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center font-bold text-slate-600">{o.itemCount}</td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs">
                          {new Date(o.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-3.5 text-right font-black text-lg" style={{ color: BRAND }}>{fmt(o.total)}</td>
                      </tr>
                    ))}
                    {report.topOrders.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-10 text-slate-400">No orders in this period</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </>
      )}
    </div>
  );
}
