'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

export default function AdminOrders() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => { checkAdmin() }, [])

  const checkAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/auth/login'); return }
    const { data: adminData } = await supabase.from('admins').select('email').eq('email', userData.user.email).single()
    if (!adminData) { router.push('/'); return }
    fetchOrders()
  }

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
    if (data) setOrders(data)
    setLoading(false)
  }

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId)
    const { data, error } = await supabase.from('orders').update({ order_status: newStatus }).eq('id', orderId).select()
    if (error) {
      alert('Failed to update order status: ' + error.message)
      console.error('orders.update error', error)
      setUpdating(null)
      return
    }
    if (data && data.length > 0) {
      setOrders(orders.map((o: any) => o.id === orderId ? { ...o, order_status: newStatus } : o))
    }
    setUpdating(null)
  }

  const updatePayment = async (orderId: string, newStatus: string) => {
    const { data, error } = await supabase.from('orders').update({ payment_status: newStatus }).eq('id', orderId).select()
    if (error) {
      alert('Failed to update payment status: ' + error.message)
      console.error('orders.update error', error)
      return
    }
    if (data && data.length > 0) {
      setOrders(orders.map((o: any) => o.id === orderId ? { ...o, payment_status: newStatus } : o))
    }
  }

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Cancel this order? The customer will see it as cancelled.')) return
    setCancellingId(orderId)
    const { data, error } = await supabase.from('orders').update({
      order_status: 'cancelled',
      payment_status: 'cancelled',
    }).eq('id', orderId).select()
    if (error) {
      alert('Failed to cancel order: ' + error.message)
      setCancellingId(null)
      console.error('orders.update cancel error', error)
      return
    }
    if (data && data.length > 0) {
      setOrders(orders.map((o: any) => o.id === orderId ? { ...o, order_status: 'cancelled', payment_status: 'cancelled' } : o))
    }
    setCancellingId(null)
  }

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Permanently DELETE this order? Cannot be undone.')) return
    const { error: itemError } = await supabase.from('order_items').delete().eq('order_id', orderId)
    if (itemError) {
      alert('Failed to delete order items: ' + itemError.message)
      console.error('order_items.delete error', itemError)
      return
    }
    const { error: orderError } = await supabase.from('orders').delete().eq('id', orderId).select()
    if (orderError) {
      alert('Failed to delete order: ' + orderError.message)
      console.error('orders.delete error', orderError)
      return
    }
    setOrders(orders.filter((o: any) => o.id !== orderId))
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      processing: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
      shipped: 'bg-violet-500/20 text-violet-300 border border-violet-500/40',
      delivered: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
      cancelled: 'bg-red-500/20 text-red-300 border border-red-500/40',
    }
    return map[s] || 'bg-gray-500/20 text-gray-300'
  }

  const paymentLabel = (m: string) => {
    const map: Record<string, string> = { khalti: '💜 Khalti', esewa: '💚 eSewa', cod: '💵 COD', bank: '🏦 Bank' }
    return map[m] || m
  }

  const counts: Record<string, number> = ['all', ...STATUS_OPTIONS].reduce((acc: Record<string, number>, s) => {
    acc[s] = s === 'all' ? orders.length : orders.filter((o: any) => o.order_status === s).length
    return acc
  }, {})

  const filtered = orders.filter((o: any) => {
    const matchesFilter = filter === 'all' || o.order_status === filter
    const matchesSearch = !search ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone?.includes(search) ||
      o.id.slice(0, 8).toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <main className="text-white">
      <div className="p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Orders</h1>
              <p className="text-gray-400 mt-1">{orders.length} total orders</p>
            </div>
            <input
              type="text"
              placeholder="Search by name, phone, ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 w-64"
            />
          </div>

          {/* FILTER TABS */}
          <div className="flex gap-2 flex-wrap mb-6">
            {['all', ...STATUS_OPTIONS].map(s => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition ${
                  filter === s ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}>
                {s} ({counts[s] || 0})
              </button>
            ))}
          </div>

          {/* ORDERS */}
          {loading ? (
            <div className="text-center py-20 text-gray-400">⏳ Loading orders...</div>
          ) : filtered.length === 0 ? (
            <div className="bg-gray-900 rounded-2xl p-16 text-center border border-gray-800">
              <div className="text-5xl mb-3">📭</div>
              <p className="text-gray-400">No orders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((order: any) => (
                <div key={order.id} className={`bg-gray-900 border rounded-2xl overflow-hidden transition ${
                  order.order_status === 'cancelled' ? 'border-red-500/30 opacity-75' : 'border-gray-800'
                }`}>
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-800 flex flex-wrap gap-4 justify-between items-start">
                    <div className="flex flex-wrap gap-6">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">ORDER ID</p>
                        <p className="font-mono font-bold text-white text-sm">{order.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">CUSTOMER</p>
                        <p className="font-bold text-white">{order.customer_name}</p>
                        <p className="text-xs text-blue-400">{order.customer_phone}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">ADDRESS</p>
                        <p className="text-sm text-gray-300">{order.customer_address}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">DATE</p>
                        <p className="text-sm text-gray-300">
                          {new Date(order.created_at).toLocaleDateString('en-NP', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">PAYMENT</p>
                        <p className="text-sm text-gray-300">{paymentLabel(order.payment_method)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">TOTAL</p>
                      <p className="text-2xl font-extrabold text-red-400">Rs. {order.total_amount?.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="px-6 py-3 border-b border-gray-800/50 bg-gray-800/20">
                    {order.order_items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm py-1.5">
                        <span className="text-gray-300">
                          {item.product_name}
                          <span className="text-gray-500 ml-2">× {item.quantity} | Size: {item.size}</span>
                        </span>
                        <span className="font-semibold text-white">Rs. {(item.price * item.quantity)?.toLocaleString()}</span>
                      </div>
                    ))}
                    {order.coupon_code && (
                      <div className="flex justify-between text-sm py-1.5 border-t border-gray-700 mt-1 pt-2">
                        <span className="text-emerald-400 font-semibold">🏷️ Coupon: {order.coupon_code}</span>
                        <span className="text-emerald-400 font-bold">- Rs. {(order.discount_amount || 0).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Controls */}
                  <div className="px-6 py-4 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-wrap gap-4 items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Order:</span>
                        <select
                          value={order.order_status}
                          onChange={e => updateStatus(order.id, e.target.value)}
                          disabled={updating === order.id || order.order_status === 'cancelled'}
                          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm font-semibold text-white capitalize focus:outline-none focus:border-blue-500 disabled:opacity-50">
                          {STATUS_OPTIONS.map(s => (
                            <option key={s} value={s} className="bg-gray-800 capitalize">{s}</option>
                          ))}
                        </select>
                        {updating === order.id && <span className="text-xs text-gray-500 animate-pulse">Saving...</span>}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Payment:</span>
                        <select
                          value={order.payment_status || 'pending'}
                          onChange={e => updatePayment(order.id, e.target.value)}
                          disabled={order.order_status === 'cancelled'}
                          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm font-semibold text-white focus:outline-none focus:border-blue-500 disabled:opacity-50">
                          <option value="pending" className="bg-gray-800">⏳ Pending</option>
                          <option value="paid" className="bg-gray-800">✅ Paid</option>
                          <option value="failed" className="bg-gray-800">❌ Failed</option>
                          <option value="cancelled" className="bg-gray-800">🚫 Cancelled</option>
                        </select>
                      </div>

                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize ${statusBadge(order.order_status)}`}>
                        {order.order_status}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          disabled={cancellingId === order.id}
                          className="bg-red-600/20 text-red-300 border border-red-500/30 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-600/40 transition disabled:opacity-50">
                          🚫 Cancel
                        </button>
                      )}
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="bg-gray-700/50 text-gray-400 border border-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-900/40 hover:text-red-300 transition">
                        🗑️ Delete
                      </button>
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