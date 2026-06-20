'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { adminFetch } from '../../../lib/admin-fetch'

const SETTINGS_GROUPS = [
  { label: 'Store Info', icon: '🏪', keys: ['store_name', 'store_tagline', 'store_logo', 'about_text'] },
  { label: 'Announcements', icon: '📢', keys: ['announcement_text', 'announcement_active'] },
  { label: 'Contact', icon: '📞', keys: ['contact_email', 'contact_phone', 'contact_address', 'whatsapp_number'] },
  { label: 'Social Media', icon: '📱', keys: ['facebook_url', 'instagram_url', 'tiktok_url', 'twitter_url'] },
  { label: 'Policies', icon: '📋', keys: ['delivery_info', 'return_info'] },
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
    const res = await adminFetch('/api/admin/settings')
    const data = await res.json()
    setSettings(data.settings || {})
    setLoading(false)
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const saveSettings = async () => {
    setSaving(true)
    try {
      await adminFetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ settings }) })
      showToast('Settings saved successfully')
    } catch (e) { showToast('Failed to save') }
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

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading settings...</div>

  return (
    <div>
      {toast && <div className="admin-toast" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--admin-green)', border: '1px solid rgba(34,197,94,0.3)' }}>{toast}</div>}

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Settings</h1>
          <p className="admin-page-subtitle">Configure your store</p>
        </div>
        <button className="btn-admin-primary" onClick={saveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      {/* Store Logo */}
      <div className="admin-card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ font: '600 15px var(--admin-font-ui)', color: 'var(--admin-text)', marginBottom: 12 }}>Store Logo</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {settings.store_logo ? (
            <img src={settings.store_logo} alt="Logo" style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', background: 'var(--admin-surface-2)' }} />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: 12, background: 'var(--admin-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-muted)', fontSize: 28 }}>🧺</div>
          )}
          <div>
            <label style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-surface-2)', color: 'var(--admin-text-soft)', font: '500 12px var(--admin-font-ui)', cursor: 'pointer', display: 'inline-block' }}>
              {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
              <input type="file" accept="image/*" onChange={uploadLogo} style={{ display: 'none' }} />
            </label>
            <p style={{ font: '400 11px var(--admin-font-ui)', color: 'var(--admin-text-muted)', marginTop: 6 }}>200x200px recommended, PNG or SVG</p>
          </div>
        </div>
      </div>

      {/* Settings Groups */}
      {SETTINGS_GROUPS.map(group => (
        <div key={group.label} className="admin-card" style={{ padding: 20, marginBottom: 16 }}>
          <h3 style={{ font: '600 15px var(--admin-font-ui)', color: 'var(--admin-text)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>{group.icon}</span> {group.label}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {group.keys.map(key => {
              const isToggle = key === 'announcement_active'
              const isLong = ['about_text', 'delivery_info', 'return_info'].includes(key)
              const label = key.replace(/_/g, ' ').replace('url', 'URL').replace('info', 'Information')
              return (
                <div key={key}>
                  <label className="admin-label" style={{ textTransform: 'capitalize' }}>{label}</label>
                  {isToggle ? (
                    <button onClick={() => setSettings({ ...settings, [key]: settings[key] === 'true' ? 'false' : 'true' })}
                      style={{
                        padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                        background: settings[key] === 'true' ? 'var(--admin-green)' : 'var(--admin-surface-3)',
                        color: settings[key] === 'true' ? 'white' : 'var(--admin-text-muted)',
                      }}>
                      {settings[key] === 'true' ? '✅ Active' : '⬜ Inactive'}
                    </button>
                  ) : isLong ? (
                    <textarea className="admin-input" rows={3} value={settings[key] || ''} onChange={e => setSettings({ ...settings, [key]: e.target.value })} placeholder={`Enter ${label}`} style={{ resize: 'vertical' }} />
                  ) : (
                    <input className="admin-input" type={['contact_email'].includes(key) ? 'email' : ['contact_phone', 'whatsapp_number'].includes(key) ? 'tel' : 'text'} value={settings[key] || ''} onChange={e => setSettings({ ...settings, [key]: e.target.value })} placeholder={`Enter ${label}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Save Bottom */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button className="btn-admin-primary" onClick={saveSettings} disabled={saving} style={{ padding: '10px 24px' }}>
          {saving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>
    </div>
  )
}
