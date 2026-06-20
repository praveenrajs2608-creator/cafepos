import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export async function sendReceiptEmail(to: string, orderDetails: { number: number; total: number; items: any[] }) {
  try {
    const itemsList = orderDetails.items.map(item => `<li>${item.product.name} x ${item.quantity} - ₹${(item.price * item.quantity).toFixed(2)}</li>`).join('');
    
    await resend.emails.send({
      from: 'receipts@yourcafe.com',
      to: to,
      subject: `Your Cafe Receipt - Order #${orderDetails.number}`,
      html: `
        <h1>Thank you for your order!</h1>
        <p>Order Number: #${orderDetails.number}</p>
        <ul>${itemsList}</ul>
        <p><strong>Total Paid: ₹${orderDetails.total.toFixed(2)}</strong></p>
      `,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send receipt email', error);
    return { success: false, error };
  }
}
