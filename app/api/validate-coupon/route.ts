import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'Server configuration error - service role key not set' }, { status: 500 })
  }
  const supabase = createClient(url, key)

  try {
    const body = await request.json()
    const code = String(body.code || '').trim().toUpperCase()
    const cartTotal = Number(body.total)
    if (!code) return NextResponse.json({ error: 'Coupon code required' }, { status: 400 })
    if (!Number.isFinite(cartTotal) || cartTotal < 0) {
      return NextResponse.json({ error: 'Valid cart total required' }, { status: 400 })
    }

    // LOYALTY: 1 pt = Rs. 1, whole rupees only. userId identifies balance (enforced in validate-order).
    if (code === 'LOYALTY') {
      const userId = String(body.userId || '')
      if (!userId) return NextResponse.json({ error: 'Login required to use points' }, { status: 401 })
      const { data: row } = await supabase.from('loyalty_points').select('points').eq('user_id', userId).single()
      const balance = Math.max(0, Math.floor(Number(row?.points || 0)))
      if (balance <= 0) return NextResponse.json({ error: 'No loyalty points yet' }, { status: 400 })
      const want = Number.isFinite(Number(body.pointsToUse)) ? Math.floor(Number(body.pointsToUse)) : balance
      const discount = Math.min(balance, Math.max(0, want), Math.floor(cartTotal))
      if (discount <= 0) return NextResponse.json({ error: 'Points cover Rs. 0 of this order' }, { status: 400 })
      return NextResponse.json({ valid: true, discount, total: cartTotal - discount, couponCode: 'LOYALTY' })
    }

    const { data: coupon } = await supabase.from('coupons').select('*').eq('code', code).single()
    if (!coupon) return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 })
    if (!coupon.active) return NextResponse.json({ error: 'Coupon is no longer active' }, { status: 400 })
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 })
    }
    if (cartTotal < (coupon.min_order || 0)) {
      return NextResponse.json({ error: `Minimum order Rs. ${(coupon.min_order || 0).toLocaleString()} required` }, { status: 400 })
    }
    if (coupon.max_uses > 0 && (coupon.used_count || 0) >= coupon.max_uses) {
      return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 })
    }

    const discount = coupon.type === 'percentage'
      ? Math.floor(cartTotal * (coupon.value / 100))
      : Math.min(coupon.value, cartTotal)
    return NextResponse.json({ valid: true, discount, total: cartTotal - discount, couponCode: code })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Coupon validation failed' }, { status: 500 })
  }
}
