// File location: app/api/payment/initiate/route.js
import { NextResponse } from 'next/server'
import crypto from 'crypto'

// eSewa signature generator
function generateEsewaSignature(secretKey, message) {
  const hash = crypto.createHmac('sha256', secretKey).update(message).digest('base64')
  return hash
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { amount, orderId, productName, method } = body

    if (!amount || !orderId || !method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // ====== KHALTI PAYMENT ======
    if (method === 'khalti') {
      const khaltiSecretKey = process.env.KHALTI_SECRET_KEY
      const amountInPaisa = Math.round(amount * 100) // Convert Rs to paisa

      const payload = {
        return_url: `${baseUrl}/payment/verify?method=khalti&orderId=${orderId}`,
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
      const transactionUuid = `${orderId}-${Date.now()}`

      const message = `total_amount=${amount},transaction_uuid=${transactionUuid},product_code=${merchantCode}`
      const signature = generateEsewaSignature(secretKey, message)

      const esewaData = {
        amount: amount,
        tax_amount: 0,
        total_amount: amount,
        transaction_uuid: transactionUuid,
        product_code: merchantCode,
        product_service_charge: 0,
        product_delivery_charge: 0,
        success_url: `${baseUrl}/payment/verify?method=esewa&orderId=${orderId}`,
        failure_url: `${baseUrl}/payment/failed?orderId=${orderId}`,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature: signature,
      }

      return NextResponse.json({
        esewaData,
        paymentUrl: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
      })
    }

    return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
  } catch (error) {
    console.error('Payment initiation error:', error)
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 })
  }
}