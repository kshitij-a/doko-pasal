'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'
import Navbar from '../../components/Navbar'
import CartDrawer from '../../components/CartDrawer'
import MobileBottomBar from '../../components/MobileBottomBar'
import { logActivity } from '../../lib/activity'

function ProductCard({ product, onAddToCart, onToggleWishlist, inWishlist, onQuickAdd }: {
  product: any, onAddToCart: any, onToggleWishlist: any, inWishlist: boolean, onQuickAdd: (p: any, size: string) => void
}) {
  const [currentImg, setCurrentImg] = useState(0)
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '')
  const images = product.image_urls?.length > 0
    ? product.image_urls
    : product.image_url ? [product.image_url] : []

  return (
    <div className="product-card group">
      <Link href={`/products/${product.id}`}>
        <div className="product-image-wrap">
          {images.length > 0 ? (
            <>
              <img src={images[currentImg]} alt={product.name} className="w-full h-full object-cover" />
              {images.length > 1 && (
                <>
                  <button onClick={(e) => { e.preventDefault(); setCurrentImg(i => (i - 1 + images.length) % images.length) }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#1E1A16] w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow">‹</button>
                  <button onClick={(e) => { e.preventDefault(); setCurrentImg(i => (i + 1) % images.length) }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-[#1E1A16] w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow">›</button>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl bg-[#F5F2EE]">🧺</div>
          )}
          {/* Badges */}
          {product.sale_price && product.sale_price < product.price && (
            <span className="absolute top-3 left-3 badge-sale">SALE</span>
          )}
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-[#1E1A16]/50 flex items-center justify-center">
              <span className="bg-[#1E1A16] text-white px-4 py-1.5 rounded-full font-bold text-sm">Sold Out</span>
            </div>
          )}
          {product.stock > 0 && product.stock < 5 && (
            <span className="absolute bottom-3 right-3 badge-sale text-[10px]">Only {product.stock} left!</span>
          )}
          {/* Wishlist */}
          <button
            onClick={(e) => { e.preventDefault(); onToggleWishlist(product.id) }}
            className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow transition ${inWishlist ? 'bg-[#B5293A] text-white' : 'bg-white/80 hover:bg-white text-[#6B6560]'}`}
          >
            {inWishlist ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>
            )}
          </button>
        </div>
      </Link>

      <div className="product-body">
        <p className="product-category">{product.category || 'Clothing'}</p>
        <Link href={`/products/${product.id}`}>
          <h3 className="product-name hover:text-[#B5293A] transition cursor-pointer line-clamp-1">{product.name}</h3>
        </Link>

        {product.sizes && product.sizes.length > 0 && (
          <div className="size-pills mb-3">
            {product.sizes.map((size: string) => (
              <button key={size} onClick={() => setSelectedSize(size)}
                className={`size-pill ${selectedSize === size ? 'active' : ''}`}>
                {size}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mb-3">
          <span className="price">Rs. {(product.sale_price || product.price)?.toLocaleString()}</span>
          {product.sale_price && product.sale_price < product.price && (
            <span className="price-old">Rs. {product.price?.toLocaleString()}</span>
          )}
        </div>

        <button
          onClick={() => onQuickAdd(product, selectedSize)}
          disabled={product.stock === 0}
          className="btn-quick-add text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {product.stock === 0 ? 'Sold Out' : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}

export default function Products() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('All')
  const [user, setUser] = useState<any>(null)
  const [cart, setCart] = useState<any[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [cartOpen, setCartOpen] = useState(false)

  useEffect(() => {
    fetchProducts()
    checkUser()
    try {
      const saved = localStorage.getItem('cart')
      if (saved) setCart(JSON.parse(saved))
    } catch (e) { console.error('Failed to parse cart:', e) }
    try {
      const savedWishlist = localStorage.getItem('wishlist')
      if (savedWishlist) setWishlist(JSON.parse(savedWishlist))
    } catch (e) { console.error('Failed to parse wishlist:', e) }
    logActivity('page_view', { page: 'products' }, '/products')
  }, [])

  const checkUser = async () => {
    try {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
    } catch (err) { console.error('Auth check failed:', err) }
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
      if (error) {
        console.error('Error fetching products:', error.message)
      } else if (data) {
        setProducts(data)
      }
    } catch (err) {
      console.error('Failed to fetch products:', err)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product: any, size: string) => {
    if (product.sizes?.length > 0 && !size) {
      setToast('⚠️ Please select a size first!')
      setTimeout(() => setToast(''), 2500)
      return
    }
    const key = `${product.id}-${size}`
    const existing = cart.find((i: any) => `${i.id}-${i.selectedSize}` === key)
    let newCart
    if (existing) {
      newCart = cart.map((i: any) => `${i.id}-${i.selectedSize}` === key ? { ...i, qty: i.qty + 1 } : i)
    } else {
      newCart = [...cart, { ...product, qty: 1, selectedSize: size }]
    }
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
    setToast(`✅ "${product.name}" added to cart!`)
    logActivity('add_to_cart', { product_name: product.name, product_id: product.id, size, price: product.price }, '/products')
    setTimeout(() => setToast(''), 2500)
  }

  const toggleWishlist = (productId: string) => {
    const isSaved = wishlist.includes(productId)
    const updated = isSaved ? wishlist.filter(id => id !== productId) : [...wishlist, productId]
    setWishlist(updated)
    localStorage.setItem('wishlist', JSON.stringify(updated))
    setToast(isSaved ? '💔 Removed from wishlist' : '❤️ Added to wishlist')
    logActivity('wishlist', { product_id: productId, action: isSaved ? 'remove' : 'add' }, '/products')
    setTimeout(() => setToast(''), 2000)
  }

  const removeCartItem = (key: string) => {
    const newCart = cart.filter((i: any) => `${i.id}-${i.selectedSize}` !== key)
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
  }

  const updateQty = (key: string, qty: number) => {
    const newCart = cart.map((i: any) => `${i.id}-${i.selectedSize}` === key ? { ...i, qty } : i)
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
  }

  const categories = ['All', "Men's Wear", "Women's Wear", "Kids' Wear"]
  let filtered = category === 'All' ? [...products] : products.filter((p: any) => p.category === category)
  if (search.trim()) {
    filtered = filtered.filter((p: any) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    )
  }
  if (sort === 'price-low') filtered.sort((a: any, b: any) => a.price - b.price)
  else if (sort === 'price-high') filtered.sort((a: any, b: any) => b.price - a.price)

  const cartCount = cart.reduce((a: number, i: any) => a + i.qty, 0)
  const wishlistCount = wishlist.length
  const cartTotal = cart.reduce((sum: number, i: any) => sum + i.price * i.qty, 0)

  return (
    <main className="min-h-screen bg-[#FAF8F4] pb-28 sm:pb-0">
      {/* TOAST */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-[#1E1A16] text-white px-5 py-2.5 rounded-2xl shadow-2xl font-semibold text-sm animate-fade-in">
          {toast}
        </div>
      )}

      <Navbar onCartOpen={() => setCartOpen(true)} cartCount={cartCount} wishlistCount={wishlistCount} />

      {/* HERO */}
      <div className="bg-[#FAF8F4] py-10 sm:py-14 px-6 sm:px-8 text-center border-b border-[#E8E3DB]">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1E1A16] mb-2" style={{ fontFamily: 'var(--font-display)' }}>Our Collection</h1>
        <p className="text-[#6B6560] text-base sm:text-lg">Premium quality clothing — Made for Nepal</p>
        <div className="w-12 h-0.5 bg-[#B5293A] mx-auto mt-4 rounded-full" />
        <p className="text-[#9E9994] text-xs sm:text-sm mt-3">{products.length} products available</p>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border-b border-[#E8E3DB] px-4 py-3 sm:py-4 sticky top-[88px] sm:top-[92px] z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`filter-pill whitespace-nowrap flex-shrink-0 ${category === cat ? 'active' : ''}`}>
                {cat}
              </button>
            ))}
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="border border-[#E8E3DB] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#B5293A] bg-white flex-shrink-0 font-semibold text-[#6B6560] cursor-pointer">
            <option value="newest">Newest</option>
            <option value="price-low">Price ↑</option>
            <option value="price-high">Price ↓</option>
          </select>
        </div>
      </div>

      {/* PRODUCTS GRID */}
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
        {loading ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 border-4 border-[#B5293A] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#6B6560] text-base sm:text-lg">Loading products...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🧺</div>
            <p className="text-[#6B6560] text-lg font-semibold">No products found</p>
            <button onClick={() => { setCategory('All'); setSearch('') }}
              className="mt-4 text-[#B5293A] font-bold text-sm hover:underline">Clear filters</button>
          </div>
        ) : (
          <>
            <p className="text-[#9E9994] text-xs sm:text-sm mb-4 sm:mb-6">{filtered.length} product{filtered.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
              {filtered.map((product: any) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                  onToggleWishlist={toggleWishlist}
                  inWishlist={wishlist.includes(product.id)}
                  onQuickAdd={addToCart}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        cartTotal={cartTotal}
        onRemove={removeCartItem}
        onUpdateQty={updateQty}
      />

      <MobileBottomBar cartCount={cartCount} cartTotal={cartTotal} onCartOpen={() => setCartOpen(true)} />

      <footer className="bg-red-700 text-white py-8 text-center mt-8 sm:mt-10 hidden sm:block">
        <p className="text-xl font-extrabold">🧺 Doko Pasal</p>
        <p className="text-red-200 text-sm mt-1">Made with ❤️ in Nepal</p>
      </footer>
    </main>
  )
}
