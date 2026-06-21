'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Pusher from 'pusher-js';
import { calculateOrderTotals } from '@/lib/pricing';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Variant   { id: string; name: string; priceDelta: number }
interface Addon     { id: string; name: string; priceDelta: number }
interface Category  { id: string; name: string; color?: string | null }

interface Product {
  id: string; name: string; price: number;
  image?: string | null; description?: string | null;
  categoryId: string;
  variants: Variant[];
  addons: Addon[];
}

interface CartAddon { id: string; name: string; priceDelta: number }

interface CartLine {
  cartKey: string;      // unique per product+variant combination
  product: Product;
  quantity: number;
  variant?: Variant | null;
  addons: CartAddon[];
  unitPrice: number;    // base + variantDelta + addonDeltas
}

interface AppliedCoupon {
  code: string;
  type: 'PERCENTAGE' | 'FLAT';
  discount: number;
  minSpend: number;
}

interface Promotion {
  id: string; name: string; description?: string | null;
  discount: number; type: string; minOrderAmount?: number | null;
}

interface Order { id: string; number: number; total: number; status: string; tableId?: string | null }
interface TrackedItem { id: string; kitchenStage: string; product: { name: string }; quantity: number }
interface TrackedOrder extends Order { items?: TrackedItem[] }

type Screen = 'landing' | 'menu' | 'detail' | 'cart' | 'confirmed' | 'tracking';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STAGE_LABEL: Record<string, string> = {
  TO_COOK: 'To Cook', PREPARING: 'Preparing', COMPLETED: 'Completed',
};
const STAGE_COLOR: Record<string, string> = {
  TO_COOK: 'bg-amber-400 text-amber-900',
  PREPARING: 'bg-blue-500 text-white',
  COMPLETED: 'bg-emerald-500 text-white',
};

const LS_KEY = (tableId: string) => `self_orders_${tableId}`;

