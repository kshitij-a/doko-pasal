'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '../../../components/Navbar'
import CartDrawer from '../../../components/CartDrawer'
import MobileBottomBar from '../../../components/MobileBottomBar'
import { logActivity } from '../../../lib/activity'
import { npFullDate } from '../../../lib/timezone'

export default function ProductDetail() {
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [related, setRelated] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedImg, setSelectedImg] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [cart, setCart] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [wishlist, setWishlist] = useState<string[]>([])
  const [toast, setToast] = useState('')
  const [imgZoom, setImgZoom] = useState(false)
  const [activeTab, setActiveTab] = useState('description')
  const [reviews, setReviews] = useState<any[]>([])
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    // Get product ID from the URL
    const id = window.location.pathname.split('/').pop()
    if (id) {
      loadProduct(id)
      logActivity('product_view', { product_id: id }, `/products/${id}`)
    }
    checkUser()
    try {
      const saved = localStorage.getItem('cart')
      if (saved) setCart(JSON.parse(saved))
    } catch (e) { console.error('Failed to parse cart:', e) }
    try {
      const savedWishlist = localStorage.getItem('wishlist')
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist))
    } catch (e) { console.error('Failed to parse wishlist:', e) }
  }, [])

  const checkUser = async () => {
    try {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    } catch (err) { console.error('Auth check failed:', err) }
  }

  const loadProduct = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()
      if (error) console.error('Error loading product:', error.message)
      else if (data) {
        setProduct(data)
        loadRelated(data.category, data.id)
        loadReviews(data.id)
      }
    } catch (err) { console.error('Failed to load product:', err) }
    finally { setLoading(false) }
  }

  const loadRelated = async (category: string, currentId: string) => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .neq('id', currentId)
        .limit(4)
      if (error) console.error('Error loading related:', error.message)
      else if (data) setRelated(data)
    } catch (err) { console.error('Failed to load related:', err) }
  }

  const loadReviews = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
      if (error) console.error('Error loading reviews:', error.message)
      else if (data) setReviews(data)
    } catch (err) { console.error('Failed to load reviews:', err) }
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const addToCart = () => {
    if (product.sizes?.length > 0 && !selectedSize) {
      showToast('⚠️ Please select a size first!')
      return
    }
    const key = `${product.id}-${selectedSize}`
    const existing = cart.find((i: any) => `${i.id}-${i.selectedSize}` === key)
    let newCart
    if (existing) {
      newCart = cart.map((i: any) =>
        `${i.id}-${i.selectedSize}` === key ? { ...i, qty: i.qty + quantity } : i
      )
    } else {
      newCart = [...cart, { ...product, qty: quantity, selectedSize }]
    }
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
    showToast(`✅ "${product.name}" added to cart!`)
  }

  const buyNow = () => {
    if (product.sizes?.length > 0 && !selectedSize) {
      showToast('⚠️ Please select a size first!')
      return
    }
    addToCart()
    router.push('/cart')
  }

  const toggleWishlist = () => {
    const newWishlist = wishlist.includes(product.id)
      ? wishlist.filter((id: string) => id !== product.id)
      : [...wishlist, product.id]
    setWishlist(newWishlist)
    localStorage.setItem('wishlist', JSON.stringify(newWishlist))
    showToast(wishlist.includes(product.id) ? '💔 Removed from wishlist' : '❤️ Added to wishlist!')
  }

  const submitReview = async () => {
    if (!user) { showToast('⚠️ Please login to leave a review!'); return }
    if (!newReview.comment.trim()) { showToast('⚠️ Please write a comment!'); return }
    setSubmittingReview(true)
    const { error } = await supabase.from('reviews').insert({
      product_id: product.id,
      user_id: user.id,
      user_name: user.user_metadata?.full_name || user.email?.split('@')[0],
      rating: newReview.rating,
      comment: newReview.comment,
    })
    if (!error) {
      showToast('✅ Review submitted!')
      setNewReview({ rating: 5, comment: '' })
      loadReviews(product.id)
    }
    setSubmittingReview(false)
  }

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const images = product?.image_urls?.length > 0
    ? product.image_urls
    : product?.image_url ? [product.image_url] : []

  const cartCount = cart.reduce((a: number, i: any) => a + i.qty, 0)
  const cartTotal = cart.reduce((sum: number, i: any) => sum + i.price * i.qty, 0)

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500">Loading product...</p>
      </div>
    </div>
  )

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="text-6xl mb-4">😕</div>
        <p className="text-gray-500 text-xl mb-4">Product not found</p>
        <Link href="/products" className="bg-red-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600">
          Back to Products
        </Link>
      </div>
    </div>
  )

  return (
    <main className="min-h-screen bg-white pb-16 sm:pb-0">
      {/* TOAST */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl font-semibold text-sm">
          {toast}
        </div>
      )}

      <Navbar onCartOpen={() => setCartOpen(true)} cartCount={cartCount} wishlistCount={wishlist.length} />

      {/* BREADCRUMB */}
      <div className="max-w-6xl mx-auto px-4 py-3 text-sm text-gray-500 flex gap-2 items-center flex-wrap">
        <Link href="/" className="hover:text-red-600">Home</Link>
        <span>›</span>
        <Link href="/products" className="hover:text-red-600">Products</Link>
        <span>›</span>
        <span className="text-gray-800 font-semibold">{product.category}</span>
        <span>›</span>
        <span className="text-gray-800 font-semibold truncate">{product.name}</span>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-10">

          {/* LEFT - IMAGES */}
          <div>
            <div className="relative bg-gray-50 rounded-3xl overflow-hidden cursor-zoom-in mb-3"
              style={{ aspectRatio: '1' }}
              onClick={() => setImgZoom(true)}>
              {images.length > 0 ? (
                <img src={images[selectedImg]} alt={product.name}
                  className="w-full h-full object-cover hover:scale-110 transition duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-9xl opacity-20">
                  {product.category === "Men's Wear" ? '👔' : product.category === "Women's Wear" ? '👗' : '🧒'}
                </div>
              )}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.stock < 5 && product.stock > 0 && (
                  <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold">Only {product.stock} left!</span>
                )}
                {product.stock === 0 && (
                  <span className="bg-red-600 text-white text-xs px-3 py-1 rounded-full font-bold">Sold Out</span>
                )}
              </div>
              <button onClick={(e) => { e.stopPropagation(); toggleWishlist() }}
                className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-xl hover:scale-110 transition">
                {wishlist.includes(product.id) ? '❤️' : '🤍'}
              </button>
              <div className="absolute bottom-4 right-4 bg-black/50 text-white text-xs px-2 py-1 rounded-full">🔍 Click to zoom</div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img: string, i: number) => (
                  <button key={i} onClick={() => setSelectedImg(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition ${selectedImg === i ? 'border-red-600 scale-105' : 'border-gray-200 hover:border-gray-400'}`}>
                    <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT - PRODUCT INFO */}
          <div className="flex flex-col">
            <div className="mb-2">
              <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">{product.category}</span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{product.name}</h1>

            {avgRating && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex">
                  {[1,2,3,4,5].map(star => (
                    <span key={star} className={`text-xl ${star <= Math.round(Number(avgRating)) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                  ))}
                </div>
                <span className="font-bold text-gray-700">{avgRating}</span>
                <span className="text-gray-400 text-sm">({reviews.length} reviews)</span>
              </div>
            )}

            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-4xl font-extrabold text-red-700">Rs. {product.price?.toLocaleString()}</span>
              <span className="text-green-600 text-sm font-bold bg-green-50 px-2 py-0.5 rounded">Free Delivery</span>
            </div>

            {product.description && (
              <p className="text-gray-600 mb-5 leading-relaxed">{product.description}</p>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-5">
                <p className="font-bold text-gray-800 mb-2">Select Size:</p>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((size: string) => (
                    <button key={size} onClick={() => setSelectedSize(size)}
                      className={`px-5 py-2.5 rounded-xl font-bold border-2 transition text-sm ${
                        selectedSize === size
                          ? 'bg-red-700 text-white border-red-700 scale-105'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-red-400 hover:text-red-600'
                      }`}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <p className="font-bold text-gray-800 mb-2">Quantity:</p>
              <div className="flex items-center gap-3">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 font-extrabold text-xl flex items-center justify-center">−</button>
                <span className="w-12 text-center font-extrabold text-xl">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(product.stock || 99, q + 1))}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 font-extrabold text-xl flex items-center justify-center">+</button>
                <span className="text-gray-400 text-sm">{product.stock} in stock</span>
              </div>
            </div>

            <div className="flex gap-3 mb-4">
              <button onClick={addToCart} disabled={product.stock === 0}
                className="flex-1 bg-white border-2 border-red-700 text-red-700 py-4 rounded-2xl font-extrabold text-lg hover:bg-red-50 transition disabled:opacity-50">
                🛒 Add to Cart
              </button>
              <button onClick={buyNow} disabled={product.stock === 0}
                className="flex-1 bg-red-700 text-white py-4 rounded-2xl font-extrabold text-lg hover:bg-red-600 transition shadow-lg disabled:opacity-50">
                ⚡ Buy Now
              </button>
            </div>

            <button onClick={toggleWishlist}
              className="w-full border-2 border-gray-200 text-gray-600 py-3 rounded-2xl font-semibold hover:border-red-300 hover:text-red-600 transition mb-6 flex items-center justify-center gap-2">
              {wishlist.includes(product.id) ? '❤️ Saved to Wishlist' : '🤍 Save to Wishlist'}
            </button>

            <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
              {[
                { icon: '🚚', title: 'Free Delivery', desc: 'Delivered across Nepal in 2-5 days' },
                { icon: '↩️', title: 'Easy Returns', desc: '7-day return policy' },
                { icon: '✅', title: '100% Genuine', desc: 'Quality guaranteed' },
                { icon: '💳', title: 'Secure Payment', desc: 'eSewa, Khalti, COD accepted' },
              ].map(item => (
                <div key={item.title} className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{item.title}</p>
                    <p className="text-gray-500 text-xs">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="mt-16">
          <div className="flex border-b border-gray-200 mb-6">
            {[
              { id: 'description', label: '📋 Description' },
              { id: 'reviews', label: `⭐ Reviews (${reviews.length})` },
              { id: 'delivery', label: '🚚 Delivery Info' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-bold text-sm transition border-b-2 -mb-px ${
                  activeTab === tab.id ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'description' && (
            <div className="max-w-2xl">
              <p className="text-gray-700 leading-relaxed text-lg">{product.description || 'No description available.'}</p>
              {product.sizes?.length > 0 && (
                <div className="mt-4">
                  <p className="font-bold text-gray-800 mb-2">Available Sizes:</p>
                  <div className="flex gap-2 flex-wrap">
                    {product.sizes.map((s: string) => (
                      <span key={s} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-sm font-semibold">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="max-w-2xl">
              {avgRating && (
                <div className="bg-gray-50 rounded-2xl p-6 mb-6 flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-6xl font-extrabold text-gray-900">{avgRating}</p>
                    <div className="flex justify-center mt-1">
                      {[1,2,3,4,5].map(star => (
                        <span key={star} className={`text-2xl ${star <= Math.round(Number(avgRating)) ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                      ))}
                    </div>
                    <p className="text-gray-500 text-sm mt-1">{reviews.length} reviews</p>
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-8">
                {reviews.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="text-5xl mb-2">⭐</div>
                    <p className="text-gray-500">No reviews yet. Be the first!</p>
                  </div>
                ) : reviews.map((review: any) => (
                  <div key={review.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-gray-800">{review.user_name}</p>
                        <div className="flex">
                          {[1,2,3,4,5].map(star => (
                            <span key={star} className={`text-sm ${star <= review.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs">
                        {npFullDate(review.created_at)}
                      </p>
                    </div>
                    <p className="text-gray-600">{review.comment}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="font-extrabold text-gray-800 text-lg mb-4">Write a Review</h3>
                {!user ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500 mb-3">Please login to write a review</p>
                    <Link href="/auth/login" className="bg-red-700 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-600 transition">Login</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="font-semibold text-gray-700 mb-2">Your Rating:</p>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(star => (
                          <button key={star} onClick={() => setNewReview(r => ({ ...r, rating: star }))}>
                            <span className={`text-3xl transition ${star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}>★</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <textarea value={newReview.comment} onChange={e => setNewReview(r => ({ ...r, comment: e.target.value }))}
                      placeholder="Share your experience..." rows={3}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-red-400 resize-none" />
                    <button onClick={submitReview} disabled={submittingReview}
                      className="bg-red-700 text-white px-6 py-3 rounded-xl font-extrabold hover:bg-red-600 transition disabled:opacity-50">
                      {submittingReview ? 'Submitting...' : 'Submit Review ⭐'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'delivery' && (
            <div className="max-w-2xl space-y-4">
              {[
                { icon: '🚚', title: 'Standard Delivery', desc: 'Delivered in 2-5 business days across Nepal. Free for all orders.' },
                { icon: '🏔️', title: 'Hilly Regions', desc: 'Delivery to hilly areas may take 5-10 days.' },
                { icon: '↩️', title: 'Return Policy', desc: 'Return within 7 days if you receive damaged or wrong product.' },
                { icon: '📦', title: 'Packaging', desc: 'All products are carefully packed.' },
              ].map(item => (
                <div key={item.title} className="flex gap-4 p-5 bg-gray-50 rounded-2xl">
                  <span className="text-3xl">{item.icon}</span>
                  <div>
                    <p className="font-extrabold text-gray-800 mb-1">{item.title}</p>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RELATED PRODUCTS */}
        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6">You Might Also Like 👀</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((item: any) => {
                const itemImgs = item.image_urls?.length > 0 ? item.image_urls : item.image_url ? [item.image_url] : []
                return (
                  <Link key={item.id} href={`/products/${item.id}`}
                    className="bg-white rounded-2xl shadow hover:shadow-lg transition overflow-hidden group">
                    <div className="bg-gray-50 h-40 flex items-center justify-center overflow-hidden">
                      {itemImgs.length > 0
                        ? <img src={itemImgs[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                        : <span className="text-5xl opacity-30">{item.category === "Men's Wear" ? '👔' : '👗'}</span>}
                    </div>
                    <div className="p-3">
                      <p className="font-bold text-gray-800 text-sm truncate">{item.name}</p>
                      <p className="text-red-700 font-extrabold mt-1">Rs. {item.price?.toLocaleString()}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* IMAGE ZOOM MODAL */}
      {imgZoom && images.length > 0 && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center" onClick={() => setImgZoom(false)}>
          <div className="relative max-w-3xl max-h-screen p-4">
            <img src={images[selectedImg]} alt={product.name} className="max-w-full max-h-screen object-contain rounded-2xl" />
            <button className="absolute top-2 right-2 bg-white text-gray-800 w-10 h-10 rounded-full font-extrabold text-xl flex items-center justify-center">×</button>
          </div>
        </div>
      )}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        cartTotal={cartTotal}
        onRemove={(key: string) => {
          const newCart = cart.filter((i: any) => `${i.id}-${i.selectedSize}` !== key)
          setCart(newCart)
          localStorage.setItem('cart', JSON.stringify(newCart))
        }}
        onUpdateQty={(key: string, qty: number) => {
          const newCart = cart.map((i: any) => `${i.id}-${i.selectedSize}` === key ? { ...i, qty } : i)
          setCart(newCart)
          localStorage.setItem('cart', JSON.stringify(newCart))
        }}
      />

      <MobileBottomBar cartCount={cartCount} cartTotal={cartTotal} onCartOpen={() => setCartOpen(true)} />

      <footer className="bg-red-700 text-white py-10 text-center mt-16 hidden sm:block">
        <p className="text-xl font-extrabold">🧺 Doko Pasal</p>
        <p className="text-red-200 text-sm mt-1">Made with ❤️ in Nepal</p>
      </footer>
    </main>
  )
}