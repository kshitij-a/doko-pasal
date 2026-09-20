// File location: app/api/send-email/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '../../../lib/supabase-server'
import { check, getIp } from '../../../lib/rate-limit'
import { sendOrderEmail } from '../../../lib/resend'

export async function POST(req) {
  try {
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
    const { data: { user }, error: authError } = await anon.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
    }

    const body = await req.json()
    const { customerName, customerEmail, customerPhone, orderId, items, total, paymentMethod, address } = body

    // Validation (auth-optional; total validated upstream at checkout, accepted here after basic checks)
    const emailOk = typeof customerEmail === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)
    if (!emailOk) return NextResponse.json({ error: 'Valid customerEmail required' }, { status: 400 })
    if (typeof orderId !== 'string' || !orderId.trim()) return NextResponse.json({ error: 'orderId required' }, { status: 400 })
    if (!Array.isArray(items) || items.length === 0) return NextResponse.json({ error: 'items non-empty array required' }, { status: 400 })
    if (typeof total !== 'number' || !(total > 0)) return NextResponse.json({ error: 'total must be a number > 0' }, { status: 400 })

    const service = createServiceClient()
    if (!service) return NextResponse.json({ error: 'Server configuration error - service role key not set' }, { status: 500 })
    const { data: order } = await service.from('orders').select('user_id').eq('id', orderId).single()
    if (!order || order.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden - order does not belong to caller' }, { status: 403 })
    }

    if (!check(getIp(req), 10, 60_000)) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    try {
      const { id } = await sendOrderEmail({ customerName, customerEmail, customerPhone, items, total, paymentMethod, address, orderId })
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
