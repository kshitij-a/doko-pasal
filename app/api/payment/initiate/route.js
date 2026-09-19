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

export async function POST(req) {
  try {
    // validatePaymentEnv inline: service key + supabase url required
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!serviceKey || !supabaseUrl) {
      return NextResponse.json({ error: 'Payment service misconfigured' }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, serviceKey)

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
      .select('id, total_amount')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (Math.abs(amountNum - Number(order.total_amount)) > 0.01) {
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
