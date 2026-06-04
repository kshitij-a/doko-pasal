'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const SETTINGS_GROUPS = [
  { label: 'Store Info', keys: ['store_name', 'store_tagline', 'store_logo', 'about_text'] },
  { label: 'Announcements', keys: ['announcement_text', 'announcement_active'] },
  { label: 'Contact', keys: ['contact_email', 'contact_phone', 'contact_address', 'whatsapp_number'] },
  { label: 'Social Media', keys: ['facebook_url', 'instagram_url', 'tiktok_url', 'twitter_url'] },
  { label: 'Policies', keys: ['delivery_info', 'return_info'] },
]

export default function AdminSettings() {
  const router = useRouter()
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)

  useEffect(() => { checkAdmin() }, [])

  const checkAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/auth/login'); return }
    const { data: adminData } = await supabase.from('admins').select('email').eq('email', userData.user.email).single()
    if (!adminData) { router.push('/'); return }
    fetchSettings()
  }

  const fetchSettings = async () => {
    const res = await fetch('/api/admin/settings')
    const data = await res.json()
    setSettings(data.settings || {})
    setLoading(false)
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const saveSettings = async () => {
    setSaving(true)
    try {
      await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })
      showToast('✅ Settings saved successfully')
    } catch (e) { showToast('❌ Failed to save') }
    setSaving(false)
  }

  const uploadLogo = async (e: any) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingLogo(true)
    const filePath = `settings/logo-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('product-images').upload(filePath, file)
    if (!error) {
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath)
      setSettings({ ...settings, store_logo: urlData.publicUrl })
    }
    setUploadingLogo(false)
  }

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-8 text-white">
      {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-gray-800 text-white px-6 py-3 rounded-2xl shadow-2xl font-semibold text-sm border border-gray-700">{toast}</div>}

      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold">⚙️ Store Settings</h1>
          <p className="text-gray-400 mt-1">Configure your store details</p>
        </div>
        <button onClick={saveSettings} disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-xl font-bold transition disabled:opacity-50">
          {saving ? 'Saving...' : '💾 Save All Settings'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Store Logo */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold mb-4">🏪 Store Logo</h2>
          <div className="flex items-center gap-6">
            {settings.store_logo ? (
              <img src={settings.store_logo} alt="Logo" className="w-20 h-20 rounded-xl object-cover bg-gray-800" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gray-800 flex items-center justify-center text-3xl">🧺</div>
            )}
            <div>
              <label className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl font-bold text-sm cursor-pointer transition inline-block">
                {uploadingLogo ? 'Uploading...' : '📷 Upload Logo'}
              </label>
              <input type="file" accept="image/*" onChange={uploadLogo} className="hidden" />
              <p className="text-xs text-gray-500 mt-2">Recommended: 200x200px, PNG or SVG</p>
            </div>
          </div>
        </div>

        {SETTINGS_GROUPS.map(group => (
          <div key={group.label} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <h2 className="text-lg font-bold mb-4">
              {group.label === 'Store Info' ? '🏪' : group.label === 'Announcements' ? '📢' : group.label === 'Contact' ? '📞' : group.label === 'Social Media' ? '📱' : '📋'} {group.label}
            </h2>
            <div className="space-y-4">
              {group.keys.map(key => {
                const isToggle = key === 'announcement_active'
                const isLong = ['about_text', 'delivery_info', 'return_info'].includes(key)
                return (
                  <div key={key}>
                    <label className="block text-sm font-semibold text-gray-300 mb-1 capitalize">
                      {key.replace(/_/g, ' ').replace('url', 'URL').replace('info', 'Information')}
                    </label>
                    {isToggle ? (
                      <button onClick={() => setSettings({ ...settings, [key]: settings[key] === 'true' ? 'false' : 'true' })}
                        className={`px-4 py-2 rounded-xl font-bold text-sm transition ${settings[key] === 'true' ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-400'}`}>
                        {settings[key] === 'true' ? '✅ Active' : '⬜ Inactive'}
                      </button>
                    ) : isLong ? (
                      <textarea value={settings[key] || ''} onChange={e => setSettings({ ...settings, [key]: e.target.value })}
                        rows={3} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none" />
                    ) : (
                      <input type={['contact_email'].includes(key) ? 'email' : ['contact_phone', 'whatsapp_number'].includes(key) ? 'tel' : 'text'}
                        value={settings[key] || ''} onChange={e => setSettings({ ...settings, [key]: e.target.value })}
                        placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                        className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-end">
        <button onClick={saveSettings} disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-500 px-8 py-3 rounded-xl font-bold transition disabled:opacity-50 text-lg">
          {saving ? 'Saving...' : '💾 Save All Settings'}
        </button>
      </div>
    </div>
  )
}
