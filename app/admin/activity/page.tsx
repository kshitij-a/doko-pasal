'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { npDateTime } from '../../../lib/timezone'

const ACTION_TYPES = [
  { value: '', label: 'All' },
  { value: 'page_view', label: '👁️ Views' },
  { value: 'add_to_cart', label: '🛒 Cart' },
  { value: 'checkout', label: '💳 Checkout' },
  { value: 'purchase', label: '🛍️ Purchase' },
  { value: 'signup', label: '👤 Signups' },
  { value: 'login', label: '🔑 Logins' },
]

const ACTION_COLORS: Record<string, { bg: string; color: string }> = {
  purchase: { bg: 'rgba(34,197,94,0.1)', color: 'var(--admin-green)' },
  signup: { bg: 'rgba(59,130,246,0.1)', color: 'var(--admin-blue)' },
  login: { bg: 'rgba(168,85,247,0.1)', color: 'var(--admin-purple)' },
  checkout: { bg: 'rgba(245,158,11,0.1)', color: 'var(--admin-yellow)' },
  add_to_cart: { bg: 'rgba(232,69,96,0.1)', color: 'var(--admin-accent)' },
  page_view: { bg: 'var(--admin-surface-2)', color: 'var(--admin-text-muted)' },
}

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

  const ACTION_ICONS: Record<string, string> = { page_view: '👁️', add_to_cart: '🛒', checkout: '💳', purchase: '🛍️', signup: '👤', login: '🔑', wishlist: '❤️', logout: '🚪' }
  const totalPages = Math.ceil(total / 50)

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Activity Log</h1>
          <p className="admin-page-subtitle">{total} total entries</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)', width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input className="admin-search" placeholder="Search by name or email..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} style={{ width: 260 }} />
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--admin-surface)', padding: 3, borderRadius: 8, border: '1px solid var(--admin-border)' }}>
          {ACTION_TYPES.map(a => (
            <button key={a.value} onClick={() => { setActionFilter(a.value); setPage(1) }}
              style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                background: actionFilter === a.value ? 'var(--admin-accent)' : 'transparent',
                color: actionFilter === a.value ? 'white' : 'var(--admin-text-muted)',
                transition: 'all 0.15s',
              }}>{a.label}</button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="admin-table-container">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading...</div>
        ) : logs.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">📋</div>
            <h3>No activity found</h3>
            <p>Activity will appear here as users interact with the store</p>
          </div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>User</th>
                  <th>Page</th>
                  <th>Details</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const ac = ACTION_COLORS[log.action] || ACTION_COLORS.page_view
                  return (
                    <tr key={log.id}>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 6, background: ac.bg, color: ac.color, font: '500 12px var(--admin-font-ui)' }}>
                          {ACTION_ICONS[log.action] || '📝'} {log.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <div style={{ font: '500 13px var(--admin-font-ui)', color: 'var(--admin-text)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.user_name || '—'}</div>
                        <div style={{ font: '400 11px var(--admin-font-ui)', color: 'var(--admin-text-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.user_email || '—'}</div>
                      </td>
                      <td style={{ font: '400 12px var(--admin-font-ui)', color: 'var(--admin-text-soft)' }}>{log.page || '—'}</td>
                      <td>
                        {log.details ? (
                          <span style={{ font: '400 11px var(--admin-font-mono)', color: 'var(--admin-text-muted)', padding: '2px 8px', borderRadius: 4, background: 'var(--admin-surface-2)', maxWidth: 200, display: 'inline-block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {typeof log.details === 'object' ? JSON.stringify(log.details).slice(0, 50) : String(log.details).slice(0, 50)}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ font: '400 11px var(--admin-font-ui)', color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>
                        {npDateTime(log.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--admin-border)' }}>
                <span style={{ font: '400 13px var(--admin-font-ui)', color: 'var(--admin-text-muted)' }}>Page {page} of {totalPages}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button className="btn-admin-ghost" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                  <button className="btn-admin-ghost" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
