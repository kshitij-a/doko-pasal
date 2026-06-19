'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { npFullDate } from '../../lib/timezone'
import Navbar from '../../components/Navbar'

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const router = useRouter()

  useEffect(() => { checkUserAndFetch() }, [])

  const checkUserAndFetch = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) { router.push('/auth/login'); return }
    setUser(data.user)
    fetchOrders(data.user.id)
  }

  const fetchOrders = async (userId) => {
    try {
      const { data, error } = await supabase.from('orders').select('*, order_items(*)').eq('user_id', userId).order('created_at', { ascending: false })
      if (error) console.error('Error fetching orders:', error.message)
      else if (data) setOrders(data)
    } catch (err) { console.error('Failed to fetch orders:', err) }
    finally { setLoading(false) }
  }

  const statusBadge = (status) => {
    const map = { pending: 'badge-pending', processing: 'badge-processing', shipped: 'badge-shipped', delivered: 'badge-delivered', cancelled: 'badge-cancelled' }
    return map[status] || 'badge-pending'
  }

  const paymentLabel = (method) => {
    const map = { khalti: 'Khalti', esewa: 'eSewa', cod: 'Cash on Delivery', bank: 'Bank Transfer' }
    return map[method] || method
  }

  const statusSteps = ['pending', 'processing', 'shipped', 'delivered']

  return (
    <main className="min-h-screen bg-[#FAF8F4] pb-20 sm:pb-0">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Success message */}
        {typeof window !== 'undefined' && window.location.search.includes('success=true') && (
          <div className="bg-white border border-[#E8E3DB] rounded-2xl p-8 mb-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#D1FAE5] flex items-center justify-center">
              <svg className="w-8 h-8 text-[#2A7D4F]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h2 className="text-2xl font-bold text-[#1E1A16] mb-2" style={{ fontFamily: 'var(--font-display)' }}>Order Placed Successfully!</h2>
            <p className="text-[#6B6560] mb-6">Thank you for shopping at Doko Pasal. We will contact you soon!</p>
            <div className="flex justify-center gap-3">
              <Link href="/orders" className="btn-primary text-sm">View My Orders</Link>
              <Link href="/products" className="btn-secondary text-sm">Shop More</Link>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1E1A16]" style={{ fontFamily: 'var(--font-display)' }}>My Orders</h1>
          <div className="w-12 h-0.5 bg-[#B5293A] mt-3 rounded-full" />
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-[#B5293A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#6B6560]">Loading your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border border-[#E8E3DB]">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#F2EFE9] flex items-center justify-center">
              <svg className="w-10 h-10 text-[#9E9994]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>
            </div>
            <p className="text-xl font-semibold text-[#1E1A16] mb-2" style={{ fontFamily: 'var(--font-display)' }}>No orders yet</p>
            <p className="text-[#9E9994] mb-6">Start shopping to see your orders here!</p>
            <Link href="/products" className="btn-primary">Browse Products</Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map(order => {
              const currentStep = statusSteps.indexOf(order.order_status)
              return (
                <div key={order.id} className={`order-card status-${order.order_status}`}>
                  {/* Order Header */}
                  <div className="flex flex-wrap gap-4 justify-between items-start mb-4">
                    <div>
                      <p className="text-[10px] font-bold text-[#9E9994] uppercase tracking-wider">Order ID</p>
                      <p className="font-mono text-sm font-bold text-[#1E1A16]">#{order.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#9E9994] uppercase tracking-wider">Date</p>
                      <p className="text-sm font-semibold text-[#1E1A16]">{npFullDate(order.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#9E9994] uppercase tracking-wider">Payment</p>
                      <p className="text-sm font-semibold text-[#1E1A16]">{paymentLabel(order.payment_method)}</p>
                    </div>
                    <span className={`badge ${statusBadge(order.order_status)}`}>{order.order_status}</span>
                  </div>

                  {/* Status Timeline */}
                  <div className="flex items-center mb-5 px-2">
                    {statusSteps.map((s, i) => (
                      <div key={s} className="flex items-center flex-1 last:flex-none">
                        <div className={`flex flex-col items-center ${i <= currentStep ? 'text-[#2A7D4F]' : 'text-[#9E9994]'}`}>
                          <div className={`w-3 h-3 rounded-full ${i <= currentStep ? 'bg-[#2A7D4F]' : 'bg-[#E8E3DB]'}`} />
                          <span className="text-[9px] font-semibold mt-1 capitalize hidden sm:block">{s}</span>
                        </div>
                        {i < statusSteps.length - 1 && <div className={`h-0.5 flex-1 mx-2 ${i < currentStep ? 'bg-[#2A7D4F]' : 'bg-[#E8E3DB]'}`} />}
                      </div>
                    ))}
                  </div>

                  {/* Order Items */}
                  <div className="space-y-2 mb-4">
                    {order.order_items?.map(item => (
                      <div key={item.id} className="flex justify-between items-center py-2 border-b border-[#F0EBE3] last:border-0">
                        <div>
                          <p className="font-semibold text-sm text-[#1E1A16]">{item.product_name}</p>
                          <p className="text-xs text-[#9E9994]">Size: {item.size} · Qty: {item.quantity}</p>
                        </div>
                        <p className="font-bold text-sm text-[#1E1A16]">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer */}
                  <div className="flex justify-between items-center pt-3 border-t border-[#F0EBE3]">
                    <p className="text-xs text-[#9E9994]">Delivering to: <span className="font-semibold text-[#6B6560]">{order.customer_address}</span></p>
                    <p className="text-lg font-bold text-[#B5293A]">Rs. {order.total_amount?.toLocaleString()}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
