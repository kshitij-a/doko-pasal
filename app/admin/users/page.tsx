'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { adminFetch } from '../../../lib/admin-fetch'
import { npFullDate } from '../../../lib/timezone'

export default function AdminUsers() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', email: '' })
  const [toast, setToast] = useState('')
  const [userOrders, setUserOrders] = useState<any[]>([])
  const [showOrders, setShowOrders] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { checkAdmin() }, [])

  const checkAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/auth/login'); return }
    const { data: adminData } = await supabase.from('admins').select('email').eq('email', userData.user.email).single()
    if (!adminData) { router.push('/'); return }
    fetchUsers()
  }

  const fetchUsers = async () => {
    try { const res = await adminFetch('/api/admin/users'); const data = await res.json(); setUsers(data.users || []) } catch (e) { console.error(e) }
    setLoading(false)
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const updateUser = async () => {
    if (!selectedUser) return
    try {
      const res = await adminFetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: selectedUser.id, data: { full_name: editForm.full_name, phone: editForm.phone } }) })
      if (res.ok) { showToast('User updated'); setEditMode(false); fetchUsers() }
    } catch (e) { showToast('Failed') }
  }

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedUser) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', selectedUser.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      const res = await fetch('/api/admin/upload-avatar', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
      const data = await res.json()
      if (data.url) {
        setSelectedUser({ ...selectedUser, avatar_url: data.url })
        showToast('Profile picture updated')
        fetchUsers()
      } else {
        showToast(data.error || 'Upload failed')
      }
    } catch (e) { showToast('Upload failed') }
    setUploading(false)
  }

  const toggleBan = async (user: any) => {
    const newBanned = !user.banned
    const reason = newBanned ? prompt('Ban reason:') : ''
    if (newBanned && reason === null) return
    try {
      const res = await adminFetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, data: { full_name: user.full_name || '', phone: user.phone || '', banned: newBanned, ban_reason: newBanned ? reason : '' } }) })
      const json = await res.json()
      if (json.success) { showToast(newBanned ? 'User banned' : 'User unbanned'); fetchUsers() }
      else showToast(json.error || 'Failed')
    } catch (e) { showToast('Failed') }
  }

  const deleteUser = async (user: any) => {
    if (!confirm(`Delete ${user.email}? This cannot be undone.`)) return
    try {
      const res = await adminFetch(`/api/admin/users?userId=${user.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) { showToast('User deleted'); setSelectedUser(null); setShowOrders(false); fetchUsers() }
      else showToast(json.error || 'Failed')
    } catch (e) { showToast('Failed') }
  }

  const sendMagicLink = async (user: any) => {
    try {
      const res = await adminFetch('/api/admin/users', { method: 'POST', body: JSON.stringify({ action: 'magic-link', email: user.email }) })
      const json = await res.json()
      showToast(json.message || json.error || 'Done')
    } catch (e) { showToast('Failed to send magic link') }
  }

  const sendResetPassword = async (user: any) => {
    try {
      const res = await adminFetch('/api/admin/users', { method: 'POST', body: JSON.stringify({ action: 'reset-password', email: user.email }) })
      const json = await res.json()
      showToast(json.message || json.error || 'Done')
    } catch (e) { showToast('Failed to send reset link') }
  }

  const viewUserOrders = async (user: any) => {
    try {
      const res = await adminFetch(`/api/admin/users?ordersForUser=${user.id}`)
      const data = await res.json()
      setUserOrders(data.orders || [])
    } catch (e) {
      setUserOrders([])
    }
    setShowOrders(true)
    setSelectedUser(user)
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await adminFetch('/api/admin/users', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: '__order__', data: { orderId, order_status: status } }) })
      showToast('Order updated')
      viewUserOrders(selectedUser)
      fetchUsers()
    } catch (e) { showToast('Failed') }
  }

  const deleteOrder = async (orderId: string) => {
    if (!confirm('Delete this order? This cannot be undone.')) return
    try {
      const res = await adminFetch(`/api/admin/users?action=delete-order&orderId=${orderId}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        showToast('Order deleted')
        setUserOrders(userOrders.filter(o => o.id !== orderId))
        fetchUsers()
      } else {
        showToast(json.error || 'Failed to delete order')
      }
    } catch (e) { showToast('Failed') }
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return !q || u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q) || u.phone?.includes(q)
  })

  const totalSpent = users.reduce((sum, u) => sum + (u.totalSpent || 0), 0)
  const bannedCount = users.filter(u => u.banned).length

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading users...</div>

  return (
    <div>
      {toast && <div className="admin-toast" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--admin-green)', border: '1px solid rgba(34,197,94,0.3)' }}>{toast}</div>}

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Users</h1>
          <p className="admin-page-subtitle">{users.length} users · Rs. {totalSpent.toLocaleString()} total spent{bannedCount > 0 ? ` · ${bannedCount} banned` : ''}</p>
        </div>
        {!selectedUser && (
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)', width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input className="admin-search" placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 280 }} />
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedUser ? '1fr' : '1fr 380px', gap: 16 }}>
        {/* User List - hidden when user is selected */}
        {!selectedUser && (
          <div className="admin-card" style={{ overflow: 'hidden', padding: 0 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--admin-border)' }}>
              <h3 style={{ font: '600 14px var(--admin-font-ui)', color: 'var(--admin-text)' }}>All Users ({filtered.length})</h3>
            </div>
            <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-muted)', fontSize: 13 }}>No users found</div>
              ) : filtered.map(user => (
                <div key={user.id} onClick={() => { setSelectedUser(user); setShowOrders(false); setEditMode(false) }}
                  style={{
                    padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer',
                    background: 'transparent', borderBottom: '1px solid var(--admin-border)', transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--admin-surface-2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 20, flexShrink: 0,
                    background: user.avatar_url ? 'none' : 'linear-gradient(135deg, var(--admin-accent), rgba(232,69,96,0.6))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    font: '600 14px var(--admin-font-ui)', color: 'white', overflow: 'hidden',
                  }}>
                    {user.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user.full_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ font: '500 13px var(--admin-font-ui)', color: 'var(--admin-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.full_name || 'No name'}</span>
                      {user.banned && <span style={{ padding: '1px 6px', borderRadius: 4, background: 'rgba(239,68,68,0.15)', color: 'var(--admin-red)', font: '600 10px var(--admin-font-ui)' }}>BANNED</span>}
                    </div>
                    <div style={{ font: '400 11px var(--admin-font-ui)', color: 'var(--admin-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
                    <div style={{ font: '400 11px var(--admin-font-ui)', color: 'var(--admin-text-muted)' }}>
                      {user.orderCount || 0} orders · Rs. {(user.totalSpent || 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Detail Panel */}
        {selectedUser && (
          <div className="admin-card" style={{ padding: 24 }}>
            <button onClick={() => { setSelectedUser(null); setShowOrders(false); setEditMode(false) }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--admin-text-muted)', cursor: 'pointer', font: '500 13px var(--admin-font-ui)', marginBottom: 20, padding: 0 }}>
              ← Back to Users
            </button>

            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 72, height: 72, borderRadius: 36, background: selectedUser.avatar_url ? 'none' : 'linear-gradient(135deg, var(--admin-accent), rgba(232,69,96,0.6))', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '700 26px var(--admin-font-ui)', color: 'white', overflow: 'hidden' }}>
                  {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (selectedUser.full_name?.[0] || selectedUser.email?.[0] || '?').toUpperCase()}
                </div>
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  style={{ position: 'absolute', bottom: -4, right: -4, width: 28, height: 28, borderRadius: 14, background: 'var(--admin-accent)', border: '2px solid var(--admin-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', fontSize: 12 }}>
                  {uploading ? '...' : '📷'}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} style={{ display: 'none' }} />
              </div>
              <div>
                <div style={{ font: '700 20px var(--admin-font-ui)', color: 'var(--admin-text)' }}>{selectedUser.full_name || 'No name'}</div>
                <div style={{ font: '400 13px var(--admin-font-ui)', color: 'var(--admin-text-muted)' }}>{selectedUser.email}</div>
                {selectedUser.banned && <div style={{ font: '500 12px var(--admin-font-ui)', color: 'var(--admin-red)', marginTop: 4 }}>🚫 Banned: {selectedUser.ban_reason || 'No reason'}</div>}
              </div>
            </div>

            {editMode ? (
              <div style={{ background: 'var(--admin-surface-2)', borderRadius: 12, padding: 16, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h4 style={{ font: '600 13px var(--admin-font-ui)', color: 'var(--admin-text)', margin: 0 }}>Edit Profile</h4>
                <input className="admin-input" value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} placeholder="Full name" />
                <input className="admin-input" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Phone" />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-admin-primary" style={{ flex: 1, padding: '10px 12px', fontSize: 13 }} onClick={updateUser}>Save Changes</button>
                  <button className="btn-admin-ghost" style={{ flex: 1, padding: '10px 12px', fontSize: 13 }} onClick={() => setEditMode(false)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div style={{ background: 'var(--admin-surface-2)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ font: '600 12px var(--admin-font-ui)', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>User Info</h4>
                  <button className="btn-admin-ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => { setEditForm({ full_name: selectedUser.full_name, phone: selectedUser.phone, email: selectedUser.email }); setEditMode(true) }}>Edit</button>
                </div>
                {[
                  ['Phone', selectedUser.phone || '—'],
                  ['Joined', npFullDate(selectedUser.created_at)],
                  ['Last Login', selectedUser.last_sign_in ? npFullDate(selectedUser.last_sign_in) : '—'],
                  ['Total Orders', String(selectedUser.orderCount || 0)],
                  ['Total Spent', `Rs. ${(selectedUser.totalSpent || 0).toLocaleString()}`],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                    <span style={{ color: 'var(--admin-text-muted)' }}>{label}</span>
                    <span style={{ font: label === 'Total Spent' ? '600 13px var(--admin-font-mono)' : '400 13px var(--admin-font-ui)', color: label === 'Total Spent' ? 'var(--admin-accent)' : 'var(--admin-text)' }}>{value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              <h4 style={{ font: '600 12px var(--admin-font-ui)', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Actions</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn-admin-ghost" style={{ fontSize: 12, padding: '8px 14px', flex: 1 }} onClick={() => viewUserOrders(selectedUser)}>📦 View Orders</button>
                <button className="btn-admin-ghost" style={{ fontSize: 12, padding: '8px 14px', flex: 1, color: selectedUser.banned ? 'var(--admin-green)' : 'var(--admin-yellow)' }} onClick={() => toggleBan(selectedUser)}>
                  {selectedUser.banned ? '✅ Unban' : '🚫 Ban'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button className="btn-admin-ghost" style={{ fontSize: 12, padding: '8px 14px', flex: 1, color: '#a78bfa' }} onClick={() => sendMagicLink(selectedUser)}>✉️ Send Magic Link</button>
                <button className="btn-admin-ghost" style={{ fontSize: 12, padding: '8px 14px', flex: 1, color: '#60a5fa' }} onClick={() => sendResetPassword(selectedUser)}>🔑 Send Reset Password</button>
              </div>
              <button className="btn-admin-ghost" style={{ fontSize: 12, padding: '8px 14px', color: 'var(--admin-red)' }} onClick={() => deleteUser(selectedUser)}>🗑️ Delete User</button>
            </div>

            {/* Order History */}
            {showOrders && (
              <div style={{ borderTop: '1px solid var(--admin-border)', paddingTop: 16 }}>
                <h4 style={{ font: '600 12px var(--admin-font-ui)', color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 12px' }}>Order History ({userOrders.length})</h4>
                {userOrders.length === 0 ? (
                  <p style={{ font: '400 13px var(--admin-font-ui)', color: 'var(--admin-text-muted)', textAlign: 'center', padding: 20 }}>No orders yet</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {userOrders.map(order => (
                      <div key={order.id} style={{ padding: 14, borderRadius: 10, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <span style={{ font: '600 12px var(--admin-font-mono)', color: 'var(--admin-text)' }}>#{order.id.slice(0, 8).toUpperCase()}</span>
                          <span style={{
                            padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, textTransform: 'capitalize',
                            background: order.order_status === 'delivered' ? 'rgba(34,197,94,0.15)' : order.order_status === 'cancelled' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                            color: order.order_status === 'delivered' ? 'var(--admin-green)' : order.order_status === 'cancelled' ? 'var(--admin-red)' : 'var(--admin-yellow)',
                          }}>{order.order_status}</span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginBottom: 8 }}>
                          <div>Rs. {order.total_amount?.toLocaleString()} · {order.payment_method?.toUpperCase()}</div>
                          <div>{npFullDate(order.created_at)}</div>
                          {order.order_items?.length > 0 && (
                            <div style={{ marginTop: 6 }}>
                              {order.order_items.map((item: any) => (
                                <div key={item.id} style={{ padding: '2px 0' }}>• {item.product_name} x{item.quantity}</div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {order.order_status === 'pending' && (
                            <button onClick={() => updateOrderStatus(order.id, 'processing')} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--admin-border)', background: 'var(--admin-card)', color: 'var(--admin-green)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Process</button>
                          )}
                          {order.order_status === 'processing' && (
                            <button onClick={() => updateOrderStatus(order.id, 'shipped')} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--admin-border)', background: 'var(--admin-card)', color: '#60a5fa', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Ship</button>
                          )}
                          {order.order_status === 'shipped' && (
                            <button onClick={() => updateOrderStatus(order.id, 'delivered')} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--admin-border)', background: 'var(--admin-card)', color: 'var(--admin-green)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Deliver</button>
                          )}
                          {order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (
                            <button onClick={() => updateOrderStatus(order.id, 'cancelled')} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--admin-border)', background: 'var(--admin-card)', color: 'var(--admin-yellow)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                          )}
                          <button onClick={() => deleteOrder(order.id)} style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid var(--admin-border)', background: 'var(--admin-card)', color: 'var(--admin-red)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