function loadOrderIds(tableId: string): string[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY(tableId)) || '[]'); }
  catch { return []; }
}
function saveOrderId(tableId: string, orderId: string) {
  const ids = loadOrderIds(tableId);
  if (!ids.includes(orderId)) { ids.push(orderId); localStorage.setItem(LS_KEY(tableId), JSON.stringify(ids)); }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SelfOrderPage({ params }: { params: { token: string } }) {
  // ── Global state ────────────────────────────────────────────────────────────
  const [screen, setScreen] = useState<Screen>('landing');
  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState<{ id: string; name: string; floor: { name: string } } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [config, setConfig] = useState<{ brandName: string; brandColor: string; logoUrl?: string | null }>({
    brandName: 'Cafe', brandColor: '#7c3aed',
  });
  const [cart, setCart] = useState<CartLine[]>([]);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [trackedOrders, setTrackedOrders] = useState<TrackedOrder[]>([]);

  // ── Menu state ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  // ── Detail state ────────────────────────────────────────────────────────────
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailVariant, setDetailVariant] = useState<Variant | null>(null);
  const [detailAddons, setDetailAddons] = useState<CartAddon[]>([]);
  const [detailQty, setDetailQty] = useState(1);

  // ── Cart state ──────────────────────────────────────────────────────────────
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [couponError, setCouponError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Pusher ref ──────────────────────────────────────────────────────────────
  const pusherRef = useRef<Pusher | null>(null);

  // ── Load on mount ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/self-order/${params.token}`)
      .then((r) => r.json())
      .then((d) => {
        if (!d.table) { setLoading(false); return; }
        setTable(d.table);
        setProducts(d.products || []);
        setCategories(d.categories || []);
        if (d.config) setConfig(d.config);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch('/api/promotions?active=true')
      .then((r) => r.json())
      .then((d) => setPromotions(d.promotions || []));
  }, [params.token]);

  // ── Tracking: subscribe to Pusher + load saved orders ────────────────────────
  const loadTracking = useCallback(async () => {
    if (!table) return;
    const ids = loadOrderIds(table.id);
    const orders = await Promise.all(ids.map((id) =>
      fetch(`/api/orders/${id}/status`).then((r) => r.json()).then((d) => d.order).catch(() => null)
    ));
    setTrackedOrders(orders.filter(Boolean));
  }, [table]);

  useEffect(() => {
    if (screen !== 'tracking' || !table) return;
    loadTracking();

    // Subscribe to Pusher table channel for live status
    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY || 'pusher-key-placeholder';
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'mt1';
    if (!pusherRef.current) {
      pusherRef.current = new Pusher(pusherKey, { cluster });
    }
    const channel = pusherRef.current.subscribe(`table-${table.id}`);
    channel.bind('order.stage-update', (data: any) => {
      setTrackedOrders((prev) => prev.map((o) =>
        o.id === data.orderId
          ? { ...o, items: o.items?.map((item) => item.id === data.itemId ? { ...item, kitchenStage: data.stage } : item) || o.items, status: data.orderStatus || o.status }
          : o
      ));
    });

    return () => {
      pusherRef.current?.unsubscribe(`table-${table.id}`);
    };
  }, [screen, table, loadTracking]);

  // ── Cart helpers ─────────────────────────────────────────────────────────────
  const totalItems = cart.reduce((a, l) => a + l.quantity, 0);
  const pricingItems = cart.map((l) => ({
    id: l.cartKey, price: l.product.price, quantity: l.quantity,
    variantDelta: l.variant?.priceDelta,
    addonDeltas: l.addons.map((a) => a.priceDelta),
  }));
  const totals = calculateOrderTotals(pricingItems, appliedCoupon);

  const openDetail = (p: Product) => {
    setDetailProduct(p);
    setDetailVariant(p.variants[0] ?? null);
    setDetailAddons([]);
    setDetailQty(1);
    setScreen('detail');
  };

  const addToCart = () => {
    if (!detailProduct) return;
    const variantDelta = detailVariant?.priceDelta ?? 0;
    const addonSum = detailAddons.reduce((a, b) => a + b.priceDelta, 0);
    const unitPrice = parseFloat((detailProduct.price + variantDelta + addonSum).toFixed(2));
    const cartKey = `${detailProduct.id}__${detailVariant?.id ?? 'base'}__${detailAddons.map((a) => a.id).sort().join(',')}`;

    setCart((prev) => {
      const existing = prev.find((l) => l.cartKey === cartKey);
      if (existing) {
        return prev.map((l) => l.cartKey === cartKey ? { ...l, quantity: l.quantity + detailQty } : l);
      }
      return [...prev, {
        cartKey, product: detailProduct, quantity: detailQty,
        variant: detailVariant, addons: detailAddons, unitPrice,
      }];
    });
    setScreen('menu');
  };

  const updateCartQty = (cartKey: string, delta: number) => {
    setCart((prev) =>
      prev.map((l) => l.cartKey === cartKey ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l)
          .filter((l) => l.quantity > 0)
    );
  };

  // ── Coupon ───────────────────────────────────────────────────────────────────
  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError('');
    const res = await fetch(`/api/coupons?code=${couponInput.trim().toUpperCase()}`);
    const data = await res.json();
    if (!res.ok || !data.coupon) { setCouponError('Invalid or expired code'); return; }
    setAppliedCoupon({ code: data.coupon.code, type: data.coupon.type, discount: data.coupon.discount, minSpend: data.coupon.minSpend });
    setShowCouponModal(false);
    setCouponInput('');
  };

  const applyPromotion = (promo: Promotion) => {
    setAppliedCoupon({ code: `PROMO-${promo.id}`, type: promo.type as 'PERCENTAGE' | 'FLAT', discount: promo.discount, minSpend: promo.minOrderAmount ?? 0 });
    setShowCouponModal(false);
  };

  // ── Submit order ─────────────────────────────────────────────────────────────
  const submitOrder = async () => {
    if (!table || cart.length === 0) return;
    setSubmitting(true);
    try {
      const items = cart.map((l) => ({
        productId: l.product.id, quantity: l.quantity, price: l.product.price,
        variantName: l.variant?.name, variantDelta: l.variant?.priceDelta,
        addons: l.addons.map((a) => ({ name: a.name, priceDelta: a.priceDelta })),
      }));

      const body: any = { items };
      if (appliedCoupon && !appliedCoupon.code.startsWith('PROMO-')) body.couponCode = appliedCoupon.code;

      const res = await fetch(`/api/self-order/${params.token}/order`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Order failed'); return; }

      saveOrderId(table.id, data.order.id);
      setConfirmedOrder(data.order);
      setCart([]);
      setAppliedCoupon(null);
      setScreen('confirmed');
    } catch { alert('Network error'); }
    finally { setSubmitting(false); }
  };

  // ── Filtered products ────────────────────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = activeCategory === 'ALL' || p.categoryId === activeCategory;
    return matchSearch && matchCat;
  });

  const qtyInCart = (productId: string) => cart.filter((l) => l.product.id === productId).reduce((a, l) => a + l.quantity, 0);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!table) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-center">
      <div>
        <p className="text-4xl">❌</p>
        <h2 className="text-white font-black text-xl mt-4">Invalid Table QR</h2>
        <p className="text-slate-400 text-sm mt-1">Please ask staff for assistance.</p>
      </div>
    </div>
  );

  const brand = config.brandColor;

  // ── SCREEN: LANDING ─────────────────────────────────────────────────────────
  if (screen === 'landing') return (
    <div className="min-h-screen flex flex-col items-center justify-between p-8 relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${brand}ee 0%, ${brand}88 100%)` }}>
      <div />
      <div className="text-center space-y-6 z-10">
        <div className="w-32 h-32 rounded-3xl mx-auto bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl overflow-hidden">
          <Image src="/logo-1080.png" alt="Savora Atlas" width={120} height={120} className="object-contain" />
        </div>
        <div>
          <h1 className="text-4xl font-black text-white">{config.brandName}</h1>
          <p className="text-white/70 mt-2 font-semibold">{table.name} — {table.floor.name}</p>
        </div>
      </div>
      <div className="w-full z-10">
        <button onClick={() => setScreen('menu')}
          className="w-full py-5 rounded-2xl font-black text-lg transition active:scale-95"
          style={{ background: 'white', color: brand }}>
          Order Here
        </button>
      </div>
    </div>
  );

  // ── SCREEN: MENU ────────────────────────────────────────────────────────────
  if (screen === 'menu') return (
    <div className="min-h-screen bg-slate-900 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 sticky top-0 z-20 bg-slate-900">
        <button onClick={() => setScreen('landing')} className="text-slate-400 hover:text-white transition p-2">
          ← Back
        </button>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 transition" />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 px-4 pb-2 overflow-x-auto no-scrollbar">
        <button onClick={() => setActiveCategory('ALL')}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black transition
            ${activeCategory === 'ALL' ? 'text-white' : 'text-slate-400 bg-slate-800'}`}
          style={activeCategory === 'ALL' ? { background: brand } : {}}>
          All
        </button>
        {categories.map((cat) => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black transition
              ${activeCategory === cat.id ? 'text-white' : 'text-slate-400 bg-slate-800'}`}
            style={activeCategory === cat.id ? { background: cat.color || brand } : {}}>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product grid */}
      <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 p-4 pb-32">
        {filteredProducts.map((p) => {
          const qty = qtyInCart(p.id);
          return (
            <button key={p.id} onClick={() => openDetail(p)}
              className="relative bg-slate-800 rounded-2xl overflow-hidden text-left active:scale-95 transition">
              {/* Product image / placeholder */}
              <div className="w-full aspect-square bg-slate-700 flex items-center justify-center text-4xl">
                {p.image ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" /> : '🍽️'}
              </div>
              <div className="p-3">
                <p className="text-white font-bold text-sm leading-tight">{p.name}</p>
                <p className="text-purple-400 font-black text-sm mt-1">₹{p.price.toFixed(0)}</p>
              </div>
              {qty > 0 && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full text-white text-[10px] font-black flex items-center justify-center"
                  style={{ background: brand }}>
                  {qty}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Sticky footer */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-slate-900 border-t border-slate-700">
          <button onClick={() => setScreen('cart')}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl text-white font-black transition active:scale-95"
            style={{ background: brand }}>
            <span>{totalItems} QTY · Total ₹{totals.total.toFixed(0)}</span>
            <span>Next →</span>
          </button>
        </div>
      )}
    </div>
  );

  // ── SCREEN: PRODUCT DETAIL ───────────────────────────────────────────────────
  if (screen === 'detail' && detailProduct) {
    const variantDelta = detailVariant?.priceDelta ?? 0;
    const addonSum = detailAddons.reduce((a, b) => a + b.priceDelta, 0);
    const lineTotal = (detailProduct.price + variantDelta + addonSum) * detailQty;

    return (
      <div className="min-h-screen bg-slate-900 flex flex-col max-w-md mx-auto">
        <div className="p-4 flex items-center gap-3">
          <button onClick={() => setScreen('menu')} className="text-slate-400 hover:text-white p-2">← Back</button>
        </div>

        <div className="flex-1 overflow-y-auto pb-40">
          {/* Product image */}
          <div className="w-full aspect-video bg-slate-700 flex items-center justify-center text-6xl mx-auto overflow-hidden">
            {detailProduct.image
              ? <img src={detailProduct.image} alt={detailProduct.name} className="w-full h-full object-cover" />
              : '🍽️'}
          </div>

          <div className="p-5 space-y-5">
            <div>
              <h2 className="text-white font-black text-2xl">{detailProduct.name}</h2>
              <p className="text-purple-400 font-black text-xl mt-1">₹{detailProduct.price.toFixed(0)}</p>
              {detailProduct.description && <p className="text-slate-400 text-sm mt-2">{detailProduct.description}</p>}
            </div>

            {/* Variants */}
            {detailProduct.variants.length > 0 && (
              <div className="space-y-2">
                <p className="text-white font-black text-sm uppercase tracking-wider">Choose Variant</p>
                <div className="space-y-2">
                  {detailProduct.variants.map((v) => (
                    <label key={v.id} className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition
                      ${detailVariant?.id === v.id ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 bg-slate-800'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center
                          ${detailVariant?.id === v.id ? 'border-purple-500 bg-purple-500' : 'border-slate-500'}`}>
                          {detailVariant?.id === v.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-white font-semibold text-sm">{v.name}</span>
                      </div>
                      {v.priceDelta !== 0 && <span className="text-purple-400 font-black text-sm">+₹{v.priceDelta}</span>}
                      <input type="radio" className="sr-only" checked={detailVariant?.id === v.id}
                        onChange={() => setDetailVariant(v)} />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Addons */}
            {detailProduct.addons.length > 0 && (
              <div className="space-y-2">
                <p className="text-white font-black text-sm uppercase tracking-wider">Add-ons</p>
                <div className="space-y-2">
                  {detailProduct.addons.map((addon) => {
                    const checked = detailAddons.some((a) => a.id === addon.id);
                    return (
                      <label key={addon.id} className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition
                        ${checked ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 bg-slate-800'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center
                            ${checked ? 'border-purple-500 bg-purple-500' : 'border-slate-500'}`}>
                            {checked && <span className="text-white text-[10px] font-black">✓</span>}
                          </div>
                          <span className="text-white font-semibold text-sm">{addon.name}</span>
                        </div>
                        {addon.priceDelta > 0 && <span className="text-purple-400 font-black text-sm">+₹{addon.priceDelta}</span>}
                        <input type="checkbox" className="sr-only" checked={checked}
                          onChange={() => setDetailAddons((prev) =>
                            checked ? prev.filter((a) => a.id !== addon.id) : [...prev, { id: addon.id, name: addon.name, priceDelta: addon.priceDelta }]
                          )} />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity stepper */}
            <div className="flex items-center justify-between">
              <p className="text-white font-black">Quantity</p>
              <div className="flex items-center gap-4 bg-slate-800 rounded-xl px-4 py-2">
                <button onClick={() => setDetailQty((q) => Math.max(1, q - 1))}
                  className="text-white font-black text-xl w-8 text-center">−</button>
                <span className="text-white font-black text-lg w-6 text-center">{detailQty}</span>
                <button onClick={() => setDetailQty((q) => q + 1)}
                  className="text-white font-black text-xl w-8 text-center">+</button>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky add button */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-slate-900 border-t border-slate-700">
          <button onClick={addToCart}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl text-white font-black"
            style={{ background: brand }}>
            <span>{totalItems + detailQty} QTY · Total ₹{totals.total + lineTotal > 0 ? (totals.total + lineTotal).toFixed(0) : lineTotal.toFixed(0)}</span>
            <span>Next →</span>
          </button>
        </div>
      </div>
    );
  }

  // ── SCREEN: CART / PAYMENT ───────────────────────────────────────────────────
  if (screen === 'cart') return (
    <div className="min-h-screen bg-slate-900 flex flex-col max-w-md mx-auto">
      <div className="p-4 flex items-center gap-3 sticky top-0 bg-slate-900 z-10">
        <button onClick={() => setScreen('menu')} className="text-slate-400 hover:text-white p-2">← Back</button>
        <h2 className="text-white font-black text-lg">Payment</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-72">
        {/* Cart lines */}
        {cart.map((line) => (
          <div key={line.cartKey} className="bg-slate-800 rounded-2xl p-4 space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-white font-bold text-sm">{line.product.name}</p>
                {line.variant && <p className="text-slate-400 text-xs mt-0.5">{line.variant.name}</p>}
                {line.addons.length > 0 && (
                  <p className="text-slate-500 text-xs mt-0.5">{line.addons.map((a) => a.name).join(', ')}</p>
                )}
              </div>
              <div className="flex items-center gap-3 ml-4">
                <div className="flex items-center gap-2 bg-slate-700 rounded-xl px-3 py-1">
                  <button onClick={() => updateCartQty(line.cartKey, -1)} className="text-white font-black">−</button>
                  <span className="text-white font-black w-5 text-center text-sm">{line.quantity}</span>
                  <button onClick={() => updateCartQty(line.cartKey, +1)} className="text-white font-black">+</button>
                </div>
                <span className="text-white font-black text-sm w-14 text-right">
                  ₹{(line.unitPrice * line.quantity).toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Coupon */}
        <button onClick={() => setShowCouponModal(true)}
          className="flex items-center gap-2 text-purple-400 text-sm font-bold py-2">
          🏷️ Discount (Have a coupon code?)
          {appliedCoupon && <span className="text-emerald-400">— {appliedCoupon.code} applied</span>}
        </button>

        {/* Totals */}
        <div className="bg-slate-800 rounded-2xl p-4 space-y-2.5">
          {(([
            ['Sub Total', `₹${totals.subtotal.toFixed(0)}`],
            ['Tax (GST 5%)', `₹${totals.tax.toFixed(0)}`],
            appliedCoupon ? [`Discount (${appliedCoupon.discount}${appliedCoupon.type === 'PERCENTAGE' ? '%' : '₹'})`, `-₹${totals.discount.toFixed(0)}`] : null,
          ].filter(Boolean)) as string[][]).map(([label, value]) => (
            <div key={label} className="flex justify-between text-sm">
              <span className="text-slate-400">{label}</span>
              <span className="text-white font-bold">{value}</span>
            </div>
          ))}
          <div className="border-t border-slate-700 pt-2.5 flex justify-between">
            <span className="text-white font-black">Total</span>
            <span className="text-white font-black text-lg">₹{totals.total.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* Sticky Confirmed button */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-slate-900 border-t border-slate-700">
        <button onClick={submitOrder} disabled={submitting || cart.length === 0}
          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl text-white font-black transition disabled:opacity-50"
          style={{ background: brand }}>
          <span>{totalItems} QTY · Total ₹{totals.total.toFixed(0)}</span>
          <span>{submitting ? 'Placing…' : 'Confirmed'}</span>
        </button>
      </div>

      {/* Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-3xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-black text-lg">Coupon Code</h3>
              <button onClick={() => setShowCouponModal(false)} className="text-slate-400 hover:text-white text-xl">×</button>
            </div>

            <div className="flex gap-2">
              <input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Enter a coupon code"
                className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500" />
            </div>
            {couponError && <p className="text-red-400 text-xs font-bold">{couponError}</p>}

            {/* Promotions as radio rows */}
            {promotions.length > 0 && (
              <div className="space-y-2">
                {promotions.filter((p) => !p.minOrderAmount || totals.subtotal >= p.minOrderAmount).map((promo) => (
                  <button key={promo.id} onClick={() => applyPromotion(promo)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-slate-600 hover:border-purple-500 text-left transition">
                    <div className="w-4 h-4 rounded-full border-2 border-slate-500 flex items-center justify-center">
                      {appliedCoupon?.code === `PROMO-${promo.id}` && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">{promo.discount}{promo.type === 'PERCENTAGE' ? '%' : '₹'} Discount</p>
                      {promo.description && <p className="text-slate-400 text-xs">{promo.description}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <button onClick={applyCoupon} style={{ background: brand }}
              className="w-full py-3.5 rounded-xl text-white font-black">
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ── SCREEN: ORDER CONFIRMED ──────────────────────────────────────────────────
  if (screen === 'confirmed' && confirmedOrder) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-slate-900">
      {/* Animated checkmark */}
      <div className="w-28 h-28 rounded-full border-4 border-emerald-500 flex items-center justify-center mb-8 animate-pulse">
        <span className="text-emerald-500 text-5xl font-black">✓</span>
      </div>
      <h1 className="text-white font-black text-4xl">#{confirmedOrder.number}</h1>
      <p className="text-emerald-400 font-black text-xl mt-2">Order Confirmed</p>
      <p className="text-white font-black text-3xl mt-3">₹{confirmedOrder.total.toFixed(0)}</p>
      <p className="text-slate-400 text-sm mt-4 text-center font-semibold">
        Your order is being prepared! Pay at the counter when ready.
      </p>
      <button onClick={() => setScreen('tracking')}
        className="mt-10 px-8 py-4 rounded-2xl text-white font-black text-lg transition active:scale-95"
        style={{ background: brand, border: `2px solid ${brand}` }}>
        Track My Order
      </button>
    </div>
  );

  // ── SCREEN: ORDER TRACKING ───────────────────────────────────────────────────
  if (screen === 'tracking') return (
    <div className="min-h-screen bg-slate-900 flex flex-col max-w-md mx-auto">
      <div className="p-4 flex items-center gap-3 sticky top-0 bg-slate-900 z-10">
        <h2 className="text-white font-black text-xl flex-1">Order History</h2>
        <button onClick={() => setScreen('menu')} className="text-slate-400 text-sm font-bold hover:text-white">Menu</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {trackedOrders.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-bold">No orders yet</p>
          </div>
        ) : (
          [...trackedOrders].reverse().map((o) => {
            // Derive overall kitchen stage from items
            const stages = o.items?.map((i) => i.kitchenStage) || [];
            const displayStage = stages.every((s) => s === 'COMPLETED') ? 'COMPLETED'
              : stages.some((s) => s === 'PREPARING') ? 'PREPARING' : 'TO_COOK';

            return (
              <div key={o.id} className="bg-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-black">#{o.number}</p>
                  <p className="text-slate-400 text-xs mt-0.5">₹{o.total.toFixed(0)}</p>
                </div>
                <span className={`text-xs font-black px-3 py-1.5 rounded-full ${STAGE_COLOR[displayStage] ?? 'bg-slate-600 text-slate-200'}`}>
                  {STAGE_LABEL[displayStage] ?? o.status}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="p-4 border-t border-slate-700">
        <button onClick={() => setScreen('menu')} style={{ background: brand }}
          className="w-full py-4 rounded-2xl text-white font-black">
          ← Back to Menu
        </button>
      </div>
    </div>
  );

  return null;
}
