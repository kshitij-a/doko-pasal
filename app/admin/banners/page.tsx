'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { adminFetch } from '../../../lib/admin-fetch'

export default function AdminBanners() {
  const router = useRouter()
  const [banners, setBanners] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: '', subtitle: '', image_url: '', link_url: '/products', button_text: 'Shop Now', position: '0', active: true })

  useEffect(() => { checkAdmin() }, [])

  const checkAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/auth/login'); return }
    const { data: adminData } = await supabase.from('admins').select('email').eq('email', userData.user.email).single()
    if (!adminData) { router.push('/'); return }
    fetchBanners()
  }

  const fetchBanners = async () => {
    const res = await adminFetch('/api/admin/banners')
    const data = await res.json()
    setBanners(data.banners || [])
    setLoading(false)
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const resetForm = () => { setForm({ title: '', subtitle: '', image_url: '', link_url: '/products', button_text: 'Shop Now', position: '0', active: true }); setEditId(null); setShowForm(false) }

  const uploadImage = async (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const filePath = `banners/banner-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('banner-images').upload(filePath, file)
    if (!error) {
      const { data: urlData } = supabase.storage.from('banner-images').getPublicUrl(filePath)
      setForm({ ...form, image_url: urlData.publicUrl })
    } else { showToast('Upload failed') }
    setUploading(false)
  }

  const saveBanner = async () => {
    if (!form.image_url) { showToast('Upload an image first'); return }
    try {
      if (editId) {
        await adminFetch('/api/admin/banners', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editId, ...form, position: Number(form.position) }) })
        showToast('Banner updated')
      } else {
        await adminFetch('/api/admin/banners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, position: Number(form.position) }) })
        showToast('Banner created')
      }
      resetForm(); fetchBanners()
    } catch (e) { showToast('Failed') }
  }

  const toggleActive = async (banner: any) => {
    await adminFetch('/api/admin/banners', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: banner.id, active: !banner.active }) })
    fetchBanners()
  }

  const deleteBanner = async (banner: any) => {
    if (!confirm('Delete this banner?')) return
    await fetch(`/api/admin/banners?id=${banner.id}`, { method: 'DELETE' })
    showToast('Banner deleted'); fetchBanners()
  }

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading banners...</div>

  return (
    <div>
      {toast && <div className="admin-toast" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--admin-green)', border: '1px solid rgba(34,197,94,0.3)' }}>{toast}</div>}

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Banners</h1>
          <p className="admin-page-subtitle">{banners.length} homepage banners · {banners.filter(b => b.active).length} active</p>
        </div>
        <button className="btn-admin-primary" onClick={() => { resetForm(); setShowForm(true) }}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          Add Banner
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => { setShowForm(false); resetForm() }}>
          <div style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 16, width: '100%', maxWidth: 560, padding: 28 }} onClick={e => e.stopPropagation()}>
            <h2 style={{ font: '600 18px var(--admin-font-ui)', color: 'var(--admin-text)', marginBottom: 20 }}>{editId ? 'Edit Banner' : 'New Banner'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div><label className="admin-label">Title</label><input className="admin-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Banner title" /></div>
              <div><label className="admin-label">Subtitle</label><input className="admin-input" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} placeholder="Banner subtitle" /></div>
              <div><label className="admin-label">Link URL</label><input className="admin-input" value={form.link_url} onChange={e => setForm({ ...form, link_url: e.target.value })} placeholder="/products" /></div>
              <div><label className="admin-label">Button Text</label><input className="admin-input" value={form.button_text} onChange={e => setForm({ ...form, button_text: e.target.value })} placeholder="Shop Now" /></div>
              <div><label className="admin-label">Position</label><input className="admin-input" type="number" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} /></div>
              <div>
                <label className="admin-label">Image</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <label style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-surface-2)', color: 'var(--admin-text-soft)', font: '500 12px var(--admin-font-ui)', cursor: 'pointer' }}>
                    {uploading ? 'Uploading...' : 'Upload'}
                    <input type="file" accept="image/*" onChange={uploadImage} style={{ display: 'none' }} />
                  </label>
                  {form.image_url && <img src={form.image_url} alt="" style={{ width: 48, height: 32, borderRadius: 6, objectFit: 'cover' }} />}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button className="btn-admin-ghost" onClick={() => { setShowForm(false); resetForm() }}>Cancel</button>
              <button className="btn-admin-primary" onClick={saveBanner}>{editId ? 'Update' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Banners List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {banners.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">🖼️</div>
            <h3>No banners yet</h3>
            <p>Add a banner to display on the homepage</p>
          </div>
        ) : banners.map(banner => (
          <div key={banner.id} className="admin-card" style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 140, height: 80, borderRadius: 8, overflow: 'hidden', background: 'var(--admin-surface-2)', flexShrink: 0 }}>
              {banner.image_url ? <img src={banner.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-muted)', fontSize: 20 }}>🖼️</div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ font: '500 14px var(--admin-font-ui)', color: 'var(--admin-text)' }}>{banner.title || 'No title'}</span>
                <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: banner.active ? 'rgba(34,197,94,0.15)' : 'var(--admin-surface-3)', color: banner.active ? 'var(--admin-green)' : 'var(--admin-text-muted)' }}>
                  {banner.active ? 'Active' : 'Inactive'}
                </span>
                <span style={{ font: '400 10px var(--admin-font-mono)', color: 'var(--admin-text-muted)' }}>Pos: {banner.position}</span>
              </div>
              <div style={{ font: '400 12px var(--admin-font-ui)', color: 'var(--admin-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {banner.subtitle || 'No subtitle'} → {banner.link_url}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <button onClick={() => toggleActive(banner)} style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-soft)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                {banner.active ? '⏸️' : '▶️'}
              </button>
              <button onClick={() => { setForm({ title: banner.title, subtitle: banner.subtitle, image_url: banner.image_url, link_url: banner.link_url, button_text: banner.button_text, position: String(banner.position || '0'), active: banner.active }); setEditId(banner.id); setShowForm(true) }}
                style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-soft)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>✏️</button>
              <button onClick={() => deleteBanner(banner)}
                style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-soft)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
