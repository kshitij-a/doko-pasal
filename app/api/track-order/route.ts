import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }
    const body = await request.json()
    const orderId = typeof body.orderId === 'string' ? body.orderId.trim() : ''
    const phone = typeof body.phone === 'string' ? body.phone.trim() : ''

    if (!orderId || orderId.length < 8 || !phone) {
      return NextResponse.json({ error: 'orderId (first 8 characters) and phone are required' }, { status: 400 })
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey)
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, customer_phone, order_status, payment_status, payment_method, total_amount, created_at, order_items(product_name, size, quantity, price)')
      .ilike('id', `${orderId.slice(0, 8)}%`)
      .limit(10)

    if (error) return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })

    const order = (orders || []).find((o: { customer_phone: string }) => o.customer_phone === phone)
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    const steps = ['pending', 'processing', 'shipped', 'delivered']
    return NextResponse.json({
      id: order.id,
      shortId: order.id.slice(0, 8).toUpperCase(),
      status: order.order_status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      total: order.total_amount,
      createdAt: order.created_at,
      timeline: steps.map((s) => ({ step: s, done: steps.indexOf(s) <= steps.indexOf(order.order_status) })),
      items: order.order_items || [],
    })
  } catch {
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 })
  }
}
