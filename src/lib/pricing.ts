export interface CartItem {
  id: string;
  price: number;          // base product price
  quantity: number;
  variantDelta?: number;  // priceDelta from selected variant
  addonDeltas?: number[]; // priceDelta[] from selected addons
}

export interface CouponDetails {
  type: 'PERCENTAGE' | 'FLAT';
  discount: number;
  minSpend: number;
}

/** Effective unit price = base + variant delta + sum(addon deltas) */
export function effectivePrice(item: CartItem): number {
  const variant = item.variantDelta ?? 0;
  const addons = (item.addonDeltas ?? []).reduce((a, b) => a + b, 0);
  return item.price + variant + addons;
}

export function calculateOrderTotals(
  items: CartItem[],
  coupon: CouponDetails | null,
  taxRate: number = 0.05 // 5% GST (matches mockup)
) {
  const subtotal = items.reduce((acc, item) => acc + effectivePrice(item) * item.quantity, 0);

  let discount = 0;
  if (coupon && subtotal >= coupon.minSpend) {
    if (coupon.type === 'PERCENTAGE') {
      discount = subtotal * (coupon.discount / 100);
    } else if (coupon.type === 'FLAT') {
      discount = coupon.discount;
    }
  }

  discount = Math.min(discount, subtotal);

  const taxableAmount = subtotal - discount;
  const tax = taxableAmount * taxRate;
  const total = taxableAmount + tax;

  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    discount: parseFloat(discount.toFixed(2)),
    tax: parseFloat(tax.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };
}
