// File location: app/api/payment/initiate/route.js
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// eSewa signature generator
function generateEsewaSignature(secretKey, message) {
  const hash = crypto.createHmac('sha256', secretKey).update(message).digest('base64')
  return hash
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Caller identity: service client can't tell who called, so verify the Bearer token via anon client.
async function getCaller(req) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return { error: 'Unauthorized - no Bearer token provided' }
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!anonKey) return { error: 'Auth misconfigured' }
  const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, anonKey)
  const { data: { user }, error } = await anon.auth.getUser(authHeader.replace('Bearer ', ''))
  if (error || !user) return { error: 'Invalid or expired token' }
  return { user }
}

// Server re-price: never trust the client amount or the stored total; recompute from live product prices.
async function computeServerTotal(supabase, orderId) {
  const { data: items, error } = await supabase.from('order_items').select('product_id, quantity').eq('order_id', orderId)
  if (error || !items || items.length === 0) return { error: 'Order has no items' }
  let serverTotal = 0
  for (const it of items) {
    const { data: p } = await supabase.from('products').select('price, sale_price').eq('id', it.product_id).single()
    if (!p) return { error: `Product not found: ${it.product_id}` }
    const live = p.sale_price && p.sale_price < p.price ? p.sale_price : p.price
    serverTotal += Number(live) * Number(it.quantity)
  }
  return { serverTotal }
}

// Effective total: live item prices minus a server-recomputed coupon discount.
// Never trusts stored total_amount/discount_amount (both are client-set at insert).
async function computeEffectiveTotal(supabase, order) {
  const { serverTotal, error } = await computeServerTotal(supabase, order.id)
  if (error) return { error }
  const discount = Number(order.discount_amount || 0)
  const code = order.coupon_code ? String(order.coupon_code).trim().toUpperCase() : ''
  if (!code) {
    if (Math.abs(discount) > 0.01) return { error: 'Unexpected discount' }
    return { effectiveTotal: serverTotal }
  }
  if (!(discount > 0) || discount - serverTotal > 0.01) return { error: 'Invalid discount' }
  if (code === 'LOYALTY') {
    const { data: row } = await supabase.from('loyalty_points').select('points').eq('user_id', order.user_id).single()
    const balance = Math.max(0, Math.floor(Number(row?.points || 0)))
    // Partial redemption allowed: discount just can't exceed what the user holds (or the items total).
    if (discount - Math.min(balance, Math.floor(serverTotal)) > 0.01) return { error: 'Discount exceeds loyalty balance' }
    return { effectiveTotal: serverTotal - discount }
  }
  const { data: coupon } = await supabase.from('coupons').select('*').eq('code', code).single()
  const usable = coupon && coupon.active
    && !(coupon.expires_at && new Date(coupon.expires_at) < new Date())
    && serverTotal >= (coupon.min_order || 0)
    && !(coupon.max_uses > 0 && (coupon.used_count || 0) >= coupon.max_uses)
  if (!usable) return { error: 'Coupon is no longer valid for this order' }
  const expected = coupon.type === 'percentage' ? Math.floor(serverTotal * (coupon.value / 100)) : Math.min(coupon.value, serverTotal)
  if (Math.abs(discount - expected) > 0.01) return { error: 'Discount mismatch' }
  return { effectiveTotal: serverTotal - discount }
}

export async function POST(req) {
  try {
    // validatePaymentEnv inline: service key + supabase url required
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!serviceKey || !supabaseUrl) {
      return NextResponse.json({ error: 'Payment service misconfigured' }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, serviceKey)

    const { user, error: authError } = await getCaller(req)
    if (!user) {
      return NextResponse.json({ error: authError }, { status: 401 })
    }

    const body = await req.json()
    const { amount, orderId, productName, method } = body

    if (!amount || !orderId || !method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!UUID_RE.test(orderId)) {
      return NextResponse.json({ error: 'Invalid orderId format' }, { status: 400 })
    }

    const amountNum = Number(amount)
    const amountInPaisa = Math.round(amountNum * 100)
    if (!Number.isFinite(amountNum) || amountNum <= 0 || !Number.isInteger(amountInPaisa) || amountInPaisa <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, total_amount, discount_amount, coupon_code, payment_status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden - order does not belong to caller' }, { status: 403 })
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Order is already paid', alreadyPaid: true }, { status: 409 })
    }

    const { effectiveTotal, error: priceError } = await computeEffectiveTotal(supabase, order)
    if (priceError) {
      return NextResponse.json({ error: priceError }, { status: 400 })
    }
    if (Math.abs(effectiveTotal - Number(order.total_amount)) > 0.01) {
      return NextResponse.json({ error: 'Stored total does not match server prices' }, { status: 400 })
    }

    if (Math.abs(amountNum - effectiveTotal) > 0.01) {
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // ====== KHALTI PAYMENT ======
    if (method === 'khalti') {
      const khaltiSecretKey = process.env.KHALTI_SECRET_KEY
      if (!khaltiSecretKey) {
        return NextResponse.json({ error: 'Khalti payment is not configured' }, { status: 500 })
      }

      const payload = {
        return_url: `${baseUrl}/payment/verify?method=khalti&orderId=${encodeURIComponent(orderId)}`,
        website_url: baseUrl,
        amount: amountInPaisa,
        purchase_order_id: orderId,
        purchase_order_name: productName || 'Doko Pasal Order',
        customer_info: {
          name: body.customerName || 'Customer',
          email: body.customerEmail || 'customer@example.com',
          phone: body.customerPhone || '9800000000',
        },
      }

      const response = await fetch('https://a.khalti.com/api/v2/epayment/initiate/', {
        method: 'POST',
        headers: {
          Authorization: `Key ${khaltiSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        return NextResponse.json({ error: data.detail || 'Khalti initiation failed', details: data }, { status: 400 })
      }

      return NextResponse.json({ paymentUrl: data.payment_url, pidx: data.pidx })
    }

    // ====== ESEWA PAYMENT ======
    if (method === 'esewa') {
      const merchantCode = process.env.ESEWA_MERCHANT_CODE
      const secretKey = process.env.ESEWA_SECRET_KEY
      if (!merchantCode || !secretKey) {
        return NextResponse.json({ error: 'eSewa payment is not configured' }, { status: 500 })
      }
      const esewaFormUrl = process.env.ESEWA_FORM_URL || 'https://rc-epay.esewa.com.np/api/epay/main/v2/form'
      const transactionUuid = `${orderId}-${Date.now()}`

      const message = `total_amount=${amountNum},transaction_uuid=${transactionUuid},product_code=${merchantCode}`
      const signature = generateEsewaSignature(secretKey, message)

      const esewaData = {
        amount: amountNum,
        tax_amount: 0,
        total_amount: amountNum,
        transaction_uuid: transactionUuid,
        product_code: merchantCode,
        product_service_charge: 0,
        product_delivery_charge: 0,
        success_url: `${baseUrl}/payment/verify?method=esewa&orderId=${encodeURIComponent(orderId)}`,
        failure_url: `${baseUrl}/payment/failed?orderId=${encodeURIComponent(orderId)}`,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature: signature,
      }

      return NextResponse.json({
        esewaData,
        paymentUrl: esewaFormUrl,
      })
    }

    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
  } catch (error) {
    console.error('Payment initiation error:', error)
    return NextResponse.json({ error: 'Payment initiation failed' }, { status: 500 })
  }
}
