'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AdminAnalytics() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [period, setPeriod] = useState('30')

  useEffect(() => { checkAdmin() }, [])

  const checkAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/auth/login'); return }
    const { data: adminData } = await supabase.from('admins').select('email').eq('email', userData.user.email).single()
    if (!adminData) { router.push('/'); return }
    fetchData()
  }

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/analytics')
      const d = await res.json()
      setData(d)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!data) return <div className="p-8 text-white">Failed to load analytics</div>

  const { stats, chartData, topProducts, statusBreakdown, recentActivity } = data
  const maxRevenue = Math.max(...chartData.map((d: any) => d.revenue), 1)

  return (
    <div className="p-8 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold">📈 Analytics</h1>
        <p className="text-gray-400 mt-1">Deep insights into your store performance</p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Revenue', value: `Rs. ${stats.totalRevenue.toLocaleString()}`, icon: '💰', color: 'from-red-700 to-rose-800' },
          { label: 'Orders', value: stats.totalOrders, icon: '📦', color: 'from-blue-700 to-blue-800' },
          { label: 'Products', value: stats.totalProducts, icon: '👔', color: 'from-violet-700 to-violet-800' },
          { label: 'Low Stock', value: stats.lowStockProducts, icon: '⚠️', color: 'from-orange-600 to-orange-700' },
        ].map(s => (
          <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5`}>
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className="text-2xl font-extrabold">{s.value}</p>
            <p className="text-white/60 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* REVENUE CHART */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold">Revenue Trend (Last 30 Days)</h2>
        </div>
        {chartData.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No revenue data yet</p>
        ) : (
          <div className="relative">
            <div className="flex items-end gap-px h-56">
              {chartData.map((d: any, i: number) => (
                <div key={i} className="flex-1 flex flex-col items-center group relative min-w-0">
                  <div className="absolute bottom-full mb-2 bg-gray-800 text-white text-xs px-2 py-1 rounded hidden group-hover:block whitespace-nowrap z-10 shadow-lg">
                    {d.date}: Rs. {d.revenue.toLocaleString()}
                  </div>
                  <div
                    className="w-full bg-gradient-to-t from-red-700 to-red-500 rounded-t hover:from-red-600 hover:to-red-400 transition-all cursor-pointer min-h-[2px]"
                    style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>{chartData[0]?.date}</span>
              <span>{chartData[chartData.length - 1]?.date}</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8 mb-8">
        {/* TOP PRODUCTS */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">🏆 Top Products by Revenue</h2>
          {topProducts.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No sales data</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p: any, i: number) => (
                <div key={p.id} className="flex items-center gap-3 bg-gray-800/50 rounded-xl p-3">
                  <span className={`text-lg font-extrabold w-8 h-8 rounded-full flex items-center justify-center ${i < 3 ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-700 text-gray-400'}`}>
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.qty} units sold</p>
                  </div>
                  <span className="font-bold text-red-400 text-sm">Rs. {p.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ORDER STATUS */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">📊 Order Status Breakdown</h2>
          {Object.keys(statusBreakdown).length === 0 ? (
            <p className="text-gray-500 text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(statusBreakdown).map(([status, count]) => {
                const total = Object.values(statusBreakdown).reduce((a: number, b: any) => a + b, 0)
                const pct = total > 0 ? ((count as number) / total * 100) : 0
                const colors: Record<string, string> = {
                  pending: 'bg-amber-500', processing: 'bg-blue-500', shipped: 'bg-violet-500',
                  delivered: 'bg-emerald-500', cancelled: 'bg-red-500'
                }
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="capitalize font-semibold flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${colors[status] || 'bg-gray-500'}`} />
                        {status}
                      </span>
                      <span className="text-gray-400">{count as number} orders ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-3">
                      <div className={`h-3 rounded-full transition-all ${colors[status] || 'bg-gray-500'}`}
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4">📋 Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No activity logged yet. Activity tracking will start once users interact with the store.</p>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((log: any) => (
              <div key={log.id} className="flex items-center gap-3 bg-gray-800/30 rounded-xl px-4 py-3">
                <span className="text-lg">
                  {log.action === 'purchase' ? '🛍️' : log.action === 'signup' ? '👤' : log.action === 'login' ? '🔑' : log.action === 'add_to_cart' ? '🛒' : log.action === 'checkout' ? '💳' : '📝'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{log.user_name || log.user_email || 'Anonymous'}</p>
                  <p className="text-xs text-gray-400">{log.action.replace(/_/g, ' ')}{log.page ? ` — ${log.page}` : ''}</p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {new Date(log.created_at).toLocaleDateString('en-NP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
