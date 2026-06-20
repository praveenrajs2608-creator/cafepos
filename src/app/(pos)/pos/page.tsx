'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { calculateOrderTotals } from '@/lib/pricing';
import ProductGrid from '@/components/pos/ProductGrid';
import Cart from '@/components/pos/Cart';
import FloorPopup from '@/components/pos/FloorPopup';
import PromoSelector from '@/components/pos/PromoSelector';
import PaymentPanel from '@/components/pos/PaymentPanel';
import OrderSummary from '@/components/pos/OrderSummary';

interface Table {
  id: string;
  name: string;
}

interface AppliedCoupon {
  code: string;
  type: 'PERCENTAGE' | 'FLAT';
  discount: number;
  minSpend: number;
}

interface CustomerInfo {
  name: string;
  phone: string;
  email?: string;
}

export default function POSRegisterPage() {
  const { items, addToCart, updateQuantity, addNote, clearCart, removeFromCart } = useCart();
  const { orders } = useRealtimeOrders();

  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [activeCoupon, setActiveCoupon] = useState<AppliedCoupon | null>(null);

  const [activeSession, setActiveSession] = useState<{ id: string } | null>(null);

  // Fetch active POSSession on mount or create one if none exists
  useEffect(() => {
    fetch('/api/pos-sessions')
      .then((res) => res.json())
      .then((data) => {
        if (data.activeSession) {
          setActiveSession(data.activeSession);
        } else {
          // Auto create a session for testing
          fetch('/api/pos-sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startCash: 100 }),
          })
            .then((res) => res.json())
            .then((resData) => {
              if (resData.session) {
                setActiveSession(resData.session);
              }
            });
        }
      });
  }, []);


  const [showTableModal, setShowTableModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const pricingItems = items.map((i) => ({ id: i.id, price: i.price, quantity: i.quantity }));
  const totals = calculateOrderTotals(pricingItems, activeCoupon);

  // ─── BroadcastChannel for same-machine tab communication ────────────────────
  const bcRef = React.useRef<BroadcastChannel | null>(null);
  const latestStateRef = React.useRef<any>({
    view: 'cart',
    payload: { items: [], subtotal: 0, tax: 0, discount: 0, total: 0 }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const bc = new BroadcastChannel('cafe-pos-display');
    bcRef.current = bc;

    bc.onmessage = (event: MessageEvent<any>) => {
      if (event.data === 'REQUEST_SYNC') {
        if (latestStateRef.current) {
          bc.postMessage(latestStateRef.current);
        }
      }
    };

    return () => bc.close();
  }, []);

  const broadcastStateToDisplay = (state: any) => {
    latestStateRef.current = state;
    // 1. BroadcastChannel — instant, same-machine tab communication (no Pusher needed)
    if (bcRef.current) {
      bcRef.current.postMessage(state);
    }
    // 2. Also POST to server so Pusher fires for remote/separate-machine displays
    if (activeSession) {
      fetch(`/api/pos-sessions/${activeSession.id}/display-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(state),
      }).catch(() => { /* non-fatal */ });
    }
  };

  // Broadcast cart update to Customer Facing Display whenever items/totals change
  useEffect(() => {
    if (isCompleting) return;

    if (!showPaymentModal) {
      const displayLines = items.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
      }));
      broadcastStateToDisplay({
        view: 'cart',
        payload: {
          items: displayLines,
          subtotal: totals.subtotal,
          tax: totals.tax,
          discount: totals.discount,
          total: totals.total,
        },
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, totals, showPaymentModal, isCompleting]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  /**
   * Create order + pay.
   * Payment handler server-side dispatches to KDS via Pusher (order.sent on kds channel).
   * KDS ticket only appears after payment — never before.
   */
  const handlePay = async (method: string, amount: number, customerInfo: CustomerInfo) => {
    try {
      // 1. Create order (with customer info)
      const orderRes = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: selectedTable?.id || undefined,
          sessionId: activeSession?.id || undefined,
          items: items.map((i) => ({
            productId: i.id,
            quantity: i.quantity,
            price: i.price,
            note: i.note,
          })),
          type: selectedTable ? 'DINE_IN' : 'TAKE_AWAY',
          couponCode: activeCoupon?.code || undefined,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          customerEmail: customerInfo.email,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        showToast(orderData.error || 'Failed to create order', 'error');
        return;
      }

      const orderId = orderData.order.id;

      // 2. Pay → server-side fires kds Pusher event
      const payRes = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, amount, customerEmail: customerInfo.email }),
      });

      const payData = await payRes.json();
      if (!payRes.ok) {
        showToast(payData.error || 'Payment failed', 'error');
        return;
      }

      setIsCompleting(true);
      broadcastStateToDisplay({
        view: 'completion',
        payload: { total: totals.total },
      });

      clearCart();
      setSelectedTable(null);
      setActiveCoupon(null);
      setShowPaymentModal(false);
      showToast(`✓ Order #${payData.order.number} paid — ticket sent to kitchen!`);

      setTimeout(() => {
        setIsCompleting(false);
      }, 5000);
    } catch (e) {
      console.error(e);
      showToast('Network error — please try again', 'error');
    }
  };

  return (
    <div className="h-[calc(100vh-64px)] flex overflow-hidden bg-slate-50 relative">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl font-bold text-sm shadow-2xl transition-all
          ${toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Product grid */}
      <div className="flex-1 flex flex-col p-6 overflow-hidden gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Checkout Register</h1>
            <p className="text-xs text-slate-400 mt-0.5">Build the order, then proceed to payment</p>
          </div>
          <div className="flex gap-3">
            {activeSession && (
              <a
                href={`/customer-display/${activeSession.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-xl transition shadow-sm flex items-center gap-1.5"
              >
                🖥️ Customer Display
              </a>
            )}
            <button
              onClick={() => setShowTableModal(true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl transition shadow-sm"
            >
              {selectedTable ? `Table: ${selectedTable.name}` : 'Assign Table'}
            </button>
          </div>
        </div>

        <ProductGrid onAddToCart={addToCart} />
      </div>

      {/* Order history */}
      <div className="w-[300px] border-l border-slate-200 bg-white p-4">
        <OrderSummary orders={orders} onSelectOrder={() => {}} />
      </div>

      {/* Cart */}
      <Cart
        items={items}
        tableName={selectedTable ? `Table: ${selectedTable.name}` : 'Take Away'}
        onUpdateQuantity={updateQuantity}
        onAddNote={addNote}
        onRemoveItem={removeFromCart}
        onOpenDiscount={() => setShowPromoModal(true)}
        onOpenPayment={() => {
          setShowPaymentModal(true);
          // Immediately push payment view to customer display
          broadcastStateToDisplay({
            view: 'payment',
            payload: {
              method: 'CASH',
              amount: totals.total,
            },
          });
        }}
        discountAmount={totals.discount}
        subtotal={totals.subtotal}
        tax={totals.tax}
        total={totals.total}
      />

      {/* Coupon indicator on cart if applied */}
      {activeCoupon && (
        <div className="fixed bottom-4 right-[435px] z-40 bg-green-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
          🏷️ {activeCoupon.code} applied
          <button onClick={() => setActiveCoupon(null)} className="hover:opacity-75">×</button>
        </div>
      )}

      {showTableModal && <FloorPopup onSelectTable={setSelectedTable} onClose={() => setShowTableModal(false)} />}

      {showPromoModal && (
        <PromoSelector
          subtotal={totals.subtotal}
          onApplyCoupon={setActiveCoupon}
          appliedCode={activeCoupon?.code}
          onClose={() => setShowPromoModal(false)}
        />
      )}

      {showPaymentModal && (
        <PaymentPanel
          total={totals.total}
          onPay={handlePay}
          onClose={() => setShowPaymentModal(false)}
          onMethodChange={(method) => {
            broadcastStateToDisplay({
              view: 'payment',
              payload: {
                method,
                amount: totals.total,
                upiId: method === 'UPI' ? (process.env.NEXT_PUBLIC_UPI_ID || 'merchant@upi') : undefined,
              },
            });
          }}
        />
      )}
    </div>
  );
}
