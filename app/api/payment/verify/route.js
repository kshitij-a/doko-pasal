// File location: app/api/payment/verify/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey)
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
