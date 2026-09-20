import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey)
    const body = await request.json()
    const { orderId, userId, couponCode, finalize } = body

    if (!orderId || !userId) {
      return NextResponse.json({ error: 'Missing orderId or userId' }, { status: 400 })
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    let serverTotal = 0
    for (const item of order.order_items) {
      const { data: product } = await supabase
        .from('products')
        .select('price, sale_price, stock')
        .eq('id', item.product_id)
        .single()

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.product_id}` }, { status: 400 })
      }

      const validPrice = product.sale_price && product.sale_price < product.price ? product.sale_price : product.price
      if (product.stock != null && item.quantity > product.stock) {
        return NextResponse.json({ error: `Insufficient stock for product: ${item.product_id}` }, { status: 400 })
      }
      serverTotal += validPrice * item.quantity
    }

    // Optional coupon: recompute discount server-side with the same rules as /api/validate-coupon.
    let discount = 0
    let coupon: any = null
    if (couponCode) {
      const code = String(couponCode).trim().toUpperCase()
      const { data } = await supabase.from('coupons').select('*').eq('code', code).single()
      coupon = data || null
      const usable = coupon && coupon.active
        && !(coupon.expires_at && new Date(coupon.expires_at) < new Date())
        && serverTotal >= (coupon.min_order || 0)
        && !(coupon.max_uses > 0 && (coupon.used_count || 0) >= coupon.max_uses)
      if (!usable) {
        return NextResponse.json({ valid: false, message: 'Coupon is no longer valid for this order' }, { status: 400 })
      }
      discount = coupon.type === 'percentage'
        ? Math.floor(serverTotal * (coupon.value / 100))
        : Math.min(coupon.value, serverTotal)
      serverTotal -= discount
    }

    if (Math.abs(serverTotal - order.total_amount) > 0.01) {
      await supabase
        .from('orders')
        .update({ total_amount: serverTotal })
        .eq('id', orderId)

      return NextResponse.json({
        valid: false,
        corrected: true,
        serverTotal,
        clientTotal: order.total_amount,
        message: 'Order total was corrected to match server prices',
      })
    }

    // FIX-05: idempotent coupon use via coupon_redemptions (order_id UNIQUE).
    // Only the first finalize for an order inserts + increments; duplicates are already-counted.
    if (finalize === true && coupon) {
      const { error: redeemError } = await supabase
        .from('coupon_redemptions')
        .insert({ coupon_code: coupon.code, order_id: orderId })
      if (!redeemError) {
        await supabase.from('coupons').update({ used_count: (coupon.used_count || 0) + 1 }).eq('id', coupon.id)
      }
    }

    return NextResponse.json({ valid: true, total: serverTotal, serverTotal, discount, couponCode: coupon?.code || null })
  } catch (error: any) {
    return NextResponse.json({ error: 'Order validation failed' }, { status: 500 })
  }
}
