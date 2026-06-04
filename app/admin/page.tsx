'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, totalProducts: 0, pendingOrders: 0, deliveredOrders: 0, cancelledOrders: 0, lowStockProducts: 0, outOfStock: 0 })
  const [chartData, setChartData] = useState<{ date: string; revenue: number }[]>([])
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [statusBreakdown, setStatusBreakdown] = useState<Record<string, number>>({})
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => { checkAdmin() }, [])

  const checkAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/auth/login'); return }
    const { data: adminData } = await supabase.from('admins').select('email').eq('email', userData.user.email).single()
    if (!adminData) { router.push('/'); return }
    setAuthorized(true)
    fetchAnalytics()
  }

  const fetchAnalytics = async () => {
    try {
      const res = await fetch('/api/admin/analytics')
      const data = await res.json()
      if (data.stats) setStats(data.stats)
      if (data.chartData) setChartData(data.chartData)
      if (data.topProducts) setTopProducts(data.topProducts)
      if (data.statusBreakdown) setStatusBreakdown(data.statusBreakdown)
      if (data.recentOrders) setRecentOrders(data.recentOrders)
      if (data.recentActivity) setRecentActivity(data.recentActivity)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
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

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1)

  if (!authorized) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-400 text-sm">Verifying access...</p>
      </div>
    </div>
  )

  return (
    <div className="p-6 lg:p-8 text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold">Dashboard</h1>
          <p className="text-gray-400 mt-1">Your store overview at a glance</p>
        </div>
        <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-sm font-semibold transition">
          🚪 Logout
        </button>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Revenue', value: `Rs. ${stats.totalRevenue.toLocaleString()}`, icon: '💰', color: 'from-red-700 to-rose-800' },
          { label: 'Total Orders', value: stats.totalOrders, icon: '📦', color: 'from-blue-700 to-blue-800' },
          { label: 'Products', value: stats.totalProducts, icon: '👔', color: 'from-violet-700 to-violet-800' },
          { label: 'Pending', value: stats.pendingOrders, icon: '⏳', color: 'from-amber-600 to-amber-700' },
          { label: 'Delivered', value: stats.deliveredOrders, icon: '✅', color: 'from-emerald-700 to-emerald-800' },
          { label: 'Cancelled', value: stats.cancelledOrders, icon: '🚫', color: 'from-gray-600 to-gray-700' },
          { label: 'Low Stock', value: stats.lowStockProducts, icon: '⚠️', color: 'from-orange-600 to-orange-700' },
          { label: 'Out of Stock', value: stats.outOfStock, icon: '❌', color: 'from-red-800 to-red-900' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-4 sm:p-5 ${loading ? 'animate-pulse' : ''}`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className="text-xl sm:text-2xl font-extrabold">{loading ? '—' : s.value}</p>
            <p className="text-white/60 text-xs sm:text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* REVENUE CHART */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
        <h2 className="text-lg font-bold mb-4">📈 Revenue (Last 30 Days)</h2>
        {chartData.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No revenue data yet</p>
        ) : (
          <div className="flex items-end gap-1 h-48">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group relative">
                <div className="absolute bottom-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded hidden group-hover:block whitespace-nowrap z-10">
                  {d.date}: Rs. {d.revenue.toLocaleString()}
                </div>
                <div
                  className="w-full bg-red-600 rounded-t-md hover:bg-red-500 transition min-h-[4px]"
                  style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* TOP PRODUCTS */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">🏆 Top Products</h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 bg-gray-800/50 rounded-xl p-3">
                  <span className="text-lg font-extrabold text-gray-500 w-6">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.qty} sold</p>
                  </div>
                  <span className="font-bold text-red-400 text-sm">Rs. {p.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ORDER STATUS BREAKDOWN */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">📊 Order Status (30 Days)</h2>
          {Object.keys(statusBreakdown).length === 0 ? (
            <p className="text-gray-500 text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(statusBreakdown).map(([status, count]) => {
                const total = Object.values(statusBreakdown).reduce((a, b) => a + b, 0)
                const pct = total > 0 ? ((count as number) / total * 100) : 0
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="capitalize font-semibold">{status}</span>
                      <span className="text-gray-400">{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full ${status === 'pending' ? 'bg-amber-500' : status === 'processing' ? 'bg-blue-500' : status === 'shipped' ? 'bg-violet-500' : status === 'delivered' ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* QUICK LINKS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { href: '/admin/products', label: 'Products', icon: '👔', color: 'bg-blue-600' },
          { href: '/admin/orders', label: 'Orders', icon: '📦', color: 'bg-violet-600' },
          { href: '/admin/users', label: 'Users', icon: '👥', color: 'bg-emerald-600' },
          { href: '/admin/coupons', label: 'Coupons', icon: '🏷️', color: 'bg-amber-600' },
          { href: '/admin/settings', label: 'Settings', icon: '⚙️', color: 'bg-gray-600' },
          { href: '/admin/banners', label: 'Banners', icon: '🖼️', color: 'bg-pink-600' },
          { href: '/admin/reviews', label: 'Reviews', icon: '⭐', color: 'bg-yellow-600' },
          { href: '/admin/activity', label: 'Activity', icon: '📋', color: 'bg-cyan-600' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl p-4 flex items-center gap-3 transition group">
            <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center text-xl`}>{item.icon}</div>
            <span className="font-bold text-sm group-hover:text-white transition">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* RECENT ORDERS */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden mb-8">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800">
          <h2 className="text-lg font-bold">Recent Orders</h2>
          <Link href="/admin/orders" className="text-red-400 text-sm font-semibold hover:text-red-300">View All →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No orders yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  {['ID', 'Customer', 'Amount', 'Payment', 'Status'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: any) => (
                  <tr key={order.id} className="border-b border-gray-800/50 hover:bg-gray-800/40 transition">
                    <td className="px-6 py-4 font-mono text-xs text-gray-300">{order.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-sm">{order.customer_name}</p>
                      <p className="text-xs text-gray-400">{order.customer_phone}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-red-400 text-sm">Rs. {order.total_amount?.toLocaleString()}</td>
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

      {/* RECENT ACTIVITY */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4">📋 Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No activity logged yet</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map((log: any) => (
              <div key={log.id} className="flex items-start gap-3 bg-gray-800/50 rounded-xl p-3">
                <span className="text-lg mt-0.5">
                  {log.action === 'purchase' ? '🛍️' : log.action === 'signup' ? '👤' : log.action === 'login' ? '🔑' : log.action === 'page_view' ? '👁️' : log.action === 'add_to_cart' ? '🛒' : '📝'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{log.user_name || log.user_email || 'Anonymous'}</p>
                  <p className="text-xs text-gray-400">{log.action} {log.page ? `on ${log.page}` : ''}</p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
