import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderService } from '@/server/services/order.service';
import { prisma } from '@/lib/prisma';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    coupon: { findUnique: vi.fn() },
    customer: { upsert: vi.fn() },
    order: { count: vi.fn(), create: vi.fn(), update: vi.fn() },
    product: { findUnique: vi.fn(), findMany: vi.fn() },
  },
}));

vi.mock('@/lib/pusher-server', () => ({
  pusherServer: { trigger: vi.fn() },
}));

describe('OrderService.createOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.order.count as any).mockResolvedValue(5);
    (prisma.order.create as any).mockImplementation((args: any) => Promise.resolve({ id: 'order-123', ...args.data }));
  });

  it('1. should calculate normal order correctly', async () => {
    (prisma.product.findUnique as any).mockImplementation(({ where }: any) => {
      if (where.id === 'prod-1') return Promise.resolve({ id: 'prod-1', price: 100 });
      if (where.id === 'prod-2') return Promise.resolve({ id: 'prod-2', price: 50 });
      return Promise.resolve(null);
    });

    const payload = {
      type: 'DINE_IN' as const,
      items: [
        { productId: 'prod-1', quantity: 2, price: 100 }, // subtotal 200
        { productId: 'prod-2', quantity: 1, price: 50 },  // subtotal 50 => total subtotal 250
      ],
    };

    const order = await OrderService.createOrder(payload);

    // subtotal = 250
    // discount = 0
    // tax = 250 * 0.08 = 20
    // total = 250 + 20 = 270
    expect(order.subtotal).toBe(250);
    expect(order.tax).toBe(20);
    expect(order.total).toBe(270);
  });

  it('2. VULNERABILITY: should not allow negative quantities', async () => {
    // A malicious user submits a negative quantity to reduce the total price
    const payload = {
      type: 'DINE_IN' as const,
      items: [
        { productId: 'cheap-prod', quantity: -10, price: 100 }, // -1000
        { productId: 'expensive-prod', quantity: 1, price: 1000 },
      ],
    };

    // If vulnerability is fixed, this should throw an error.
    // Since we are writing the test BEFORE fixing it, we expect it to throw an error,
    // which means the test will FAIL if the vulnerability still exists.
    await expect(OrderService.createOrder(payload)).rejects.toThrow(/quantity/i);
  });

  it('3. VULNERABILITY: should not trust client-provided prices', async () => {
    // Malicious user sends a price of 1 for a 1000 item.
    // For this test, we must mock the DB returning the REAL price.
    (prisma.product.findUnique as any).mockResolvedValue(
      { id: 'prod-1', price: 1000 }
    );

    const payload = {
      type: 'DINE_IN' as const,
      items: [
        { productId: 'prod-1', quantity: 1, price: 1 }, // Trying to spoof price
      ],
    };

    const order = await OrderService.createOrder(payload);
    
    // The service should use the DB price (1000), not the spoofed price (1).
    expect(order.subtotal).toBe(1000);
  });

  it('4. VULNERABILITY: should not allow negative total with flat discount', async () => {
    (prisma.product.findUnique as any).mockResolvedValue({ id: 'prod-1', price: 50 });

    // Subtotal = 50. Coupon gives 100 OFF.
    (prisma.coupon.findUnique as any).mockResolvedValue({
      id: 'coupon-1',
      code: 'FLAT100',
      type: 'FLAT',
      discount: 100,
      minSpend: 0,
      isActive: true,
      expiry: new Date(Date.now() + 100000), // Valid
    });

    const payload = {
      type: 'DINE_IN' as const,
      couponCode: 'FLAT100',
      items: [
        { productId: 'prod-1', quantity: 1, price: 50 },
      ],
    };

    const order = await OrderService.createOrder(payload);

    // subtotal = 50, discount = 100
    // total should floor at 0. It should NOT be -50.
    expect(order.total).toBeGreaterThanOrEqual(0);
    expect(order.discount).toBeLessThanOrEqual(50); // Discount shouldn't exceed subtotal
    expect(order.tax).toBe(0); // Tax on 0 should be 0, not negative
  });

  it('5. VULNERABILITY: should reject expired coupons', async () => {
    (prisma.product.findUnique as any).mockResolvedValue({ id: 'prod-1', price: 100 });

    (prisma.coupon.findUnique as any).mockResolvedValue({
      id: 'coupon-1',
      code: 'EXPIRED10',
      type: 'PERCENTAGE',
      discount: 10,
      minSpend: 0,
      isActive: true,
      expiry: new Date(Date.now() - 100000), // EXPIRED in the past
    });

    const payload = {
      type: 'DINE_IN' as const,
      couponCode: 'EXPIRED10',
      items: [
        { productId: 'prod-1', quantity: 1, price: 100 },
      ],
    };

    // If it's fixed, it should either throw or silently ignore the coupon and apply 0 discount.
    const order = await OrderService.createOrder(payload);
    expect(order.discount).toBe(0); // Coupon ignored because expired
  });
});
