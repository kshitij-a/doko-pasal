'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AdminCoupons() {
  const router = useRouter()
  const [coupons, setCoupons] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [form, setForm] = useState({ code: '', type: 'percentage', value: '', min_order: '', max_uses: '', expires_at: '' })

  useEffect(() => { checkAdmin() }, [])

  const checkAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/auth/login'); return }
    const { data: adminData } = await supabase.from('admins').select('email').eq('email', userData.user.email).single()
    if (!adminData) { router.push('/'); return }
    fetchCoupons()
  }

  const fetchCoupons = async () => {
    const res = await fetch('/api/admin/coupons')
    const data = await res.json()
    setCoupons(data.coupons || [])
    setLoading(false)
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const resetForm = () => { setForm({ code: '', type: 'percentage', value: '', min_order: '', max_uses: '', expires_at: '' }); setEditId(null); setShowForm(false) }

  const saveCoupon = async () => {
    if (!form.code || !form.value) { showToast('⚠️ Code and value required'); return }
    try {
      if (editId) {
        await fetch('/api/admin/coupons', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...form, value: Number(form.value), min_order: Number(form.min_order) || 0, max_uses: Number(form.max_uses) || 0 })
        })
        showToast('✅ Coupon updated')
      } else {
        await fetch('/api/admin/coupons', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, value: Number(form.value), min_order: Number(form.min_order) || 0, max_uses: Number(form.max_uses) || 0 })
        })
        showToast('✅ Coupon created')
      }
      resetForm()
      fetchCoupons()
    } catch (e) { showToast('❌ Failed') }
  }

  const toggleActive = async (coupon: any) => {
    await fetch('/api/admin/coupons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: coupon.id, active: !coupon.active })
    })
    fetchCoupons()
  }

  const deleteCoupon = async (coupon: any) => {
    if (!confirm(`Delete coupon "${coupon.code}"?`)) return
    await fetch(`/api/admin/coupons?id=${coupon.id}`, { method: 'DELETE' })
    showToast('🗑️ Coupon deleted')
    fetchCoupons()
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-8 text-white">
      {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-gray-800 text-white px-6 py-3 rounded-2xl shadow-2xl font-semibold text-sm border border-gray-700">{toast}</div>}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold">🏷️ Coupon Management</h1>
          <p className="text-gray-400 mt-1">{coupons.length} coupons</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-xl font-bold transition">➕ Create Coupon</button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-5">{editId ? '✏️ Edit Coupon' : '➕ New Coupon'}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">Coupon Code *</label>
              <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. SAVE20" className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 uppercase tracking-wider font-mono" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">Discount Type *</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500">
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (Rs.)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">Discount Value *</label>
              <input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })}
                placeholder={form.type === 'percentage' ? 'e.g. 20' : 'e.g. 500'}
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">Min Order (Rs.)</label>
              <input type="number" value={form.min_order} onChange={e => setForm({ ...form, min_order: e.target.value })}
                placeholder="0 = no minimum" className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">Max Uses (0 = unlimited)</label>
              <input type="number" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })}
                placeholder="0 = unlimited" className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">Expiry Date</label>
              <input type="date" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })}
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={saveCoupon} className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl font-bold transition">
              {editId ? 'Update' : 'Create'} Coupon
            </button>
            <button onClick={resetForm} className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-xl font-bold transition">Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {coupons.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🏷️</div>
            <p className="text-gray-400">No coupons yet. Create your first one!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Code', 'Type', 'Value', 'Min Order', 'Uses', 'Expiry', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {coupons.map(coupon => (
                  <tr key={coupon.id} className="border-b border-gray-800/50 hover:bg-gray-800/40 transition">
                    <td className="px-6 py-4 font-mono font-bold text-sm text-yellow-400">{coupon.code}</td>
                    <td className="px-6 py-4 text-sm capitalize">{coupon.type}</td>
                    <td className="px-6 py-4 text-sm font-bold">
                      {coupon.type === 'percentage' ? `${coupon.value}%` : `Rs. ${coupon.value}`}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">Rs. {coupon.min_order?.toLocaleString() || 0}</td>
                    <td className="px-6 py-4 text-sm">{coupon.used_count || 0}{coupon.max_uses > 0 ? ` / ${coupon.max_uses}` : ''}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={() => toggleActive(coupon)}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition ${coupon.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-600/20 text-gray-400'}`}>
                        {coupon.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button onClick={() => { setForm({ code: coupon.code, type: coupon.type, value: coupon.value, min_order: coupon.min_order || '', max_uses: coupon.max_uses || '', expires_at: coupon.expires_at || '' }); setEditId(coupon.id); setShowForm(true) }}
                          className="text-blue-400 hover:text-blue-300 text-sm font-semibold">✏️</button>
                        <button onClick={() => deleteCoupon(coupon)} className="text-red-400 hover:text-red-300 text-sm font-semibold">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
