'use client'
import Link from 'next/link'
import { Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

function FailedContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const orderId = searchParams.get('orderId')

  // Cancel the pending order (owner delete via RLS; needs orders owner-delete policy).
  const cancelOrder = async () => {
    if (!orderId) return
    if (!confirm('Cancel this pending order?')) return
    const { error } = await supabase.from('orders').delete().eq('id', orderId)
    if (error) { alert('Could not cancel order: ' + error.message); return }
    router.push('/orders')
  }

  return (
    <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
      <div className="text-7xl mb-4">😔</div>
      <h1 className="text-3xl font-extrabold text-red-600 mb-2">Payment Cancelled</h1>
      <p className="text-gray-500 mb-2">Your payment was not completed.</p>
      {orderId && (
        <p className="text-gray-400 text-sm mb-6">Order ID: {orderId.slice(0,8).toUpperCase()}</p>
      )}
      <p className="text-gray-500 mb-8">Your order is still pending and your cart was kept. Retry payment or check your orders.</p>
      <div className="flex gap-3 justify-center flex-wrap">
        <Link href="/checkout" className="bg-red-700 text-white px-6 py-3 rounded-2xl font-extrabold hover:bg-red-600 transition">
          Pay Again
        </Link>
        {orderId && (
          <button onClick={cancelOrder} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-extrabold hover:bg-gray-300 transition">
            Cancel Order
          </button>
        )}
        <Link href="/orders" className="bg-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-extrabold hover:bg-gray-300 transition">
          My Orders
        </Link>
      </div>
    </div>
  )
}

export default function PaymentFailed() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Suspense fallback={
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-gray-500">Loading...</p>
        </div>
      }>
        <FailedContent />
      </Suspense>
    </main>
  )
}
