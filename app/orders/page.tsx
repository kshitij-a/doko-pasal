'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => {
    checkUserAndFetch()
  }, [])

  const checkUserAndFetch = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      router.push('/auth/login')
      return
    }
    setUser(data.user)
    fetchOrders(data.user.id)
  }

  const fetchOrders = async (userId) => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setOrders(data)
    setLoading(false)
  }

  const statusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const paymentIcon = (method) => {
    switch(method) {
      case 'khalti': return '💜 Khalti'
      case 'esewa': return '💚 eSewa'
      case 'cod': return '💵 Cash on Delivery'
      case 'bank': return '🏦 Bank Transfer'
      default: return method
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-red-700 text-white px-6 py-4 flex justify-between items-center shadow-lg">
        <Link href="/" className="text-2xl font-bold">🧺 Doko Pasal</Link>
        <Link href="/products" className="bg-yellow-400 text-red-800 px-4 py-1 rounded-full font-bold">Shop More</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Success message */}
        {typeof window !== 'undefined' && window.location.search.includes('success=true') && (
          <div className="bg-green-50 border border-green-300 rounded-2xl p-6 mb-8 text-center">
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="text-xl font-bold text-green-800">Order Placed Successfully!</h2>
            <p className="text-green-600 mt-1">Thank you for shopping at Doko Pasal. We will contact you soon!</p>
          </div>
        )}

        <h1 className="text-3xl font-extrabold text-red-700 mb-8">📦 My Orders</h1>

        {loading ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">⏳</div>
            <p className="text-gray-500">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-16 text-center">
            <div className="text-7xl mb-4">📭</div>
            <p className="text-xl font-semibold text-gray-600 mb-2">No orders yet</p>
            <p className="text-gray-400 mb-6">Start shopping to see your orders here!</p>
            <Link href="/products" className="bg-red-700 text-white px-8 py-3 rounded-full font-bold hover:bg-red-600 transition">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white rounded-2xl shadow overflow-hidden">
                {/* Order Header */}
                <div className="bg-red-50 px-6 py-4 flex flex-wrap gap-3 justify-between items-center border-b">
                  <div>
                    <p className="text-xs text-gray-500">Order ID</p>
                    <p className="font-mono text-sm font-bold text-gray-800">{order.id.slice(0, 8).toUpperCase()}...</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="text-sm font-semibold text-gray-800">{new Date(order.created_at).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Payment</p>
                    <p className="text-sm font-semibold">{paymentIcon(order.payment_method)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold capitalize ${statusColor(order.order_status)}`}>
                    {order.order_status}
                  </span>
                </div>

                {/* Order Items */}
                <div className="px-6 py-4">
                  {order.order_items?.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-semibold text-gray-800">{item.product_name}</p>
                        <p className="text-sm text-gray-500">Size: {item.size} | Qty: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-gray-800">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  ))}
                </div>

                {/* Order Footer */}
                <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Deliver to: <span className="font-semibold text-gray-700">{order.customer_address}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-xl font-extrabold text-red-700">Rs. {order.total_amount?.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}