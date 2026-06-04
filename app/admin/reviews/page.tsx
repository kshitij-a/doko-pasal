'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../../lib/supabase'

export default function AdminReviews() {
  const router = useRouter()
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState('')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { checkAdmin() }, [])

  const checkAdmin = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.push('/auth/login'); return }
    const { data: adminData } = await supabase.from('admins').select('email').eq('email', userData.user.email).single()
    if (!adminData) { router.push('/'); return }
    fetchReviews()
  }

  const [products, setProducts] = useState<Record<string, any>>({})

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
    if (!error) {
      showToast('🗑️ Review deleted')
      setReviews(reviews.filter(r => r.id !== id))
    }
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

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-8 text-white">
      {toast && <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-gray-800 text-white px-6 py-3 rounded-2xl shadow-2xl font-semibold text-sm border border-gray-700">{toast}</div>}

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold">⭐ Review Moderation</h1>
        <p className="text-gray-400 mt-1">{reviews.length} total reviews</p>
      </div>

      {/* RATING OVERVIEW */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-8 flex items-center gap-8">
        <div className="text-center">
          <p className="text-5xl font-extrabold">{avgRating}</p>
          <div className="flex justify-center mt-1">
            {[1,2,3,4,5].map(s => <span key={s} className={`text-xl ${s <= Math.round(Number(avgRating)) ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>)}
          </div>
          <p className="text-gray-400 text-sm mt-1">{reviews.length} reviews</p>
        </div>
        <div className="flex-1 space-y-2">
          {ratingCounts.map(r => (
            <div key={r.star} className="flex items-center gap-3">
              <span className="text-sm font-bold w-8">{r.star} ★</span>
              <div className="flex-1 bg-gray-800 rounded-full h-2.5">
                <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: `${r.pct}%` }} />
              </div>
              <span className="text-xs text-gray-400 w-8 text-right">{r.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex gap-3 mb-6 flex-wrap items-center">
        {['all', '5', '4', '3', '2', '1'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition ${filter === f ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>
            {f === 'all' ? 'All' : `${f} ★`}
          </button>
        ))}
        <input type="text" placeholder="Search reviews..." value={search} onChange={e => setSearch(e.target.value)}
          className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 ml-auto w-64" />
      </div>

      {/* REVIEWS LIST */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-16 text-center">
            <div className="text-5xl mb-3">⭐</div>
            <p className="text-gray-400">No reviews found</p>
          </div>
        ) : filtered.map(review => (
          <div key={review.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-sm font-bold">
                    {(review.user_name?.[0] || '?').toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{review.user_name || 'Anonymous'}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex">{[1,2,3,4,5].map(s => <span key={s} className={`text-sm ${s <= review.rating ? 'text-yellow-400' : 'text-gray-600'}`}>★</span>)}</div>
                      <span className="text-xs text-gray-500">{new Date(review.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-300 ml-12">{review.comment}</p>
                {review.product_id && products[review.product_id] && (
                  <div className="ml-12 mt-2 flex items-center gap-2 bg-gray-800/50 rounded-lg px-3 py-1.5">
                    {products[review.product_id].image_url && (
                      <img src={products[review.product_id].image_url} alt="" className="w-6 h-6 rounded object-cover" />
                    )}
                    <span className="text-xs text-gray-300 font-medium">{products[review.product_id].name}</span>
                    <span className="text-xs text-gray-500">· Rs. {products[review.product_id].price?.toLocaleString()}</span>
                  </div>
                )}
              </div>
              <button onClick={() => deleteReview(review.id)}
                className="bg-red-600/20 text-red-300 border border-red-500/30 px-3 py-2 rounded-xl text-sm font-bold hover:bg-red-600/40 transition flex-shrink-0">
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
