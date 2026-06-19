'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { npShortDate, npFullDate } from '../../lib/timezone'

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
  const [chartRange, setChartRange] = useState('30')

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

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      pending: 'badge-admin badge-admin-pending',
      processing: 'badge-admin badge-admin-processing',
      shipped: 'badge-admin badge-admin-shipped',
      delivered: 'badge-admin badge-admin-delivered',
      cancelled: 'badge-admin badge-admin-cancelled',
    }
    return map[s] || 'badge-admin badge-admin-inactive'
  }

  const paymentIcon = (m: string) => {
    const map: Record<string, string> = { khalti: 'K', esewa: 'eS', cod: 'COD', bank: 'B' }
    return map[m] || m
  }

  const actionIcon = (a: string) => {
    const map: Record<string, { color: string; icon: string }> = {
      purchase: { color: 'var(--admin-green)', icon: '$' },
      signup: { color: 'var(--admin-blue)', icon: '+' },
      login: { color: 'var(--admin-purple)', icon: '>' },
      page_view: { color: 'var(--admin-text-muted)', icon: '/' },
      add_to_cart: { color: 'var(--admin-yellow)', icon: 'C' },
      product_view: { color: 'var(--admin-text-soft)', icon: 'P' },
      checkout: { color: 'var(--admin-accent)', icon: '#' },
    }
    return map[a] || { color: 'var(--admin-text-muted)', icon: '.' }
  }

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1)
  const totalStatusOrders = Object.values(statusBreakdown).reduce((a, b) => a + b, 0)

  if (!authorized) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--admin-accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--admin-text-soft)', fontSize: 14 }}>Verifying access...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Dashboard</h1>
          <p className="admin-page-subtitle">Your store overview at a glance</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Revenue', value: `Rs. ${stats.totalRevenue.toLocaleString()}`, accent: 'var(--admin-green)', sub: 'Lifetime earnings' },
          { label: 'Total Orders', value: stats.totalOrders, accent: 'var(--admin-blue)', sub: `${stats.pendingOrders} pending` },
          { label: 'Products', value: stats.totalProducts, accent: 'var(--admin-purple)', sub: `${stats.lowStockProducts} low stock` },
          { label: 'Pending Orders', value: stats.pendingOrders, accent: 'var(--admin-yellow)', sub: 'Needs action' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ '--card-accent': s.accent } as any}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{loading ? '—' : s.value}</div>
            <div className="stat-change" style={{ color: 'var(--admin-text-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="admin-chart-container" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ font: '600 16px var(--admin-font-ui)', color: 'var(--admin-text)', margin: 0 }}>Revenue Trend</h2>
          <div style={{ display: 'flex', gap: 4 }}>
            {['7', '30', '90'].map(r => (
              <button key={r} onClick={() => setChartRange(r)}
                style={{
                  padding: '5px 12px', borderRadius: 6, border: 'none', cursor: 'pointer',
                  font: '500 12px var(--admin-font-ui)',
                  background: chartRange === r ? 'var(--admin-accent-dim)' : 'transparent',
                  color: chartRange === r ? 'var(--admin-accent)' : 'var(--admin-text-muted)',
                }}>
                {r === '7' ? '7D' : r === '30' ? '30D' : '90D'}
              </button>
            ))}
          </div>
        </div>
        {chartData.length === 0 ? (
          <div className="admin-empty"><p>No revenue data yet</p></div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 180 }}>
            {chartData.map((d, i) => (
              <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative' }}
                className="group">
                <div style={{
                  position: 'absolute', bottom: '100%', marginBottom: 8,
                  background: 'var(--admin-surface-3)', color: 'var(--admin-text)',
                  fontSize: 11, padding: '4px 8px', borderRadius: 6,
                  whiteSpace: 'nowrap', display: 'none', zIndex: 10,
                  font: '500 11px var(--admin-font-mono)',
                }} className="group-hover:block">
                  Rs. {d.revenue.toLocaleString()}
                </div>
                <div style={{
                  width: '100%',
                  background: `linear-gradient(to top, var(--admin-accent), rgba(232,69,96,0.6))`,
                  borderRadius: '3px 3px 0 0',
                  minHeight: 4,
                  height: `${(d.revenue / maxRevenue) * 100}%`,
                  transition: 'background 0.2s',
                  cursor: 'pointer',
                }} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 28 }}>
        {/* Top Products */}
        <div className="admin-card">
          <h2 style={{ font: '600 16px var(--admin-font-ui)', color: 'var(--admin-text)', margin: '0 0 16px' }}>Top Products</h2>
          {topProducts.length === 0 ? (
            <div className="admin-empty" style={{ padding: '30px 16px' }}><p>No sales data yet</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topProducts.map((p, i) => {
                const maxQty = Math.max(...topProducts.map(t => t.qty), 1)
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--admin-surface-2)' }}>
                    <span style={{ font: '700 14px var(--admin-font-mono)', color: 'var(--admin-text-muted)', width: 24 }}>#{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: '500 13px var(--admin-font-ui)', color: 'var(--admin-text)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ height: 4, background: 'var(--admin-surface-3)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(p.qty / maxQty) * 100}%`, background: 'var(--admin-accent)', borderRadius: 2 }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ font: '600 13px var(--admin-font-mono)', color: 'var(--admin-text)' }}>Rs. {p.total.toLocaleString()}</div>
                      <div style={{ font: '400 11px var(--admin-font-ui)', color: 'var(--admin-text-muted)' }}>{p.qty} sold</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Order Status */}
        <div className="admin-card">
          <h2 style={{ font: '600 16px var(--admin-font-ui)', color: 'var(--admin-text)', margin: '0 0 16px' }}>Order Status</h2>
          {Object.keys(statusBreakdown).length === 0 ? (
            <div className="admin-empty" style={{ padding: '30px 16px' }}><p>No orders yet</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(statusBreakdown).map(([status, count]) => {
                const pct = totalStatusOrders > 0 ? ((count as number) / totalStatusOrders * 100) : 0
                const colors: Record<string, string> = { pending: 'var(--admin-yellow)', processing: 'var(--admin-blue)', shipped: 'var(--admin-purple)', delivered: 'var(--admin-green)', cancelled: 'var(--admin-red)' }
                return (
                  <div key={status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ font: '500 13px var(--admin-font-ui)', color: 'var(--admin-text)', textTransform: 'capitalize' }}>{status}</span>
                      <span style={{ font: '500 12px var(--admin-font-mono)', color: 'var(--admin-text-muted)' }}>{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--admin-surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: colors[status] || 'var(--admin-text-muted)', borderRadius: 3, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="admin-table-container" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--admin-border)' }}>
          <h2 style={{ font: '600 16px var(--admin-font-ui)', color: 'var(--admin-text)', margin: 0 }}>Recent Orders</h2>
          <Link href="/admin/orders" style={{ font: '500 13px var(--admin-font-ui)', color: 'var(--admin-accent)', textDecoration: 'none' }}>View All →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="admin-empty" style={{ padding: '40px 20px' }}><p>No orders yet</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order: any) => (
                <tr key={order.id}>
                  <td className="order-id">{order.id.slice(0, 8).toUpperCase()}</td>
                  <td>
                    <div style={{ font: '500 13px var(--admin-font-ui)', color: 'var(--admin-text)' }}>{order.customer_name}</div>
                    <div style={{ font: '400 12px var(--admin-font-ui)', color: 'var(--admin-text-muted)' }}>{order.customer_phone}</div>
                  </td>
                  <td style={{ font: '600 13px var(--admin-font-mono)', color: 'var(--admin-text)' }}>Rs. {order.total_amount?.toLocaleString()}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '3px 8px', borderRadius: 4,
                      background: 'var(--admin-surface-3)',
                      font: '500 12px var(--admin-font-mono)', color: 'var(--admin-text-soft)',
                    }}>
                      {paymentIcon(order.payment_method)}
                    </span>
                  </td>
                  <td><span className={statusBadge(order.order_status)} style={{ textTransform: 'capitalize' }}>{order.order_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent Activity */}
      <div className="admin-card">
        <h2 style={{ font: '600 16px var(--admin-font-ui)', color: 'var(--admin-text)', margin: '0 0 16px' }}>Recent Activity</h2>
        {recentActivity.length === 0 ? (
          <div className="admin-empty" style={{ padding: '30px 16px' }}><p>No activity logged yet</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {recentActivity.slice(0, 10).map((log: any) => {
              const ai = actionIcon(log.action)
              return (
                <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--admin-surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: `${ai.color}20`, color: ai.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    font: '600 13px var(--admin-font-mono)', flexShrink: 0,
                  }}>{ai.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ font: '500 13px var(--admin-font-ui)', color: 'var(--admin-text)' }}>{log.user_name || log.user_email || 'Anonymous'}</div>
                    <div style={{ font: '400 12px var(--admin-font-ui)', color: 'var(--admin-text-muted)' }}>{log.action.replace(/_/g, ' ')} {log.page ? `on ${log.page}` : ''}</div>
                  </div>
                  <span style={{ font: '400 12px var(--admin-font-mono)', color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>
                    {npShortDate(log.created_at)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
