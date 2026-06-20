import { calculateOrderTotals, CartItem, CouponDetails } from '@/lib/pricing';

export class PricingService {
  static calculate(items: CartItem[], coupon: CouponDetails | null) {
    return calculateOrderTotals(items, coupon);
  }
}
