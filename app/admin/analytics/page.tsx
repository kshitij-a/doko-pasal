'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { adminFetch } from '../../../lib/admin-fetch'
import { npDateTime } from '../../../lib/timezone'

const STATUS_COLORS: Record<string, string> = {
  pending: 'var(--admin-yellow)', processing: 'var(--admin-blue)', shipped: 'var(--admin-purple)',
  delivered: 'var(--admin-green)', cancelled: 'var(--admin-red)',
}

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
    try { const res = await adminFetch('/api/admin/analytics'); const d = await res.json(); setData(d) } catch (e) { console.error(e) }
    setLoading(false)
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading analytics...</div>
  if (!data) return <div style={{ padding: 40, color: 'var(--admin-text)' }}>Failed to load analytics</div>

  const { stats, chartData, topProducts, statusBreakdown, recentActivity } = data
  const maxRevenue = Math.max(...chartData.map((d: any) => d.revenue), 1)

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Analytics</h1>
          <p className="admin-page-subtitle">Deep insights into store performance</p>
        </div>
        <select className="admin-input" style={{ width: 140, padding: '8px 12px' }} value={period} onChange={e => setPeriod(e.target.value)}>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Revenue', value: `Rs. ${stats.totalRevenue.toLocaleString()}`, color: 'var(--admin-accent)' },
          { label: 'Total Orders', value: stats.totalOrders, color: 'var(--admin-blue)' },
          { label: 'Products', value: stats.totalProducts, color: 'var(--admin-purple)' },
          { label: 'Low Stock', value: stats.lowStockProducts, color: 'var(--admin-yellow)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ width: 4, height: 32, borderRadius: 2, background: s.color, position: 'absolute', top: 16, left: 0 }} />
            <p style={{ font: '400 12px var(--admin-font-ui)', color: 'var(--admin-text-muted)', marginBottom: 4 }}>{s.label}</p>
            <p style={{ font: '700 22px var(--admin-font-mono)', color: 'var(--admin-text)', letterSpacing: '-0.02em' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="admin-chart-container" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ font: '600 15px var(--admin-font-ui)', color: 'var(--admin-text)' }}>Revenue Trend</h3>
          <span style={{ font: '400 12px var(--admin-font-ui)', color: 'var(--admin-text-muted)' }}>Last {period} days</span>
        </div>
        {chartData.length === 0 ? (
          <div className="admin-empty" style={{ padding: 40 }}><p>No revenue data yet</p></div>
        ) : (
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 200, padding: '0 4px' }}>
              {chartData.map((d: any, i: number) => (
                <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative', minWidth: 0 }}
                  className="group">
                  <div style={{ position: 'absolute', bottom: '100%', marginBottom: 8, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)', borderRadius: 6, padding: '4px 8px', fontSize: 11, fontFamily: 'var(--admin-font-mono)', color: 'var(--admin-text)', whiteSpace: 'nowrap', opacity: 0, pointerEvents: 'none', transition: 'opacity 0.15s', zIndex: 10 }}
                    className="group-hover:opacity-100">
                    Rs. {d.revenue.toLocaleString()}
                  </div>
                  <div style={{
                    width: '100%', borderRadius: '3px 3px 0 0', transition: 'all 0.2s', cursor: 'pointer',
                    background: `linear-gradient(to top, var(--admin-accent), rgba(232,69,96,0.6))`,
                    minHeight: 2,
                    height: `${(d.revenue / maxRevenue) * 100}%`,
                  }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, fontFamily: 'var(--admin-font-ui)', color: 'var(--admin-text-muted)' }}>
              <span>{chartData[0]?.date}</span>
              <span>{chartData[chartData.length - 1]?.date}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        {/* Top Products */}
        <div className="admin-card" style={{ padding: 20 }}>
          <h3 style={{ font: '600 15px var(--admin-font-ui)', color: 'var(--admin-text)', marginBottom: 12 }}>Top Products</h3>
          {topProducts.length === 0 ? (
            <div className="admin-empty" style={{ padding: 20 }}><p>No sales data</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {topProducts.map((p: any, i: number) => {
                const maxQty = topProducts[0]?.qty || 1
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: i < 3 ? 'var(--admin-surface-2)' : 'transparent' }}>
                    <span style={{
                      width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      font: '700 11px var(--admin-font-mono)',
                      background: i < 3 ? 'rgba(245,158,11,0.15)' : 'var(--admin-surface-3)',
                      color: i < 3 ? 'var(--admin-yellow)' : 'var(--admin-text-muted)',
                    }}>#{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ font: '500 13px var(--admin-font-ui)', color: 'var(--admin-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ height: 3, borderRadius: 2, background: 'var(--admin-surface-3)', marginTop: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 2, background: 'var(--admin-accent)', width: `${(p.qty / maxQty) * 100}%`, transition: 'width 0.5s ease' }} />
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
        <div className="admin-card" style={{ padding: 20 }}>
          <h3 style={{ font: '600 15px var(--admin-font-ui)', color: 'var(--admin-text)', marginBottom: 12 }}>Order Status</h3>
          {Object.keys(statusBreakdown).length === 0 ? (
            <div className="admin-empty" style={{ padding: 20 }}><p>No orders yet</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(statusBreakdown).map(([status, count]) => {
                const total = Object.values(statusBreakdown).reduce((a: number, b: any) => a + b, 0) as number
                const pct = total > 0 ? ((count as number) / total * 100) : 0
                return (
                  <div key={status}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ font: '500 13px var(--admin-font-ui)', color: 'var(--admin-text)', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: STATUS_COLORS[status] || 'var(--admin-text-muted)' }} />
                        {status}
                      </span>
                      <span style={{ font: '400 12px var(--admin-font-mono)', color: 'var(--admin-text-muted)' }}>{count as number} · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="admin-progress"><div style={{ width: `${pct}%`, background: STATUS_COLORS[status] || 'var(--admin-text-muted)' }} /></div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="admin-card" style={{ padding: 20 }}>
        <h3 style={{ font: '600 15px var(--admin-font-ui)', color: 'var(--admin-text)', marginBottom: 12 }}>Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <div className="admin-empty" style={{ padding: 20 }}><p>No activity logged yet</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {recentActivity.map((log: any) => {
              const actionIcons: Record<string, string> = { purchase: '🛍️', signup: '👤', login: '🔑', add_to_cart: '🛒', checkout: '💳', view_product: '👁️' }
              return (
                <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8 }}>
                  <span style={{ fontSize: 16, width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--admin-surface-2)' }}>
                    {actionIcons[log.action] || '📝'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ font: '500 13px var(--admin-font-ui)', color: 'var(--admin-text)' }}>{log.user_name || log.user_email || 'Anonymous'}</span>
                    <span style={{ font: '400 12px var(--admin-font-ui)', color: 'var(--admin-text-muted)', marginLeft: 6 }}>{log.action.replace(/_/g, ' ')}</span>
                  </div>
                  <span style={{ font: '400 11px var(--admin-font-ui)', color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>
                    {npDateTime(log.created_at)}
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
