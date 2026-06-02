'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push('/auth/login')
        return
      }
      setUser(data.user)
      setName(data.user.user_metadata?.full_name || '')
      setEmail(data.user.email || '')
      setPhone(data.user.user_metadata?.phone || '')
      setAvatarUrl(data.user.user_metadata?.avatar_url || '')
    }
    loadUser()
  }, [router])

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    const fileName = `${user.id}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`
    const { data, error } = await supabase.storage.from('profile-avatars').upload(fileName, file)
    if (error) {
      setError('Avatar upload failed: ' + error.message)
      setUploading(false)
      return
    }
    const { data: urlData } = supabase.storage.from('profile-avatars').getPublicUrl(fileName)
    setAvatarUrl(urlData.publicUrl)
    setUploading(false)
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setError('')
    setMessage('')

    const updateData: any = {
      full_name: name,
      phone,
      avatar_url: avatarUrl,
    }

    const { data, error } = await supabase.auth.updateUser({
      email,
      data: updateData,
    } as any)

    if (error) {
      setError(error.message)
    } else {
      setUser(data.user)
      setMessage('Profile updated successfully.')
    }
    setSaving(false)
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="w-full lg:w-1/3 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-red-600 overflow-hidden border-4 border-slate-800 shadow-inner">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-white flex items-center justify-center h-full">{name?.charAt(0)?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 right-0 bg-red-600 hover:bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center shadow-lg"
                >
                  📷
                </button>
              </div>
              <div>
                <h1 className="text-2xl font-bold">My Profile</h1>
                <p className="text-sm text-slate-400">Update your account details and photo.</p>
              </div>
            </div>
            <div className="mt-8 space-y-3">
              <Link href="/orders" className="block rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 hover:border-red-600 hover:text-red-300 transition">
                My Orders
              </Link>
              <Link href="/wishlist" className="block rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 hover:border-red-600 hover:text-red-300 transition">
                Wishlist
              </Link>
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/auth/login')
                }}
                className="w-full rounded-2xl border border-red-600 bg-red-600 px-4 py-3 text-white font-semibold hover:bg-red-500 transition"
              >
                Logout
              </button>
            </div>
          </aside>

          <section className="w-full lg:w-2/3 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-lg">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
              <div>
                <h2 className="text-3xl font-extrabold">Account Details</h2>
                <p className="text-slate-400">Edit your personal information here.</p>
              </div>
              <span className="text-sm text-slate-500">Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</span>
            </div>

            {error && <div className="mb-4 rounded-2xl bg-red-600/10 border border-red-600 text-red-200 px-4 py-3">{error}</div>}
            {message && <div className="mb-4 rounded-2xl bg-emerald-600/10 border border-emerald-600 text-emerald-200 px-4 py-3">{message}</div>}

            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Full Name</label>
                  <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-red-600 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-red-600 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Phone Number</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-red-600 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">Profile Picture</label>
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-3xl overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center">
                    {avatarUrl ? <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" /> : <span className="text-white">No photo</span>}
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white hover:border-red-600 transition">{uploading ? 'Uploading...' : 'Upload photo'}</button>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button onClick={handleSave} disabled={saving} className="w-full sm:w-auto rounded-2xl bg-red-600 px-6 py-3 text-white font-semibold hover:bg-red-500 transition disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
                <Link href="/" className="text-sm text-slate-400 hover:text-white transition">Back to shopping</Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
