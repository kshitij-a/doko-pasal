'use client'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

function VerifyContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState('verifying')
  const [message, setMessage] = useState('')

  useEffect(() => {
    verifyPayment()
  }, [])

  const verifyPayment = async () => {
    const method = searchParams.get('method')
    const orderId = searchParams.get('orderId')
    const pidx = searchParams.get('pidx')
    const data = searchParams.get('data')

    if (!method || !orderId) {
      setStatus('failed')
      setMessage('Invalid payment response.')
      return
    }

    try {
      const response = await fetch('/api/payment/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, pidx, orderId, data }),
      })

      const result = await response.json()

      if (result.success) {
        await supabase.from('orders').update({
          payment_status: 'paid',
          order_status: 'processing',
          transaction_id: result.transactionId,
        }).eq('id', orderId)

        setStatus('success')
        setMessage(`Payment successful! Transaction ID: ${result.transactionId}`)
        setTimeout(() => router.push('/orders?success=true'), 3000)
      } else {
        setStatus('failed')
        setMessage(result.message || 'Payment verification failed.')
      }
    } catch (err) {
      setStatus('failed')
      setMessage('Error verifying payment: ' + err.message)
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
      {status === 'verifying' && (
        <>
          <div className="w-20 h-20 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h1 className="text-2xl font-extrabold text-gray-800 mb-2">Verifying Payment...</h1>
          <p className="text-gray-500">Please wait, do not close this page.</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="text-7xl mb-4">🎉</div>
          <h1 className="text-3xl font-extrabold text-green-600 mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-2">{message}</p>
          <p className="text-gray-400 text-sm mb-6">Redirecting to your orders...</p>
          <Link href="/orders" className="bg-red-700 text-white px-8 py-3 rounded-2xl font-extrabold hover:bg-red-600 transition">
            View My Orders
          </Link>
        </>
      )}
      {status === 'failed' && (
        <>
          <div className="text-7xl mb-4">❌</div>
          <h1 className="text-3xl font-extrabold text-red-600 mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex gap-3 justify-center">
            <Link href="/cart" className="bg-red-700 text-white px-6 py-3 rounded-2xl font-extrabold hover:bg-red-600 transition">
              Try Again
            </Link>
            <Link href="/orders" className="bg-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-extrabold hover:bg-gray-300 transition">
              My Orders
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

export default function PaymentVerify() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Suspense fallback={
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      }>
        <VerifyContent />
      </Suspense>
    </main>
  )
}