'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

export default function AdminOrders() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState(null)
  const [search, setSearch] = useState('')
  const [cancelNote, setCancelNote] = useState('')
  const [cancellingId, setCancellingId] = useState(null)

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

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId)
    await supabase.from('orders').update({ order_status: newStatus }).eq('id', orderId)
    setOrders(orders.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o))
    setUpdating(null)
  }

  const updatePayment = async (orderId, newStatus) => {
    await supabase.from('orders').update({ payment_status: newStatus }).eq('id', orderId)
    setOrders(orders.map(o => o.id === orderId ? { ...o, payment_status: newStatus } : o))
  }

  const cancelOrder = async (orderId) => {
    if (!confirm(`Cancel this order? The customer will see their order as cancelled.`)) return
    setCancellingId(orderId)
    await supabase.from('orders').update({
      order_status: 'cancelled',
      payment_status: 'cancelled',
      cancel_note: cancelNote || 'Cancelled by admin'
    }).eq('id', orderId)
    setOrders(orders.map(o => o.id === orderId ? { ...o, order_status: 'cancelled', payment_status: 'cancelled' } : o))
    setCancellingId(null)
    setCancelNote('')
  }

  const deleteOrder = async (orderId) => {
    if (!confirm('Permanently DELETE this order? This cannot be undone.')) return
    await supabase.from('order_items').delete().eq('order_id', orderId)
    await supabase.from('orders').delete().eq('id', orderId)
    setOrders(orders.filter(o => o.id !== orderId))
  }

  const statusBadge = (s) => {
    const map = {
      pending: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      processing: 'bg-blue-500/20 text-blue-300 border border-blue-500/40',
      shipped: 'bg-violet-500/20 text-violet-300 border border-violet-500/40',
      delivered: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
      cancelled: 'bg-red-500/20 text-red-300 border border-red-500/40',
    }
    return map[s] || 'bg-gray-500/20 text-gray-300'
  }

  const paymentLabel = (m) => {
    const map = { khalti: '💜 Khalti', esewa: '💚 eSewa', cod: '💵 COD', bank: '🏦 Bank' }
    return map[m] || m
  }

  const counts = ['all', ...STATUS_OPTIONS].reduce((acc, s) => {
    acc[s] = s === 'all' ? orders.length : orders.filter(o => o.order_status === s).length
    return acc
  }, {})

  const filtered = orders.filter(o => {
    const matchesFilter = filter === 'all' || o.order_status === filter
    const matchesSearch = !search || 
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone?.includes(search) ||
      o.id.slice(0,8).toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="flex">
        {/* SIDEBAR */}
        <aside className="w-64 min-h-screen bg-gray-900 border-r border-gray-800 fixed left-0 top-0 flex flex-col z-50">
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-xl">🧺</div>
              <div>
                <p className="font-bold text-white">Doko Pasal</p>
                <p className="text-xs text-red-400 font-semibold tracking-widest">ADMIN</p>
              </div>
            </div>
          </div>
          <nav className="p-4 flex-1 space-y-1">
            {[
              { href: '/admin', label: 'Dashboard', icon: '📊' },
              { href: '/admin/products', label: 'Products', icon: '👔' },
              { href: '/admin/orders', label: 'All Orders', icon: '📦' },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-800 hover:text-white transition font-medium">
                <span>{item.icon}</span>{item.label}
              </Link>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-800">
            <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800 text-sm transition">
              🏪 View Store
            </Link>
          </div>
        </aside>

        {/* MAIN */}
        <div className="ml-64 flex-1 p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Orders</h1>
              <p className="text-gray-400 mt-1">{orders.length} total orders</p>
            </div>
            {/* Search */}
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
                  filter === s
                    ? 'bg-white text-gray-900'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}>
                {s} <span className="ml-1 opacity-70">({counts[s] || 0})</span>
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
              {filtered.map(order => (
                <div key={order.id} className={`bg-gray-900 border rounded-2xl overflow-hidden transition ${
                  order.order_status === 'cancelled' ? 'border-red-500/30 opacity-75' : 'border-gray-800'
                }`}>
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-gray-800 flex flex-wrap gap-4 justify-between items-start">
                    <div className="flex flex-wrap gap-6">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">ORDER ID</p>
                        <p className="font-mono font-bold text-white text-sm">{order.id.slice(0,8).toUpperCase()}</p>
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
                    {order.order_items?.map(item => (
                      <div key={item.id} className="flex justify-between text-sm py-1.5">
                        <span className="text-gray-300">
                          {item.product_name}
                          <span className="text-gray-500 ml-2">× {item.quantity} | Size: {item.size}</span>
                        </span>
                        <span className="font-semibold text-white">Rs. {(item.price * item.quantity)?.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  {/* Controls */}
                  <div className="px-6 py-4 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex flex-wrap gap-4 items-center">
                      {/* Order Status */}
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

                      {/* Payment Status */}
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
                        </select>
                      </div>

                      {/* Current Status Badge */}
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize ${statusBadge(order.order_status)}`}>
                        {order.order_status}
                      </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (
                        <button
                          onClick={() => cancelOrder(order.id)}
                          disabled={cancellingId === order.id}
                          className="bg-red-600/20 text-red-300 border border-red-500/30 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-600/40 transition disabled:opacity-50">
                          🚫 Cancel Order
                        </button>
                      )}
                      <button
                        onClick={() => deleteOrder(order.id)}
                        className="bg-gray-700/50 text-gray-400 border border-gray-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-900/40 hover:text-red-300 hover:border-red-500/30 transition">
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}