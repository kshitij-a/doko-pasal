// File location: app/api/payment/verify/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey)
}

// Runs once per paid order (verify 409s when already paid, so no double-decrement).
// Stock failures must never fail payment verification — best-effort only.
async function settlePaidOrder(supabase, orderId) {
  try {
    const { data: items } = await supabase.from('order_items').select('product_id, quantity').eq('order_id', orderId)
    for (const it of items || []) {
      try {
        const { data: ok, error: stockError } = await supabase.rpc('decrement_stock', { p_product: it.product_id, p_qty: it.quantity })
        if (stockError) console.error('decrement_stock error:', stockError, it.product_id)
        else if (ok === false) console.error('decrement_stock insufficient stock:', it.product_id)
      } catch (e) {
        console.error('decrement_stock error:', e)
      }
    }
    const { data: ord } = await supabase.from('orders').select('user_id, total_amount, coupon_code, discount_amount').eq('id', orderId).single()
    // Loyalty earn: 1 pt per Rs. 100 of final total, idempotent via loyalty_ledger order_id UNIQUE.
    if (ord && ord.user_id) {
      const earned = Math.floor(Number(ord.total_amount || 0) / 100)
      if (earned > 0) {
        const { error: ledgerError } = await supabase.from('loyalty_ledger').insert({ order_id: orderId, user_id: ord.user_id, points: earned })
        if (!ledgerError) {
          const { data: bal } = await supabase.from('loyalty_points').select('points').eq('user_id', ord.user_id).single()
          const next = (bal ? Number(bal.points) || 0 : 0) + earned
          if (bal) await supabase.from('loyalty_points').update({ points: next }).eq('user_id', ord.user_id)
          else await supabase.from('loyalty_points').insert({ user_id: ord.user_id, points: next })
        }
      }
      // LOYALTY redeem: deduct once, guarded by coupon_redemptions order_id UNIQUE.
      if (ord.coupon_code && String(ord.coupon_code).toUpperCase() === 'LOYALTY' && Number(ord.discount_amount) > 0) {
        const { error: redeemError } = await supabase.from('coupon_redemptions').insert({ coupon_code: 'LOYALTY', order_id: orderId })
        if (!redeemError) {
          const { data: bal } = await supabase.from('loyalty_points').select('points').eq('user_id', ord.user_id).single()
          if (bal) await supabase.from('loyalty_points').update({ points: Math.max(0, (Number(bal.points) || 0) - Math.floor(Number(ord.discount_amount))) }).eq('user_id', ord.user_id)
        }
      }
    }
    if (ord && ord.coupon_code && String(ord.coupon_code).toUpperCase() !== 'LOYALTY') {
      const code = String(ord.coupon_code).toUpperCase()
      const { error: redeemError } = await supabase.from('coupon_redemptions').insert({ coupon_code: code, order_id: orderId })
      if (!redeemError) {
        const { data: c } = await supabase.from('coupons').select('id, used_count').eq('code', code).single()
        if (c) await supabase.from('coupons').update({ used_count: (c.used_count || 0) + 1 }).eq('id', c.id)
      }
    }
  } catch (e) {
    console.error('settlePaidOrder error:', e)
  }
}

