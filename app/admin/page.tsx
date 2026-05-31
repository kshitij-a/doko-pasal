'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({ orders: 0, products: 0, revenue: 0, pending: 0, delivered: 0, cancelled: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [adminEmail, setAdminEmail] = useState('')

  useEffect(() => { checkAdmin() }, [])

  const checkAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/auth/login'); return }
    const { data: adminData } = await supabase.from('admins').select('email').eq('email', userData.user.email).single()
    if (!adminData) { router.push('/'); return }
    setAdminEmail(userData.user.email)
    fetchStats()
    fetchRecentOrders()
  }

  const fetchStats = async () => {
    const { data: orders } = await supabase.from('orders').select('total_amount, order_status')
    const { data: products } = await supabase.from('products').select('id')
    if (orders) {
      setStats({
        orders: orders.length,
        products: products?.length || 0,
        revenue: orders.filter(o => o.order_status !== 'cancelled').reduce((s, o) => s + (o.total_amount || 0), 0),
        pending: orders.filter(o => o.order_status === 'pending').length,
        delivered: orders.filter(o => o.order_status === 'delivered').length,
        cancelled: orders.filter(o => o.order_status === 'cancelled').length,
      })
    }
    setLoading(false)
  }

  const fetchRecentOrders = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(8)
    if (data) setRecentOrders(data)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
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

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Loading admin panel...</p>
      </div>
    </div>
  )

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
            <div className="mt-4 bg-gray-800 rounded-xl p-3">
              <p className="text-xs text-gray-500">Logged in as</p>
              <p className="text-xs text-green-400 font-semibold truncate mt-0.5">{adminEmail}</p>
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

          <div className="p-4 border-t border-gray-800 space-y-1">
            <Link href="/" target="_blank" className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-gray-800 hover:text-white transition text-sm">
              🏪 View Live Store
            </Link>
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition text-sm font-semibold">
              🚪 Logout
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="ml-64 flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-extrabold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-1">Your store overview at a glance</p>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total Revenue', value: `Rs. ${stats.revenue.toLocaleString()}`, icon: '💰', bg: 'bg-gradient-to-br from-red-700 to-rose-800' },
              { label: 'Total Orders', value: stats.orders, icon: '📦', bg: 'bg-gradient-to-br from-blue-700 to-blue-800' },
              { label: 'Products Listed', value: stats.products, icon: '👔', bg: 'bg-gradient-to-br from-violet-700 to-violet-800' },
              { label: 'Pending Orders', value: stats.pending, icon: '⏳', bg: 'bg-gradient-to-br from-amber-600 to-amber-700' },
              { label: 'Delivered', value: stats.delivered, icon: '✅', bg: 'bg-gradient-to-br from-emerald-700 to-emerald-800' },
              { label: 'Cancelled', value: stats.cancelled, icon: '🚫', bg: 'bg-gradient-to-br from-gray-700 to-gray-800' },
            ].map(stat => (
              <div key={stat.label} className={`${stat.bg} rounded-2xl p-5`}>
                <div className="text-3xl mb-3">{stat.icon}</div>
                <p className="text-3xl font-extrabold text-white">{stat.value}</p>
                <p className="text-white/60 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* QUICK LINKS */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Link href="/admin/products" className="bg-gray-900 border border-gray-700 hover:border-blue-500 rounded-2xl p-5 flex items-center gap-4 transition group">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-2xl">➕</div>
              <div>
                <p className="font-bold text-white">Add / Edit Products</p>
                <p className="text-gray-400 text-sm">Upload images, prices, sizes</p>
              </div>
            </Link>
            <Link href="/admin/orders" className="bg-gray-900 border border-gray-700 hover:border-violet-500 rounded-2xl p-5 flex items-center gap-4 transition group">
              <div className="w-14 h-14 bg-violet-600 rounded-xl flex items-center justify-center text-2xl">📋</div>
              <div>
                <p className="font-bold text-white">Manage Orders</p>
                <p className="text-gray-400 text-sm">Ship, deliver, cancel orders</p>
              </div>
            </Link>
          </div>

          {/* RECENT ORDERS TABLE */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-bold text-white">Recent Orders</h2>
              <Link href="/admin/orders" className="text-red-400 text-sm font-semibold hover:text-red-300 transition">View All →</Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="text-center py-16 text-gray-500">No orders yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['Order ID','Customer','Amount','Payment','Status'].map(h => (
                        <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order.id} className="border-b border-gray-800/50 hover:bg-gray-800/40 transition">
                        <td className="px-6 py-4 font-mono text-xs text-gray-300">{order.id.slice(0,8).toUpperCase()}</td>
                        <td className="px-6 py-4">
                          <p className="font-semibold text-white">{order.customer_name}</p>
                          <p className="text-xs text-gray-400">{order.customer_phone}</p>
                        </td>
                        <td className="px-6 py-4 font-bold text-red-400">Rs. {order.total_amount?.toLocaleString()}</td>
                        <td className="px-6 py-4 text-sm text-gray-300">{paymentLabel(order.payment_method)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${statusBadge(order.order_status)}`}>
                            {order.order_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}