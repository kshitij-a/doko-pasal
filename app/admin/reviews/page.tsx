'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'
import { npFullDate } from '../../../lib/timezone'

export default function AdminReviews() {
  const router = useRouter()
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Record<string, any>>({})

  useEffect(() => { checkAdmin() }, [])

  const checkAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/auth/login'); return }
    const { data: adminData } = await supabase.from('admins').select('email').eq('email', userData.user.email).single()
    if (!adminData) { router.push('/'); return }
    fetchReviews()
  }

  const fetchReviews = async () => {
    const { data } = await supabase.from('reviews').select('*').order('created_at', { ascending: false })
    setReviews(data || [])
    const productIds = [...new Set((data || []).map(r => r.product_id).filter(Boolean))]
    if (productIds.length > 0) {
      const { data: productsData } = await supabase.from('products').select('id, name, price, image_url').in('id', productIds)
      const productMap: Record<string, any> = {}
      productsData?.forEach(p => { productMap[p.id] = p })
      setProducts(productMap)
    }
    setLoading(false)
  }

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review?')) return
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (!error) { showToast('Review deleted'); setReviews(reviews.filter(r => r.id !== id)) }
  }

  const filtered = reviews.filter(r => {
    const matchesFilter = filter === 'all' || r.rating === Number(filter)
    const q = search.toLowerCase()
    const matchesSearch = !q || r.user_name?.toLowerCase().includes(q) || r.comment?.toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0'
  const ratingCounts = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    pct: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length * 100) : 0
  }))

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading reviews...</div>

  return (
    <div>
      {toast && <div className="admin-toast" style={{ background: 'rgba(34,197,94,0.15)', color: 'var(--admin-green)', border: '1px solid rgba(34,197,94,0.3)' }}>{toast}</div>}

      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Reviews</h1>
          <p className="admin-page-subtitle">{reviews.length} reviews · {avgRating} avg rating</p>
        </div>
      </div>

      {/* Rating Overview */}
      <div className="admin-card" style={{ padding: 20, marginBottom: 16, display: 'flex', gap: 32, alignItems: 'center' }}>
        <div style={{ textAlign: 'center', minWidth: 80 }}>
          <div style={{ font: '700 40px var(--admin-font-mono)', color: 'var(--admin-text)' }}>{avgRating}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 4 }}>
            {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 16, color: s <= Math.round(Number(avgRating)) ? 'var(--admin-yellow)' : 'var(--admin-surface-3)' }}>★</span>)}
          </div>
          <div style={{ font: '400 11px var(--admin-font-ui)', color: 'var(--admin-text-muted)', marginTop: 4 }}>{reviews.length} reviews</div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ratingCounts.map(r => (
            <div key={r.star} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ font: '500 12px var(--admin-font-mono)', color: 'var(--admin-text-soft)', width: 24, textAlign: 'right' }}>{r.star}★</span>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--admin-surface-2)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 3, background: 'var(--admin-yellow)', width: `${r.pct}%`, transition: 'width 0.5s ease' }} />
              </div>
              <span style={{ font: '400 11px var(--admin-font-mono)', color: 'var(--admin-text-muted)', width: 30, textAlign: 'right' }}>{r.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all', '5', '4', '3', '2', '1'].map(f => (
            <button key={f} className={`admin-filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : `${f} ★`}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--admin-text-muted)', width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input className="admin-search" placeholder="Search reviews..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 240 }} />
        </div>
      </div>

      {/* Reviews List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">⭐</div>
            <h3>No reviews found</h3>
          </div>
        ) : filtered.map(review => (
          <div key={review.id} className="admin-card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 36, height: 36, borderRadius: 18, background: 'linear-gradient(135deg, var(--admin-accent), rgba(232,69,96,0.6))', display: 'flex', alignItems: 'center', justifyContent: 'center', font: '600 14px var(--admin-font-ui)', color: 'white', flexShrink: 0 }}>
                {(review.user_name?.[0] || '?').toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ font: '500 13px var(--admin-font-ui)', color: 'var(--admin-text)' }}>{review.user_name || 'Anonymous'}</span>
                  <span style={{ display: 'flex', gap: 1 }}>
                    {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 13, color: s <= review.rating ? 'var(--admin-yellow)' : 'var(--admin-surface-3)' }}>★</span>)}
                  </span>
                  <span style={{ font: '400 11px var(--admin-font-ui)', color: 'var(--admin-text-muted)' }}>{npFullDate(review.created_at)}</span>
                </div>
                <p style={{ font: '400 13px var(--admin-font-ui)', color: 'var(--admin-text-soft)', margin: 0, lineHeight: 1.5 }}>{review.comment}</p>
                {review.product_id && products[review.product_id] && (
                  <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 6, background: 'var(--admin-surface-2)', border: '1px solid var(--admin-border)' }}>
                    {products[review.product_id].image_url && <img src={products[review.product_id].image_url} alt="" style={{ width: 20, height: 20, borderRadius: 4, objectFit: 'cover' }} />}
                    <span style={{ font: '400 11px var(--admin-font-ui)', color: 'var(--admin-text-soft)' }}>{products[review.product_id].name}</span>
                    <span style={{ font: '400 11px var(--admin-font-mono)', color: 'var(--admin-text-muted)' }}>Rs. {products[review.product_id].price?.toLocaleString()}</span>
                  </div>
                )}
              </div>
              <button onClick={() => deleteReview(review.id)} style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--admin-text-soft)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--admin-red)'; e.currentTarget.style.color = 'var(--admin-red)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--admin-border)'; e.currentTarget.style.color = 'var(--admin-text-soft)' }}>🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
