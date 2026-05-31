// File location: app/api/payment/verify/route.js
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const body = await req.json()
    const { method, pidx, orderId, data } = body

    // ====== VERIFY KHALTI ======
    if (method === 'khalti') {
      const khaltiSecretKey = process.env.KHALTI_SECRET_KEY

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
        return NextResponse.json({ success: true, transactionId: result.transaction_id, method: 'khalti' })
      } else {
        return NextResponse.json({ success: false, status: result.status }, { status: 400 })
      }
    }

    // ====== VERIFY ESEWA ======
    if (method === 'esewa') {
      // Decode the base64 response from eSewa
      const decoded = JSON.parse(Buffer.from(data, 'base64').toString('utf-8'))
      const { transaction_uuid, total_amount, status } = decoded

      if (status === 'COMPLETE') {
        // Verify with eSewa status check API
        const merchantCode = process.env.ESEWA_MERCHANT_CODE || 'EPAYTEST'
        const verifyUrl = `https://rc.esewa.com.np/api/epay/transaction/status/?product_code=${merchantCode}&total_amount=${total_amount}&transaction_uuid=${transaction_uuid}`

        const verifyResponse = await fetch(verifyUrl)
        const verifyResult = await verifyResponse.json()

        if (verifyResult.status === 'COMPLETE') {
          return NextResponse.json({ success: true, transactionId: transaction_uuid, method: 'esewa' })
        }
      }

      return NextResponse.json({ success: false, message: 'Payment not completed' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Invalid method' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}