'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useRouter } from 'next/navigation'
import { npFullDate } from '../../../lib/timezone'

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  pending: { bg: 'rgba(245,158,11,0.1)', text: 'var(--admin-yellow)', border: 'rgba(245,158,11,0.25)' },
  processing: { bg: 'rgba(59,130,246,0.1)', text: 'var(--admin-blue)', border: 'rgba(59,130,246,0.25)' },
  shipped: { bg: 'rgba(168,85,247,0.1)', text: 'var(--admin-purple)', border: 'rgba(168,85,247,0.25)' },
  delivered: { bg: 'rgba(34,197,94,0.1)', text: 'var(--admin-green)', border: 'rgba(34,197,94,0.25)' },
  cancelled: { bg: 'rgba(239,68,68,0.1)', text: 'var(--admin-red)', border: 'rgba(239,68,68,0.25)' },
}
const PAYMENT_ICONS: Record<string, string> = { khalti: '💜', esewa: '💚', cod: '💵', bank: '🏦' }

export default function AdminOrders() {
  const router = useRouter()
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => { checkAdmin() }, [])

  const checkAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/auth/login'); return }
    const { data: adminData } = await supabase.from('admins').select('email').eq('email', userData.user.email).single()
    if (!adminData) { router.push('/'); return }
    fetchOrders()
  }

  const fetchOrders = async () => {
    const { data } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false })
    if (data) setOrders(data)
    setLoading(false)
  }

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId)
    const { error } = await supabase.from('orders').update({ order_status: newStatus }).eq('id', orderId)
    if (error) { alert('Failed: ' + error.message); setUpdating(null); return }
    setOrders(orders.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o))
    setUpdating(null)
  }

  const updatePayment = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('orders').update({ payment_status: newStatus }).eq('id', orderId)
    if (error) { alert('Failed: ' + error.message); return }
    setOrders(orders.map(o => o.id === orderId ? { ...o, payment_status: newStatus } : o))
  }

  const cancelOrder = async (orderId: string) => {
    if (!confirm('Cancel this order?')) return
    const { error } = await supabase.from('orders').update({ order_status: 'cancelled', payment_status: 'cancelled' }).eq('id', orderId)
    if (error) { alert('Failed: ' + error.message); return }
    setOrders(orders.map(o => o.id === orderId ? { ...o, order_status: 'cancelled', payment_status: 'cancelled' } : o))
  }

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Permanently DELETE this order?')) return
    await supabase.from('order_items').delete().eq('order_id', orderId)
    await supabase.from('orders').delete().eq('id', orderId)
    setOrders(orders.filter(o => o.id !== orderId))
  }

  const counts: Record<string, number> = { all: orders.length }
  STATUS_OPTIONS.forEach(s => { counts[s] = orders.filter(o => o.order_status === s).length })

  const filtered = orders.filter(o => {
    const matchesFilter = filter === 'all' || o.order_status === filter
    const matchesSearch = !search ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_phone?.includes(search) ||
      o.id.slice(0, 8).toLowerCase().includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const totalRevenue = orders.filter(o => o.order_status !== 'cancelled').reduce((sum, o) => sum + (o.total_amount || 0), 0)
  const pendingCount = counts.pending + counts.processing

  return (
    <div>
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Orders</h1>
          <p className="admin-page-subtitle">
            {orders.length} total · {pendingCount} pending/processing · Rs. {totalRevenue.toLocaleString()} revenue
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)', width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input className="admin-search" placeholder="Search name, phone, ID..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280 }} />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="admin-filter-tabs">
        {['all', ...STATUS_OPTIONS].map(s => (
          <button key={s} className={`admin-filter-tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            <span style={{
              marginLeft: 6, padding: '1px 7px', borderRadius: 10, fontSize: 11, fontWeight: 600, fontFamily: 'var(--admin-font-mono)',
              background: filter === s ? 'rgba(255,255,255,0.15)' : 'var(--admin-surface-3)',
              color: filter === s ? 'white' : 'var(--admin-text-muted)',
            }}>{counts[s] || 0}</span>
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon">📭</div>
          <h3>No orders found</h3>
          <p>{search || filter !== 'all' ? 'Try adjusting your filters' : 'No orders yet'}</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(order => {
            const isExpanded = expandedId === order.id
            const sc = STATUS_COLORS[order.order_status] || STATUS_COLORS.pending
            return (
              <div key={order.id} style={{
                background: 'var(--admin-surface)', border: '1px solid', borderRadius: 12, overflow: 'hidden',
                borderColor: order.order_status === 'cancelled' ? 'rgba(239,68,68,0.25)' : 'var(--admin-border)',
                opacity: order.order_status === 'cancelled' ? 0.7 : 1, transition: 'all 0.2s',
              }}>
                {/* Summary Row */}
                <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', flexWrap: 'wrap' }}
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}>

                  {/* Order ID + Date */}
                  <div style={{ minWidth: 120 }}>
                    <div style={{ font: '600 13px var(--admin-font-mono)', color: 'var(--admin-text)' }}>#{order.id.slice(0, 8).toUpperCase()}</div>
                    <div style={{ font: '400 11px var(--admin-font-ui)', color: 'var(--admin-text-muted)', marginTop: 2 }}>
                      {npFullDate(order.created_at)}
                    </div>
                  </div>

                  {/* Customer */}
                  <div style={{ minWidth: 140 }}>
                    <div style={{ font: '500 13px var(--admin-font-ui)', color: 'var(--admin-text)' }}>{order.customer_name}</div>
                    <div style={{ font: '400 11px var(--admin-font-ui)', color: 'var(--admin-text-muted)' }}>{order.customer_phone}</div>
                  </div>

                  {/* Items Count */}
                  <div style={{ minWidth: 80 }}>
                    <div style={{ font: '500 13px var(--admin-font-mono)', color: 'var(--admin-text-soft)' }}>
                      {order.order_items?.length || 0} item{(order.order_items?.length || 0) !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Payment */}
                  <div style={{ minWidth: 80 }}>
                    <span style={{ font: '400 12px var(--admin-font-ui)', color: 'var(--admin-text-soft)' }}>
                      {PAYMENT_ICONS[order.payment_method] || ''} {order.payment_method?.toUpperCase() || 'COD'}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <span style={{
                    padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                    background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
                  }}>{order.order_status}</span>

                  {/* Total */}
                  <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                    <div style={{ font: '700 16px var(--admin-font-mono)', color: 'var(--admin-accent)' }}>Rs. {order.total_amount?.toLocaleString()}</div>
                  </div>

                  {/* Expand Arrow */}
                  <svg style={{ width: 16, height: 16, color: 'var(--admin-text-muted)', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--admin-border)', padding: 20, background: 'var(--admin-bg)' }}>
                    {/* Items */}
                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ font: '600 12px var(--admin-font-ui)', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 8px' }}>Order Items</h4>
                      {order.order_items?.map((item: any) => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--admin-border)' }}>
                          <span style={{ font: '400 13px var(--admin-font-ui)', color: 'var(--admin-text)' }}>
                            {item.product_name} <span style={{ color: 'var(--admin-text-muted)' }}>× {item.quantity} · {item.size}</span>
                          </span>
                          <span style={{ font: '500 13px var(--admin-font-mono)', color: 'var(--admin-text)' }}>Rs. {(item.price * item.quantity)?.toLocaleString()}</span>
                        </div>
                      ))}
                      {order.coupon_code && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: 'var(--admin-green)' }}>
                          <span style={{ font: '500 13px var(--admin-font-ui)' }}>🏷️ {order.coupon_code}</span>
                          <span style={{ font: '600 13px var(--admin-font-mono)' }}>- Rs. {(order.discount_amount || 0).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Address */}
                    <div style={{ marginBottom: 16 }}>
                      <h4 style={{ font: '600 12px var(--admin-font-ui)', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Delivery Address</h4>
                      <p style={{ font: '400 13px var(--admin-font-ui)', color: 'var(--admin-text)', margin: 0 }}>{order.customer_address}</p>
                    </div>

                    {/* Controls */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ font: '500 11px var(--admin-font-ui)', color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Order:</span>
                        <select className="admin-input" style={{ padding: '5px 10px', fontSize: 12, width: 'auto' }}
                          value={order.order_status}
                          onChange={e => updateStatus(order.id, e.target.value)}
                          disabled={updating === order.id || order.order_status === 'cancelled'}>
                          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ font: '500 11px var(--admin-font-ui)', color: 'var(--admin-text-muted)', textTransform: 'uppercase' }}>Payment:</span>
                        <select className="admin-input" style={{ padding: '5px 10px', fontSize: 12, width: 'auto' }}
                          value={order.payment_status || 'pending'}
                          onChange={e => updatePayment(order.id, e.target.value)}
                          disabled={order.order_status === 'cancelled'}>
                          <option value="pending">Pending</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        {order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (
                          <button className="btn-admin-ghost" style={{ color: 'var(--admin-red)', fontSize: 12, padding: '5px 12px' }} onClick={() => cancelOrder(order.id)}>Cancel Order</button>
                        )}
                        <button className="btn-admin-ghost" style={{ color: 'var(--admin-red)', fontSize: 12, padding: '5px 12px' }} onClick={() => deleteOrder(order.id)}>Delete</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