async function sendPrepaidReceipt(supabase, req, orderId, method) {
  try {
    const { data: fullOrder } = await supabase
      .from('orders')
      .select('id, user_id, customer_name, customer_phone, customer_address, total_amount, payment_method')
      .eq('id', orderId)
      .single()
    if (!fullOrder) return
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_name, size, quantity, price')
      .eq('order_id', orderId)
    if (!orderItems || orderItems.length === 0) return
    let customerEmail = null
    try {
      if (fullOrder.user_id) {
        const { data } = await supabase.auth.admin.getUserById(fullOrder.user_id)
        customerEmail = data?.user?.email || null
      }
    } catch { return }
    if (!customerEmail) return
    const origin = new URL(req.url).origin
    await fetch(`${origin}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: fullOrder.customer_name,
        customerEmail,
        customerPhone: fullOrder.customer_phone,
        orderId: fullOrder.id,
        items: orderItems,
        total: Number(fullOrder.total_amount),
        paymentMethod: method || fullOrder.payment_method,
        address: fullOrder.customer_address,
      }),
    })
  } catch { /* never fail verification if email fails */ }
}

export async function POST(req) {
  try {
    const supabase = getServiceClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Payment service misconfigured' }, { status: 500 })
    }

    const body = await req.json()
    const { method, pidx, orderId, data } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })
    }

    // Fetch order first for amount checks + idempotency
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, total_amount, payment_status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json({ success: true, alreadyPaid: true, method }, { status: 409 })
    }

    // ====== VERIFY KHALTI ======
    if (method === 'khalti') {
      const khaltiSecretKey = process.env.KHALTI_SECRET_KEY
      if (!khaltiSecretKey) {
        return NextResponse.json({ error: 'Khalti payment is not configured' }, { status: 500 })
      }
      if (!pidx) {
        return NextResponse.json({ error: 'Missing pidx' }, { status: 400 })
      }

      const response = await fetch('https://a.khalti.com/api/v2/epayment/lookup/', {
        method: 'POST',
        headers: {
          Authorization: `Key ${khaltiSecretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pidx }),
      })

      const result = await response.json()

      if (result.status === 'Completed') {
        if (result.purchase_order_id !== orderId) {
          return NextResponse.json({ success: false, message: 'Order ID mismatch' }, { status: 400 })
        }
        if (result.amount !== Math.round(Number(order.total_amount) * 100)) {
          return NextResponse.json({ success: false, message: 'Amount mismatch' }, { status: 400 })
        }
        const { error: updateError } = await supabase.from('orders').update({
          payment_status: 'paid',
          order_status: 'processing',
          transaction_id: result.transaction_id,
        }).eq('id', orderId)

        if (updateError) {
          return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
        }

        await settlePaidOrder(supabase, orderId)
        await sendPrepaidReceipt(supabase, req, orderId, 'khalti')

        return NextResponse.json({ success: true, transactionId: result.transaction_id, method: 'khalti' })
      } else {
        return NextResponse.json({ success: false, status: result.status }, { status: 400 })
      }
    }

    // ====== VERIFY ESEWA ======
    if (method === 'esewa') {
      if (!data) {
        return NextResponse.json({ success: false, message: 'Missing payment data' }, { status: 400 })
      }
      let decoded
      try {
        decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'))
      } catch {
        return NextResponse.json({ success: false, message: 'Invalid payment data' }, { status: 400 })
      }
      const { transaction_uuid, total_amount, status } = decoded

      if (status === 'COMPLETE') {
        if (!transaction_uuid || !String(transaction_uuid).startsWith(orderId)) {
          return NextResponse.json({ success: false, message: 'Order ID mismatch' }, { status: 400 })
        }
        if (Math.abs(Number(total_amount) - Number(order.total_amount)) > 0.01) {
          return NextResponse.json({ success: false, message: 'Amount mismatch' }, { status: 400 })
        }
        const merchantCode = process.env.ESEWA_MERCHANT_CODE
        if (!merchantCode) {
          return NextResponse.json({ error: 'eSewa merchant code not configured' }, { status: 500 })
        }
        const statusHost = process.env.ESEWA_STATUS_URL || 'https://rc.esewa.com.np/api/epay/transaction/status/'
        const verifyUrl = `${statusHost}?product_code=${merchantCode}&total_amount=${total_amount}&transaction_uuid=${transaction_uuid}`

        const verifyResponse = await fetch(verifyUrl)
        if (!verifyResponse.ok) {
          return NextResponse.json({ success: false, message: 'Payment not completed' }, { status: 400 })
        }
        const verifyResult = await verifyResponse.json()

        if (verifyResult.status === 'COMPLETE') {
          const { error: updateError } = await supabase.from('orders').update({
            payment_status: 'paid',
            order_status: 'processing',
            transaction_id: transaction_uuid,
          }).eq('id', orderId)

          if (updateError) {
            return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
          }

          await settlePaidOrder(supabase, orderId)
          await sendPrepaidReceipt(supabase, req, orderId, 'esewa')

          return NextResponse.json({ success: true, transactionId: transaction_uuid, method: 'esewa' })
        }
      }

      return NextResponse.json({ success: false, message: 'Payment not completed' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Invalid method' }, { status: 400 })
  } catch (error) {
    console.error('Payment verify error:', error)
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 })
  }
}
