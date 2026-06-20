'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import KDSTopBar from '@/components/kds/KDSTopBar';
import KDSStats from '@/components/kds/KDSStats';
import KDSSidebar from '@/components/kds/KDSSidebar';
import TicketCard from '@/components/kds/TicketCard';
import { useKDSOrders, type KDSOrder } from '@/hooks/useKDSOrders';

type StageTab = 'ALL' | 'TO_COOK' | 'PREPARING' | 'COMPLETED';

const CARDS_PER_PAGE = 9;

function getOrderStage(order: KDSOrder): string {
  // All items advance together, so first item's kitchenStage = order stage
  return order.items[0]?.kitchenStage ?? 'TO_COOK';
}

export default function KitchenDisplayPage() {
  const { orders, setOrders, loading } = useKDSOrders();

  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Stage tab
  const [activeTab, setActiveTab] = useState<StageTab>('ALL');

  // Search
  const [searchRaw, setSearchRaw] = useState('');
  const [search, setSearch] = useState('');
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pagination
  const [page, setPage] = useState(1);

  // Sidebar filters
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Debounce search 250ms
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(searchRaw.trim().toLowerCase());
      setPage(1);
    }, 250);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchRaw]);

  // Derive unique products & categories from current orders (for sidebar filter lists)
  const { filterProducts, filterCategories } = useMemo(() => {
    const prodMap = new Map<string, { id: string; name: string }>();
    const catMap = new Map<string, { id: string; name: string }>();
    for (const order of orders) {
      for (const item of order.items) {
        if (item.product.kdsEnabled) {
          prodMap.set(item.product.id, { id: item.product.id, name: item.product.name });
          catMap.set(item.product.category.id, { id: item.product.category.id, name: item.product.category.name });
        }
      }
    }
    return {
      filterProducts: Array.from(prodMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
      filterCategories: Array.from(catMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    };
  }, [orders]);

  // Filter + search pipeline
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Stage tab filter
    if (activeTab !== 'ALL') {
      result = result.filter((o) => getOrderStage(o) === activeTab);
    }

    // Sidebar product filter
    if (selectedProducts.length > 0) {
      result = result.filter((o) =>
        o.items.some((i) => selectedProducts.includes(i.product.id) && i.product.kdsEnabled)
      );
    }

    // Sidebar category filter
    if (selectedCategories.length > 0) {
      result = result.filter((o) =>
        o.items.some((i) => selectedCategories.includes(i.product.category.id) && i.product.kdsEnabled)
      );
    }

    // Search (by order number or product name)
    if (search) {
      result = result.filter(
        (o) =>
          String(o.number).includes(search) ||
          o.items.some((i) => i.product.name.toLowerCase().includes(search))
      );
    }

    return result;
  }, [orders, activeTab, selectedProducts, selectedCategories, search]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / CARDS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pagedOrders = filteredOrders.slice((safePage - 1) * CARDS_PER_PAGE, safePage * CARDS_PER_PAGE);

  // Stage counts for tabs
  const counts = useMemo(() => {
    const all = orders.length;
    const toCook = orders.filter((o) => getOrderStage(o) === 'TO_COOK').length;
    const preparing = orders.filter((o) => getOrderStage(o) === 'PREPARING').length;
    const completed = orders.filter((o) => getOrderStage(o) === 'COMPLETED').length;
    return { all, toCook, preparing, completed };
  }, [orders]);

  // --- Interactions ---

  const handleAdvanceStage = useCallback(async (orderId: string) => {
    try {
      const res = await fetch(`/api/kds/orders/${orderId}/stage`, { method: 'PUT' });
      if (res.ok) {
        const data = await res.json();
        setOrders((prev) => prev.map((o) => (o.id === data.order.id ? data.order : o)));
      }
    } catch (e) {
      console.error('advance stage failed', e);
    }
  }, [setOrders]);

  const handleToggleItem = useCallback(async (itemId: string) => {
    try {
      const res = await fetch(`/api/kds/items/${itemId}`, { method: 'PUT' });
      if (res.ok) {
        const data = await res.json();
        if (data.order) {
          setOrders((prev) => prev.map((o) => (o.id === data.order.id ? data.order : o)));
        }
      }
    } catch (e) {
      console.error('toggle item failed', e);
    }
  }, [setOrders]);

  const handleToggleProduct = useCallback((id: string) => {
    setSelectedProducts((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    setPage(1);
  }, []);

  const handleToggleCategory = useCallback((id: string) => {
    setSelectedCategories((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    setPage(1);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSelectedProducts([]);
    setSelectedCategories([]);
    setPage(1);
  }, []);

  const TABS: { key: StageTab; label: string; count: number; color: string }[] = [
    { key: 'ALL',       label: 'All',       count: counts.all,       color: 'text-slate-700' },
    { key: 'TO_COOK',   label: 'To Cook',   count: counts.toCook,    color: 'text-amber-700' },
    { key: 'PREPARING', label: 'Preparing', count: counts.preparing,  color: 'text-blue-700' },
    { key: 'COMPLETED', label: 'Completed', count: counts.completed,  color: 'text-emerald-700' },
  ];

  return (
    <div className="h-screen bg-slate-50 text-slate-900 flex flex-col overflow-hidden">
      {/* Top bar */}
      <KDSTopBar onToggleSidebar={() => setSidebarOpen((v) => !v)} sidebarOpen={sidebarOpen} />

      {/* Stats row */}
      <KDSStats />

      {/* Stage tabs + search + pagination */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-100/50 border-b border-slate-200 flex-shrink-0 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide transition
              ${activeTab === tab.key
                ? 'bg-slate-600 text-slate-50 shadow-inner'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-200'}`}
          >
            {tab.label}
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center
              ${activeTab === tab.key ? `${tab.color} bg-slate-50` : 'bg-slate-200 text-slate-500'}`}>
              {tab.count}
            </span>
          </button>
        ))}

        {/* Search */}
        <div className="flex-1 max-w-xs ml-2 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={searchRaw}
            onChange={(e) => setSearchRaw(e.target.value)}
            placeholder="Search order # or product…"
            className="w-full bg-white border border-slate-200 rounded-full pl-8 pr-4 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition"
          />
        </div>

        {/* Pagination indicator */}
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-600 font-bold">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="w-6 h-6 rounded-lg hover:bg-slate-200 flex items-center justify-center disabled:opacity-30 transition"
          >‹</button>
          <span className="text-slate-600 min-w-[40px] text-center">
            {((safePage - 1) * CARDS_PER_PAGE) + 1}–{Math.min(safePage * CARDS_PER_PAGE, filteredOrders.length)}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="w-6 h-6 rounded-lg hover:bg-slate-200 flex items-center justify-center disabled:opacity-30 transition"
          >›</button>
        </div>
      </div>

      {/* Body: sidebar + board */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <KDSSidebar
          open={sidebarOpen}
          products={filterProducts}
          categories={filterCategories}
          selectedProducts={selectedProducts}
          selectedCategories={selectedCategories}
          onToggleProduct={handleToggleProduct}
          onToggleCategory={handleToggleCategory}
          onClearFilters={handleClearFilters}
        />

        {/* Main ticket board */}
        <main className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-slate-500 text-sm font-bold">Loading kitchen orders…</p>
              </div>
            </div>
          ) : pagedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 pb-20">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-3xl">
                {activeTab === 'COMPLETED' ? '✅' : '🍳'}
              </div>
              <div>
                <p className="text-slate-900 font-black text-base">
                  {activeTab === 'COMPLETED' ? 'No completed tickets yet' : 'All caught up!'}
                </p>
                <p className="text-slate-600 text-sm mt-1">
                  {search
                    ? `No tickets match "${searchRaw}"`
                    : activeTab === 'ALL'
                    ? 'Waiting for orders from the POS…'
                    : `No tickets in "${activeTab === 'TO_COOK' ? 'To Cook' : activeTab === 'PREPARING' ? 'Preparing' : 'Completed'}" stage`}
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 auto-rows-min">
              {pagedOrders.map((order) => (
                <TicketCard
                  key={order.id}
                  order={order}
                  onAdvanceStage={handleAdvanceStage}
                  onToggleItem={handleToggleItem}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
