// File location: app/api/send-email/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '../../../lib/supabase-server'
import { check, getIp } from '../../../lib/rate-limit'
import { sendOrderEmail } from '../../../lib/resend'

// Order details (items/total/address) are always read from the DB via the
// service client — caller-supplied items/total/address are ignored, so a
// caller cannot forge an email with arbitrary contents. Auth: either a Bearer
// token proving ownership of the order, OR the x-internal-secret header
// matching INTERNAL_EMAIL_SECRET (for server-to-server calls, e.g. verify).
export async function POST(req) {
  try {
    let user = null
    const internalSecret = req.headers.get('x-internal-secret')
    const internalOk = !!process.env.INTERNAL_EMAIL_SECRET
      && internalSecret === process.env.INTERNAL_EMAIL_SECRET
    if (!internalOk) {
      // Require Authorization Bearer → verify caller owns the order
      const authHeader = req.headers.get('authorization')
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized - no Bearer token provided' }, { status: 401 })
      }
      const token = authHeader.replace('Bearer ', '')
      const anon = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      )
      const { data: { user: authUser }, error: authError } = await anon.auth.getUser(token)
      if (authError || !authUser) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
      }
      user = authUser
    }

    const body = await req.json()
    const { orderId } = body
    // customerEmail may be supplied by the caller (checkout) so the receipt
    // reaches the right inbox; everything else comes from the DB below.
    const { customerEmail } = body

    // Validation
    const emailOk = typeof customerEmail === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)
    if (!emailOk) return NextResponse.json({ error: 'Valid customerEmail required' }, { status: 400 })
    if (typeof orderId !== 'string' || !orderId.trim()) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

    const service = createServiceClient()
    if (!service) return NextResponse.json({ error: 'Server configuration error - service role key not set' }, { status: 500 })
    const { data: order } = await service.from('orders').select('id, user_id, customer_name, customer_phone, customer_address, total_amount, payment_method').eq('id', orderId).single()
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }
    if (!internalOk && order.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden - order does not belong to caller' }, { status: 403 })
    }

    if (!check(getIp(req), 10, 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { data: rows } = await service.from('order_items').select('product_name, size, quantity, price').eq('order_id', orderId)
    if (!rows || rows.length === 0) return NextResponse.json({ error: 'Order has no items' }, { status: 400 })

    try {
      const { id } = await sendOrderEmail({
        customerName: order.customer_name,
        customerEmail,
        customerPhone: order.customer_phone,
        items: rows.map(r => ({ product_name: r.product_name, size: r.size, quantity: r.quantity, price: r.price })),
        total: order.total_amount,
        paymentMethod: order.payment_method,
        address: order.customer_address,
        orderId: order.id,
      })
      return NextResponse.json({ success: true, id })
    } catch (e) {
      const msg = e.message || 'Email failed'
      const status = msg === 'Email service not configured' ? 500 : 400
      return NextResponse.json({ error: msg }, { status })
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
