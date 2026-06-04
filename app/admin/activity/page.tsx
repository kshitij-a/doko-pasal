'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

const ACTION_TYPES = [
  { value: '', label: 'All Actions' },
  { value: 'page_view', label: '👁️ Page Views' },
  { value: 'add_to_cart', label: '🛒 Add to Cart' },
  { value: 'checkout', label: '💳 Checkout' },
  { value: 'purchase', label: '🛍️ Purchase' },
  { value: 'signup', label: '👤 Signups' },
  { value: 'login', label: '🔑 Logins' },
  { value: 'wishlist', label: '❤️ Wishlist' },
]

export default function AdminActivity() {
  const router = useRouter()
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => { checkAdmin() }, [])

  useEffect(() => { fetchLogs() }, [search, actionFilter, page])

  const checkAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/auth/login'); return }
    const { data: adminData } = await supabase.from('admins').select('email').eq('email', userData.user.email).single()
    if (!adminData) { router.push('/'); return }
  }

  const fetchLogs = async () => {
    setLoading(true)
    const params = new URLSearchParams({ search, action: actionFilter, page: String(page), limit: '50' })
    try {
      const res = await fetch(`/api/admin/activity?${params}`)
      const data = await res.json()
      setLogs(data.logs || [])
      setTotal(data.total || 0)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  const getActionIcon = (action: string) => {
    const map: Record<string, string> = {
      page_view: '👁️', add_to_cart: '🛒', checkout: '💳', purchase: '🛍️',
      signup: '👤', login: '🔑', wishlist: '❤️', logout: '🚪',
    }
    return map[action] || '📝'
  }

  const getActionColor = (action: string) => {
    const map: Record<string, string> = {
      purchase: 'text-emerald-400', signup: 'text-blue-400', login: 'text-cyan-400',
      checkout: 'text-yellow-400', add_to_cart: 'text-orange-400', page_view: 'text-gray-400',
      wishlist: 'text-pink-400',
    }
    return map[action] || 'text-gray-400'
  }

  const totalPages = Math.ceil(total / 50)

  return (
    <div className="p-8 text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold">📋 Activity Log</h1>
        <p className="text-gray-400 mt-1">{total} total activity entries</p>
      </div>

      {/* FILTERS */}
      <div className="flex gap-3 mb-6 flex-wrap items-center">
        <input type="text" placeholder="🔍 Search by email or name..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 w-72" />
        <div className="flex gap-1 bg-gray-800 rounded-xl p-1 overflow-x-auto">
          {ACTION_TYPES.map(a => (
            <button key={a.value} onClick={() => { setActionFilter(a.value); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${actionFilter === a.value ? 'bg-red-600 text-white' : 'text-gray-400 hover:text-white'}`}>
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* LOGS */}
      {loading ? (
        <div className="text-center py-20"><div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
      ) : logs.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16 text-center">
          <div className="text-5xl mb-3">📋</div>
          <p className="text-gray-400">No activity logs found</p>
          <p className="text-gray-500 text-sm mt-2">Activity will appear here as users interact with the store</p>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  {['Action', 'User', 'Page', 'Details', 'Time'].map(h => (
                    <th key={h} className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                    <td className="px-6 py-3">
                      <span className={`flex items-center gap-2 font-semibold text-sm ${getActionColor(log.action)}`}>
                        {getActionIcon(log.action)} {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <p className="text-sm font-semibold truncate max-w-[200px]">{log.user_name || '—'}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">{log.user_email || '—'}</p>
                    </td>
                    <td className="px-6 py-3 text-sm text-gray-400">{log.page || '—'}</td>
                    <td className="px-6 py-3">
                      {log.details ? (
                        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-lg font-mono max-w-[200px] truncate inline-block">
                          {typeof log.details === 'object' ? JSON.stringify(log.details).slice(0, 60) : String(log.details).slice(0, 60)}
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-6 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('en-NP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-800">
              <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-30 transition">← Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-30 transition">Next →</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
