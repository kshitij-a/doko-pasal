'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { adminFetch } from '../../../lib/admin-fetch'
import { npFullDate } from '../../../lib/timezone'

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
    const res = await adminFetch('/api/admin/coupons')
    const data = await res.json()
    setCoupons(data.coupons || [])
    setLoading(false)
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const resetForm = () => { setForm({ code: '', type: 'percentage', value: '', min_order: '', max_uses: '', expires_at: '' }); setEditId(null); setShowForm(false) }

  const saveCoupon = async () => {
    if (!form.code || !form.value) { showToast('Code and value required'); return }
    try {
      if (editId) {
        await adminFetch('/api/admin/coupons', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, ...form, value: Number(form.value), min_order: Number(form.min_order) || 0, max_uses: Number(form.max_uses) || 0 }) })
        showToast('Coupon updated')
      } else {
        await adminFetch('/api/admin/coupons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, value: Number(form.value), min_order: Number(form.min_order) || 0, max_uses: Number(form.max_uses) || 0 }) })
        showToast('Coupon created')
      }
      resetForm(); fetchCoupons()
    } catch (e) { showToast('Failed') }
  }

  const toggleActive = async (coupon: any) => {
    await adminFetch('/api/admin/coupons', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: coupon.id, active: !coupon.active }) })
    fetchCoupons()
  }

  const deleteCoupon = async (coupon: any) => {
    if (!confirm(`Delete coupon "${coupon.code}"?`)) return
    await adminFetch(`/api/admin/coupons?id=${coupon.id}`, { method: 'DELETE' })
    showToast('Coupon deleted'); fetchCoupons()
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading coupons...</div>

  return (
    <div>
      {toast && <div className="admin-toast" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--admin-green)', border: '1px solid rgba(34,197,94,0.3)' }}>{toast}</div>}

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Coupons</h1>
          <p className="admin-page-subtitle">{coupons.length} coupons · {coupons.filter(c => c.active).length} active</p>
        </div>
        <button className="btn-admin-primary" onClick={() => { resetForm(); setShowForm(true) }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Create Coupon
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => { setShowForm(false); resetForm() }}>
          <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 16, width: '100%', maxWidth: 520, padding: 28 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ font: '600 18px var(--admin-font-ui)', color: 'var(--admin-text)', marginBottom: 20 }}>{editId ? 'Edit Coupon' : 'New Coupon'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="admin-label">Code *</label>
                <input className="admin-input" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE20" style={{ fontFamily: 'var(--admin-font-mono)', letterSpacing: '0.05em', textTransform: 'uppercase' }} />
              </div>
              <div>
                <label className="admin-label">Type *</label>
                <select className="admin-input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (Rs.)</option>
                </select>
              </div>
              <div>
                <label className="admin-label">Value *</label>
                <input className="admin-input" type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder={form.type === 'percentage' ? '20' : '500'} />
              </div>
              <div>
                <label className="admin-label">Min Order (Rs.)</label>
                <input className="admin-input" type="number" value={form.min_order} onChange={e => setForm({ ...form, min_order: e.target.value })} placeholder="0 = no minimum" />
              </div>
              <div>
                <label className="admin-label">Max Uses (0 = unlimited)</label>
                <input className="admin-input" type="number" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} placeholder="0 = unlimited" />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label className="admin-label">Expiry Date</label>
                <input className="admin-input" type="date" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn-admin-ghost" onClick={() => { setShowForm(false); resetForm() }}>Cancel</button>
              <button className="btn-admin-primary" onClick={saveCoupon}>{editId ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Coupons Table */}
      <div className="admin-table-container">
        {coupons.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">🏷️</div>
            <h3>No coupons yet</h3>
            <p>Create your first coupon to offer discounts</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Min Order</th>
                <th>Usage</th>
                <th>Expiry</th>
                <th>Status</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(coupon => {
                const usagePct = coupon.max_uses > 0 ? ((coupon.used_count || 0) / coupon.max_uses * 100) : 0
                const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date()
                return (
                  <tr key={coupon.id}>
                    <td><span style={{ font: '600 13px var(--admin-font-mono)', color: 'var(--admin-yellow)' }}>{coupon.code}</span></td>
                    <td style={{ font: '400 13px var(--admin-font-ui)', color: 'var(--admin-text-soft)', textTransform: 'capitalize' }}>{coupon.type}</td>
                    <td style={{ font: '600 13px var(--admin-font-mono)', color: 'var(--admin-text)' }}>{coupon.type === 'percentage' ? `${coupon.value}%` : `Rs. ${coupon.value}`}</td>
                    <td style={{ font: '400 13px var(--admin-font-mono)', color: 'var(--admin-text-muted)' }}>Rs. {(coupon.min_order || 0).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--admin-surface-3)', overflow: 'hidden', minWidth: 60 }}>
                          <div style={{ height: '100%', borderRadius: 2, background: usagePct > 80 ? 'var(--admin-red)' : 'var(--admin-accent)', width: `${Math.min(usagePct, 100)}%`, transition: 'width 0.3s' }} />
                        </div>
                        <span style={{ font: '400 11px var(--admin-font-mono)', color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>{coupon.used_count || 0}{coupon.max_uses > 0 ? `/${coupon.max_uses}` : ''}</span>
                      </div>
                    </td>
                    <td style={{ font: '400 12px var(--admin-font-ui)', color: isExpired ? 'var(--admin-red)' : 'var(--admin-text-muted)' }}>
                      {coupon.expires_at ? npFullDate(coupon.expires_at) : 'Never'}
                    </td>
                    <td>
                      <button onClick={() => toggleActive(coupon)} style={{
                        padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer', border: 'none',
                        background: coupon.active ? 'rgba(34,197,94,0.15)' : 'var(--admin-surface-3)',
                        color: coupon.active ? 'var(--admin-green)' : 'var(--admin-text-muted)',
                      }}>{coupon.active ? 'Active' : 'Inactive'}</button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => { setForm({ code: coupon.code, type: coupon.type, value: String(coupon.value), min_order: String(coupon.min_order || ''), max_uses: String(coupon.max_uses || ''), expires_at: coupon.expires_at || '' }); setEditId(coupon.id); setShowForm(true) }}
                          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-soft)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✏️</button>
                        <button onClick={() => deleteCoupon(coupon)}
                          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-soft)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
