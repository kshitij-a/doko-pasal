// File location: app/api/send-email/route.js
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const body = await req.json()
    const { customerName, customerEmail, customerPhone, orderId, items, total, paymentMethod, address } = body

    const RESEND_API_KEY = process.env.RESEND_API_KEY

    if (!RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 })
    }

    // Build items HTML
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151;">
          ${item.product_name}
          ${item.size ? `<span style="color: #9ca3af; font-size: 12px;"> (Size: ${item.size})</span>` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #b91c1c; font-weight: bold; text-align: right;">
          Rs. ${(item.price * item.quantity).toLocaleString()}
        </td>
      </tr>
    `).join('')

    const paymentLabels = {
      khalti: '💜 Khalti',
      esewa: '💚 eSewa',
      cod: '💵 Cash on Delivery',
      bank: '🏦 Bank Transfer'
    }

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmed - Doko Pasal</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: 'Segoe UI', Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">

    <!-- HEADER -->
    <div style="background: linear-gradient(135deg, #b91c1c, #dc2626); border-radius: 16px 16px 0 0; padding: 40px 30px; text-align: center;">
      <div style="font-size: 40px; margin-bottom: 10px;">🧺</div>
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">Doko Pasal</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">Nepal's favourite clothing store</p>
    </div>

    <!-- SUCCESS BANNER -->
    <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px 30px; margin: 0;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 30px;">🎉</span>
        <div>
          <h2 style="margin: 0; color: #15803d; font-size: 20px; font-weight: 700;">Order Confirmed!</h2>
          <p style="margin: 4px 0 0; color: #166534; font-size: 14px;">Thank you ${customerName}! Your order has been placed successfully.</p>
        </div>
      </div>
    </div>

    <!-- MAIN CARD -->
    <div style="background: white; border-radius: 0 0 16px 16px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">

      <!-- ORDER ID -->
      <div style="background: #fef2f2; border-radius: 12px; padding: 16px 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <p style="margin: 0; font-size: 12px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Order ID</p>
          <p style="margin: 4px 0 0; font-size: 18px; font-weight: 800; color: #b91c1c; font-family: monospace;">#${orderId.slice(0,8).toUpperCase()}</p>
        </div>
        <div style="text-align: right;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Status</p>
          <span style="background: #fef3c7; color: #d97706; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700;">⏳ Pending</span>
        </div>
      </div>

      <!-- ORDER ITEMS -->
      <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: #111827;">📦 Order Items</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 10px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Product</th>
            <th style="padding: 10px 12px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Qty</th>
            <th style="padding: 10px 12px; text-align: right; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 16px 12px; font-weight: 700; font-size: 16px; color: #111827;">Total Amount</td>
            <td style="padding: 16px 12px; font-weight: 800; font-size: 20px; color: #b91c1c; text-align: right;">Rs. ${total.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>

      <!-- DIVIDER -->
      <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 0 0 24px;">

      <!-- DELIVERY & PAYMENT INFO -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
        <div style="background: #f9fafb; border-radius: 12px; padding: 16px;">
          <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">📍 Delivery To</p>
          <p style="margin: 0; font-weight: 600; color: #111827; font-size: 14px;">${customerName}</p>
          <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">${address}</p>
          <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">📞 ${customerPhone}</p>
        </div>
        <div style="background: #f9fafb; border-radius: 12px; padding: 16px;">
          <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">💳 Payment</p>
          <p style="margin: 0; font-weight: 600; color: #111827; font-size: 14px;">${paymentLabels[paymentMethod] || paymentMethod}</p>
          <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">🚚 Free delivery</p>
          <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">⏱️ 2-5 business days</p>
        </div>
      </div>

      <!-- BANK TRANSFER NOTE -->
      ${paymentMethod === 'bank' ? `
      <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px; font-weight: 700; color: #1d4ed8; font-size: 14px;">🏦 Bank Transfer Details</p>
        <p style="margin: 0; color: #1e40af; font-size: 13px;">Bank: Nepal Investment Bank</p>
        <p style="margin: 4px 0 0; color: #1e40af; font-size: 13px;">Account Name: Doko Pasal</p>
        <p style="margin: 4px 0 0; color: #1e40af; font-size: 13px;">Account No: 001234567890</p>
        <p style="margin: 8px 0 0; color: #1e40af; font-size: 13px; font-weight: 600;">Please send payment screenshot to confirm your order.</p>
      </div>
      ` : ''}

      <!-- WHAT'S NEXT -->
      <div style="background: #fef2f2; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h3 style="margin: 0 0 12px; font-size: 15px; font-weight: 700; color: #b91c1c;">What happens next?</h3>
        <div style="space-y: 8px;">
          <p style="margin: 0 0 8px; font-size: 13px; color: #374151;">✅ <strong>Order received</strong> — We have your order!</p>
          <p style="margin: 0 0 8px; font-size: 13px; color: #9ca3af;">📦 <strong>Processing</strong> — We prepare your items</p>
          <p style="margin: 0 0 8px; font-size: 13px; color: #9ca3af;">🚚 <strong>Shipped</strong> — On the way to you</p>
          <p style="margin: 0; font-size: 13px; color: #9ca3af;">🎉 <strong>Delivered</strong> — Enjoy your purchase!</p>
        </div>
      </div>

      <!-- CTA BUTTON -->
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="https://doko-pasal.vercel.app/orders" 
          style="display: inline-block; background: #b91c1c; color: white; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; text-decoration: none;">
          📦 Track My Order
        </a>
      </div>

      <!-- CONTACT -->
      <div style="border-top: 1px solid #f3f4f6; padding-top: 20px; text-align: center;">
        <p style="margin: 0; color: #6b7280; font-size: 13px;">Questions? Contact us:</p>
        <p style="margin: 8px 0 0; color: #b91c1c; font-size: 14px; font-weight: 600;">📧 dokopasal@gmail.com</p>
      </div>
    </div>

    <!-- FOOTER -->
    <div style="text-align: center; padding: 24px 0;">
      <p style="margin: 0; color: #9ca3af; font-size: 13px;">🧺 <strong>Doko Pasal</strong> — Made with ❤️ in Nepal</p>
      <p style="margin: 8px 0 0; color: #d1d5db; font-size: 12px;">© 2026 Doko Pasal. All rights reserved.</p>
    </div>

  </div>
</body>
</html>
    `

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Doko Pasal <orders@doko-pasal.vercel.app>',
        to: [customerEmail],
        subject: `🎉 Order Confirmed #${orderId.slice(0,8).toUpperCase()} - Doko Pasal`,
        html: emailHtml,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: result.message || 'Email failed' }, { status: 400 })
    }

    return NextResponse.json({ success: true, id: result.id })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}