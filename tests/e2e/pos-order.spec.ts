import { test, expect } from '@playwright/test';

test.describe('Black-box UI Testing: POS Order Flow', () => {
  test('Cashier can create an order, apply a coupon, and verify totals', async ({ page }) => {
    // 1. Navigate to login and log in as cashier
    await page.goto('/login');
    await page.fill('input[type="email"]', 'cashier@cafe.com');
    await page.fill('input[type="password"]', 'cashier123');
    await page.click('button[type="submit"]');

    // Wait for redirect to POS (since role is Cashier)
    await page.waitForURL('**/pos');

    // Start session if prompted
    const startSessionBtn = page.getByRole('button', { name: /Open Register|Start Session/i });
    if (await startSessionBtn.isVisible()) {
      await page.fill('input[type="number"]', '100'); // Starting cash
      await startSessionBtn.click();
    }

    // Wait for the POS layout to load
    await expect(page.getByText('All Cuisines').first()).toBeVisible();

    // 3. Add items to the cart
    // Click on the first product
    const firstProduct = page.locator('button').filter({ hasText: '₹' }).first();
    await firstProduct.click();
    
    // Click on the second product
    const secondProduct = page.locator('button').filter({ hasText: '₹' }).nth(1);
    await secondProduct.click();

    // Verify items are in the cart
    await expect(page.getByText('Current Order').first()).toBeVisible();

    // Extract Subtotal before discount
    const subtotalText = await page.getByText(/Subtotal/i).locator('..').locator('span').last().innerText();
    const subtotal = parseFloat(subtotalText.replace(/[^0-9.]/g, ''));
    expect(subtotal).toBeGreaterThan(0);

    // 4. Apply Coupon
    const couponBtn = page.getByRole('button', { name: /Apply Promo/i });
    if (await couponBtn.isVisible()) {
      await couponBtn.click();
      await page.getByText('WELCOME10').click();
      await page.getByRole('button', { name: 'Apply', exact: true }).click();
    }

    // Wait for totals to recalculate
    await page.waitForTimeout(1000); 

    // 5. Verify Totals
    const newSubtotalText = await page.getByText(/Subtotal/i).locator('..').locator('span').last().innerText();
    const newSubtotal = parseFloat(newSubtotalText.replace(/[^0-9.]/g, ''));
    
    let discount = 0;
    const discountEl = page.getByText(/Discount/i).locator('..').locator('span').last();
    if (await discountEl.isVisible()) {
      const discountText = await discountEl.innerText();
      discount = parseFloat(discountText.replace(/[^0-9.]/g, ''));
    }

    const taxEl = page.getByText(/Tax/i).locator('..').locator('span').last();
    const taxText = await taxEl.innerText();
    const tax = parseFloat(taxText.replace(/[^0-9.]/g, ''));

    const totalEl = page.getByText(/Total/i, { exact: true }).locator('..').locator('span').last();
    const totalText = await totalEl.innerText();
    const total = parseFloat(totalText.replace(/[^0-9.]/g, ''));

    expect(discount).toBeCloseTo(newSubtotal * 0.1, 1);
    const subAfterDiscount = newSubtotal - discount;
    expect(tax).toBeCloseTo(subAfterDiscount * 0.05, 1);
    expect(total).toBeCloseTo(subAfterDiscount + tax, 1);

    // 6. Submit the Order
    await page.getByRole('button', { name: /Checkout/i }).click();
    
    // Check if Cash payment modal appears
    const cashBtn = page.getByRole('button', { name: /CASH/i });
    if (await cashBtn.isVisible()) {
      await cashBtn.click();
      await page.getByRole('button', { name: /Authorize/i }).click();
    }

    // Expect success
    await expect(page.getByText(/ticket sent to kitchen!/i)).toBeVisible();
  });
});
