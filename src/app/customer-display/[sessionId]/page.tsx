'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DisplayState } from '@/types/display';
import UpiQrCode from '@/components/shared/UpiQrCode';

const IDLE_STATE: DisplayState = {
  view: 'cart',
  payload: { items: [], subtotal: 0, tax: 0, discount: 0, total: 0 },
};

export default function CustomerDisplayPage({ params }: { params: { sessionId: string } }) {
  const { sessionId } = params;
  const [state, setState] = useState<DisplayState>(IDLE_STATE);
  const [connected, setConnected] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  // ── Fetch initial display state on mount ───────────────────────────────────
  useEffect(() => {
    const decodedSessionId = decodeURIComponent(sessionId);
    if (!decodedSessionId || decodedSessionId === '{sessionId}' || decodedSessionId.startsWith('{')) {
      setIsValidSession(false);
      return;
    }

    fetch(`/api/pos-sessions/${decodedSessionId}/display-state`)
      .then((res) => {
        if (res.status === 404) {
          setIsValidSession(false);
          return null;
        }
        if (!res.ok) {
          throw new Error('Failed to fetch initial state');
        }
        setIsValidSession(true);
        return res.json();
      })
      .then((data) => {
        if (data && data.view) {
          setState(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load initial display state:', err);
        if (isValidSession === null) {
          setIsValidSession(true);
        }
      });
  }, [sessionId]);

  // ── BroadcastChannel: primary channel for same-machine communication ──────
  useEffect(() => {
    const bc = new BroadcastChannel('cafe-pos-display');
    setConnected(true);

    bc.onmessage = (event: MessageEvent<any>) => {
      if (event.data && typeof event.data === 'object' && 'view' in event.data) {
        setState(event.data);
      }
    };

    bc.onmessageerror = (err) => {
      console.error('BroadcastChannel message error:', err);
    };

    // Request sync from any open POS tab
    bc.postMessage('REQUEST_SYNC');

    // Also listen to Pusher if credentials are configured (remote displays)
    let pusherUnsub: (() => void) | null = null;
    const decodedSessionId = decodeURIComponent(sessionId);
    if (decodedSessionId && decodedSessionId !== '{sessionId}' && !decodedSessionId.startsWith('{')) {
      import('@/lib/pusher-client').then(({ pusherClient }) => {
        if (!pusherClient) return;
        const channelName = `customer-display-${decodedSessionId}`;
        const channel = pusherClient.subscribe(channelName);
        channel.bind('state.updated', (incomingState: DisplayState) => {
          setState(incomingState);
        });
        pusherUnsub = () => pusherClient.unsubscribe(channelName);
      });
    }

    return () => {
      bc.close();
      pusherUnsub?.();
    };
  }, [sessionId]);

  // ── Completion screen: auto-reset after 5 seconds ─────────────────────────
  useEffect(() => {
    if (state.view === 'completion') {
      const timer = setTimeout(() => setState(IDLE_STATE), 5000);
      return () => clearTimeout(timer);
    }
  }, [state.view]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const cartPayload = state.view === 'cart' ? state.payload : null;
  const payPayload = state.view === 'payment' ? state.payload : null;
  const donePayload = state.view === 'completion' ? state.payload : null;

  if (isValidSession === false) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6 font-sans">
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto text-3xl">
            ⚠️
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-100">Invalid Session ID</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              This customer display link is invalid or the session has ended.
            </p>
          </div>
          <div className="bg-slate-900/60 rounded-xl p-4 text-xs text-left text-slate-400 space-y-2 border border-slate-900">
            <p className="font-bold text-slate-300">How to fix this:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Open the POS Register page at <code className="text-purple-400">/pos</code></li>
              <li>Wait for the session to load (or create a new one)</li>
              <li>Click the <strong className="text-white">🖥️ Customer Display</strong> button to open the correct link</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex overflow-hidden">
      {/* ── Left: Branding ─────────────────────────────────────────────────── */}
      <div className="flex-1 bg-gradient-to-tr from-purple-900 via-indigo-950 to-slate-900 flex flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 z-10">
          <h1 className="text-3xl font-black text-white tracking-widest uppercase">☕ Cafe Gourmet</h1>
          {/* Live status dot */}
          <span className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} title={connected ? 'Live' : 'Connecting...'} />
        </div>

        <div className="space-y-5 max-w-lg z-10">
          {donePayload ? (
            <>
              <p className="text-6xl font-black leading-tight text-white">Thank you! 🎉</p>
              <p className="text-slate-300 text-xl">Your order is being prepared with love.</p>
            </>
          ) : payPayload ? (
            <>
              <p className="text-6xl font-black leading-tight text-white">Almost done!</p>
              <p className="text-slate-300 text-xl">Complete your payment to confirm the order.</p>
            </>
          ) : (
            <>
              <p className="text-6xl font-black leading-tight text-white">Welcome!</p>
              <p className="text-slate-300 text-xl leading-relaxed">
                We make delicious food with fresh, high-quality ingredients.
              </p>
            </>
          )}
        </div>

        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest z-10">
          Powered by Premium Cafe POS
        </p>
      </div>

      {/* ── Right: Live State ───────────────────────────────────────────────── */}
      <div className="w-[500px] bg-slate-950 flex flex-col p-10 border-l border-slate-900">

        {/* CART VIEW */}
        {cartPayload && (
          cartPayload.items.length > 0 ? (
            <div className="flex flex-col h-full justify-between">
              <div className="overflow-hidden flex flex-col">
                <div className="flex justify-between items-center pb-5 border-b border-slate-800 mb-4">
                  <h3 className="text-xl font-bold text-slate-100">Current Order</h3>
                  <span className="text-xs bg-purple-500/15 border border-purple-500/30 text-purple-300 px-3 py-1 font-black rounded-full uppercase">
                    {cartPayload.items.reduce((s, i) => s + i.quantity, 0)} items
                  </span>
                </div>

                <div className="space-y-3 overflow-y-auto flex-1 pr-1 max-h-[52vh]">
                  {cartPayload.items.map((item, idx) => (
                    <div key={item.id ?? idx} className="flex justify-between items-start py-2.5 border-b border-slate-900/60 last:border-0">
                      <div className="flex-1 min-w-0 pr-3">
                        <p className="font-bold text-slate-100 text-sm leading-snug truncate">{item.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {item.quantity} × ₹{item.price.toFixed(2)}
                        </p>
                      </div>
                      <span className="font-extrabold text-slate-200 text-sm whitespace-nowrap">
                        ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="space-y-3 pt-5 border-t border-slate-800 mt-4">
                <div className="flex justify-between text-slate-400 text-sm">
                  <span>Subtotal</span>
                  <span>₹{cartPayload.subtotal.toFixed(2)}</span>
                </div>
                {cartPayload.discount > 0 && (
                  <div className="flex justify-between text-emerald-400 text-sm font-bold">
                    <span>Discount</span>
                    <span>−₹{cartPayload.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400 text-sm">
                  <span>Tax (5% GST)</span>
                  <span>₹{cartPayload.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white font-black text-2xl pt-3 border-t border-slate-800">
                  <span>Total Due</span>
                  <span className="text-purple-400">₹{cartPayload.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
              <span className="text-7xl mb-6">👋</span>
              <p className="font-black text-2xl text-slate-200">Ready to serve you!</p>
              <p className="text-sm text-slate-400 mt-2 max-w-xs leading-relaxed">
                Your order items will appear here in real-time as the cashier adds them.
              </p>
            </div>
          )
        )}

        {/* PAYMENT VIEW */}
        {payPayload && (
          <div className="flex flex-col h-full justify-between">
            <div>
              <div className="pb-5 border-b border-slate-800 mb-6">
                <h3 className="text-xl font-bold text-slate-100">Payment in Progress</h3>
                <p className="text-xs text-slate-400 mt-1">Complete your transaction with the cashier</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Amount Due</p>
                <p className="text-4xl font-black text-purple-400">₹{payPayload.amount.toFixed(2)}</p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <span className="text-xs text-slate-400">Method:</span>
                  <span className="text-xs font-black bg-purple-500/15 border border-purple-500/30 text-purple-300 px-3 py-1 rounded-full uppercase tracking-wide">
                    {payPayload.method}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-slate-500 text-xs text-center pb-4">
              {payPayload.method === 'CASH' && '💵 Cashier is accepting cash payment.'}
              {payPayload.method === 'CARD' && '💳 Please tap/swipe your card on the terminal.'}
              {payPayload.method === 'UPI' && '📱 Scan the QR code to pay via any UPI app.'}
            </p>
          </div>
        )}

        {/* UPI QR OVERLAY */}
        {payPayload?.method === 'UPI' && (
          <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center z-50 p-8">
            <div className="bg-white rounded-3xl w-full max-w-sm p-7 shadow-2xl">
              <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
                <h4 className="text-slate-800 font-black text-lg">Scan & Pay</h4>
                <span className="text-sm font-extrabold text-purple-700 bg-purple-50 px-3 py-1 rounded-full">
                  ₹{payPayload.amount.toFixed(2)}
                </span>
              </div>
              <UpiQrCode
                upiId={payPayload.upiId || process.env.NEXT_PUBLIC_UPI_ID || 'merchant@upi'}
                amount={payPayload.amount}
                storeName={process.env.NEXT_PUBLIC_STORE_NAME || 'Cafe Gourmet'}
              />
              <p className="text-center text-[11px] text-slate-400 mt-4 font-semibold">
                Use Google Pay · PhonePe · Paytm · BHIM or any UPI app
              </p>
            </div>
          </div>
        )}

        {/* COMPLETION VIEW */}
        {donePayload && (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <div className="w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/10">
              <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h3 className="text-3xl font-black text-slate-100 mb-2">Payment Complete!</h3>
            <p className="text-slate-400 text-sm max-w-xs leading-relaxed">
              Thank you! Your payment of{' '}
              <span className="font-extrabold text-emerald-400">₹{donePayload.total.toFixed(2)}</span>{' '}
              was successful. Your order is heading to the kitchen!
            </p>
            <div className="mt-8 flex gap-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-2 h-2 rounded-full bg-emerald-400 opacity-70 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
