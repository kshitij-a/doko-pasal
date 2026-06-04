'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AdminUsers() {
  const router = useRouter()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ full_name: '', phone: '', email: '' })
  const [message, setMessage] = useState('')
  const [userOrders, setUserOrders] = useState<any[]>([])
  const [showOrders, setShowOrders] = useState(false)

  useEffect(() => { checkAdmin() }, [])

  const checkAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/auth/login'); return }
    const { data: adminData } = await supabase.from('admins').select('email').eq('email', userData.user.email).single()
    if (!adminData) { router.push('/'); return }
    fetchUsers()
  }

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const showMessage = (msg: string) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  const updateUser = async () => {
    if (!selectedUser) return
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          data: {
            full_name: editForm.full_name,
            phone: editForm.phone,
          }
        })
      })
      if (res.ok) {
        showMessage('✅ User updated successfully')
        setEditMode(false)
        fetchUsers()
        setSelectedUser({ ...selectedUser, full_name: editForm.full_name, phone: editForm.phone })
      }
    } catch (e) { showMessage('❌ Failed to update user') }
  }

  const toggleBan = async (user: any) => {
    const newBanned = !user.banned
    const reason = newBanned ? prompt('Ban reason (optional):') : ''
    if (newBanned && reason === null) return

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          data: {
            full_name: user.full_name || '',
            phone: user.phone || '',
            banned: newBanned,
            ban_reason: newBanned ? reason : '',
          }
        })
      })
      const json = await res.json()
      if (json.success) {
        showMessage(newBanned ? '🚫 User banned' : '✅ User unbanned')
        fetchUsers()
      } else if (json.error?.includes('service_role')) {
        showMessage('⚠️ Ban requires SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local')
      } else {
        showMessage('⚠️ ' + (json.error || 'Ban saved locally'))
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, banned: newBanned, ban_reason: newBanned ? reason : '' } : u))
      }
    } catch (e) { showMessage('❌ Failed') }
  }

  const deleteUser = async (user: any) => {
    if (!confirm(`⚠️ PERMANENTLY delete ${user.email}? This cannot be undone.`)) return
    if (!confirm('Are you REALLY sure? All their data will be lost.')) return

    try {
      const res = await fetch(`/api/admin/users?userId=${user.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        showMessage('🗑️ User deleted permanently')
        setSelectedUser(null)
        fetchUsers()
      } else if (json.error?.includes('service_role')) {
        showMessage('⚠️ Delete requires SUPABASE_SERVICE_ROLE_KEY. Add it to .env.local')
      } else {
        showMessage('⚠️ ' + (json.error || 'Failed to delete'))
      }
    } catch (e) { showMessage('❌ Failed to delete user') }
  }

  const viewUserOrders = async (user: any) => {
    const { data } = await supabase.from('orders').select('*, order_items(*)').eq('user_id', user.id).order('created_at', { ascending: false })
    setUserOrders(data || [])
    setShowOrders(true)
    setSelectedUser(user)
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase()
    return !q || u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q) || u.phone?.includes(q)
  })

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-8 text-white">
      {message && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-gray-800 text-white px-6 py-3 rounded-2xl shadow-2xl font-semibold text-sm border border-gray-700">
          {message}
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold">👥 User Management</h1>
          <p className="text-gray-400 mt-1">{users.length} registered users</p>
        </div>
        <input type="text" placeholder="Search by name, email, phone..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-blue-500 w-72" />
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8">
        {/* USER LIST */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="font-bold">All Users</h2>
          </div>
          <div className="divide-y divide-gray-800/50 max-h-[70vh] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No users found</div>
            ) : filtered.map(user => (
              <div key={user.id}
                onClick={() => { setSelectedUser(user); setShowOrders(false); setEditMode(false) }}
                className={`flex items-center gap-4 px-6 py-4 cursor-pointer transition ${selectedUser?.id === user.id ? 'bg-gray-800' : 'hover:bg-gray-800/50'}`}>
                <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-lg font-bold flex-shrink-0">
                  {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> :
                    (user.full_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{user.full_name || 'No name'}</p>
                    {user.banned && <span className="bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded font-bold">BANNED</span>}
                  </div>
                  <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  <p className="text-xs text-gray-500">{user.phone || 'No phone'} · {user.orderCount} orders · Rs. {user.totalSpent.toLocaleString()} spent</p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">
                  {new Date(user.created_at).toLocaleDateString('en-NP', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* USER DETAIL PANEL */}
        <div className="space-y-4">
          {selectedUser ? (
            <>
              {/* Profile Card */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-2xl font-bold">
                    {selectedUser.avatar_url ? <img src={selectedUser.avatar_url} alt="" className="w-full h-full object-cover" /> :
                      (selectedUser.full_name?.[0] || selectedUser.email?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-lg">{selectedUser.full_name || 'No name'}</p>
                    <p className="text-gray-400 text-sm">{selectedUser.email}</p>
                    {selectedUser.banned && (
                      <p className="text-red-400 text-xs font-bold mt-1">🚫 Banned: {selectedUser.ban_reason || 'No reason'}</p>
                    )}
                  </div>
                </div>

                {editMode ? (
                  <div className="space-y-3 mb-4">
                    <input type="text" value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                      placeholder="Full name" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                    <input type="text" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Phone" className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500" />
                    <div className="flex gap-2">
                      <button onClick={updateUser} className="flex-1 bg-emerald-600 hover:bg-emerald-500 py-2 rounded-xl font-bold text-sm transition">Save</button>
                      <button onClick={() => setEditMode(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded-xl font-bold text-sm transition">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 mb-4 text-sm">
                    <div className="flex justify-between"><span className="text-gray-400">Phone</span><span>{selectedUser.phone || '—'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Joined</span><span>{new Date(selectedUser.created_at).toLocaleDateString()}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Last Login</span><span>{selectedUser.last_sign_in ? new Date(selectedUser.last_sign_in).toLocaleDateString() : '—'}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Total Orders</span><span className="font-bold">{selectedUser.orderCount}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Total Spent</span><span className="font-bold text-red-400">Rs. {selectedUser.totalSpent.toLocaleString()}</span></div>
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {!editMode && (
                    <button onClick={() => { setEditForm({ full_name: selectedUser.full_name, phone: selectedUser.phone, email: selectedUser.email }); setEditMode(true) }}
                      className="bg-blue-600/20 text-blue-300 border border-blue-500/30 px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-600/40 transition">
                      ✏️ Edit Profile
                    </button>
                  )}
                  <button onClick={() => viewUserOrders(selectedUser)}
                    className="bg-violet-600/20 text-violet-300 border border-violet-500/30 px-3 py-2 rounded-xl text-xs font-bold hover:bg-violet-600/40 transition">
                    📦 View Orders
                  </button>
                  <button onClick={() => toggleBan(selectedUser)}
                    className={`${selectedUser.banned ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-600/20 text-amber-300 border border-amber-500/30'} px-3 py-2 rounded-xl text-xs font-bold hover:opacity-80 transition`}>
                    {selectedUser.banned ? '✅ Unban' : '🚫 Ban User'}
                  </button>
                  <button onClick={() => deleteUser(selectedUser)}
                    className="bg-red-600/20 text-red-300 border border-red-500/30 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-600/40 transition">
                    🗑️ Delete User
                  </button>
                </div>
              </div>

              {/* USER ORDERS */}
              {showOrders && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                  <h3 className="font-bold mb-4">📦 Order History ({userOrders.length})</h3>
                  {userOrders.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No orders yet</p>
                  ) : (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {userOrders.map(order => (
                        <div key={order.id} className="bg-gray-800/50 rounded-xl p-3">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-mono text-xs text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold capitalize ${
                              order.order_status === 'delivered' ? 'bg-emerald-500/20 text-emerald-300' :
                              order.order_status === 'cancelled' ? 'bg-red-500/20 text-red-300' :
                              'bg-amber-500/20 text-amber-300'
                            }`}>{order.order_status}</span>
                          </div>
                          <p className="text-sm font-bold text-red-400">Rs. {order.total_amount?.toLocaleString()}</p>
                          <p className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
                          {order.order_items && (
                            <div className="mt-2 text-xs text-gray-400">
                              {order.order_items.map((item: any, i: number) => (
                                <span key={i}>{item.product_name} (x{item.quantity}){i < order.order_items.length - 1 ? ', ' : ''}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
              <div className="text-5xl mb-3">👈</div>
              <p className="text-gray-400">Select a user to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
