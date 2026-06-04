'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

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
    const res = await fetch('/api/admin/banners')
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
    } else { showToast('❌ Upload failed') }
    setUploading(false)
  }

  const saveBanner = async () => {
    if (!form.image_url) { showToast('⚠️ Upload an image first'); return }
    try {
      if (editId) {
        await fetch('/api/admin/banners', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editId, ...form, position: Number(form.position) })
        })
        showToast('✅ Banner updated')
      } else {
        await fetch('/api/admin/banners', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...form, position: Number(form.position) })
        })
        showToast('✅ Banner created')
      }
      resetForm()
      fetchBanners()
    } catch (e) { showToast('❌ Failed') }
  }

  const toggleActive = async (banner: any) => {
    await fetch('/api/admin/banners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: banner.id, active: !banner.active })
    })
    fetchBanners()
  }

  const deleteBanner = async (banner: any) => {
    if (!confirm('Delete this banner?')) return
    await fetch(`/api/admin/banners?id=${banner.id}`, { method: 'DELETE' })
    showToast('🗑️ Banner deleted')
    fetchBanners()
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-8 text-white">
      {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-gray-800 text-white px-6 py-3 rounded-2xl shadow-2xl font-semibold text-sm border border-gray-700">{toast}</div>}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold">🖼️ Banner Management</h1>
          <p className="text-gray-400 mt-1">{banners.length} homepage banners</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }}
          className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-xl font-bold transition">➕ Add Banner</button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold mb-5">{editId ? '✏️ Edit Banner' : '➕ New Banner'}</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">Title</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Banner title" className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">Subtitle</label>
              <input type="text" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })}
                placeholder="Banner subtitle" className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">Link URL</label>
              <input type="text" value={form.link_url} onChange={e => setForm({ ...form, link_url: e.target.value })}
                placeholder="/products" className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">Button Text</label>
              <input type="text" value={form.button_text} onChange={e => setForm({ ...form, button_text: e.target.value })}
                placeholder="Shop Now" className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">Position</label>
              <input type="number" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}
                className="w-full bg-gray-800 border border-gray-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1">Image</label>
              <div className="flex gap-3 items-center">
                <label htmlFor="banner-image-upload" className="bg-gray-700 hover:bg-gray-600 px-4 py-3 rounded-xl font-bold text-sm cursor-pointer transition">
                  {uploading ? 'Uploading...' : '📷 Upload'}
                </label>
                <input id="banner-image-upload" type="file" accept="image/*" onChange={uploadImage} className="hidden" />
                {form.image_url && <img src={form.image_url} alt="" className="w-16 h-10 rounded object-cover" />}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={saveBanner} className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl font-bold transition">
              {editId ? 'Update' : 'Create'} Banner
            </button>
            <button onClick={resetForm} className="bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-xl font-bold transition">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {banners.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-3">🖼️</div>
            <p className="text-gray-400">No banners yet. Add one to display on the homepage!</p>
          </div>
        ) : banners.map(banner => (
          <div key={banner.id} className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex items-center gap-6 p-4">
            <img src={banner.image_url} alt={banner.title} className="w-40 h-24 rounded-xl object-cover bg-gray-800 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold">{banner.title || 'No title'}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${banner.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-gray-600/20 text-gray-400'}`}>
                  {banner.active ? 'Active' : 'Inactive'}
                </span>
                <span className="text-xs text-gray-500">Pos: {banner.position}</span>
              </div>
              <p className="text-sm text-gray-400 truncate">{banner.subtitle || 'No subtitle'} → {banner.link_url}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => toggleActive(banner)}
                className="bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-xl text-sm font-bold transition">
                {banner.active ? '⏸️' : '▶️'}
              </button>
              <button onClick={() => { setForm({ title: banner.title, subtitle: banner.subtitle, image_url: banner.image_url, link_url: banner.link_url, button_text: banner.button_text, position: banner.position?.toString() || '0', active: banner.active }); setEditId(banner.id); setShowForm(true) }}
                className="bg-blue-600/20 text-blue-300 hover:bg-blue-600/40 px-3 py-2 rounded-xl text-sm font-bold transition">✏️</button>
              <button onClick={() => deleteBanner(banner)}
                className="bg-red-600/20 text-red-300 hover:bg-red-600/40 px-3 py-2 rounded-xl text-sm font-bold transition">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
