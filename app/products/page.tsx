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
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const images = product.image_urls?.length > 0
    ? product.image_urls
    : product.image_url ? [product.image_url] : []

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group">
      {/* IMAGE SLIDER */}
      <Link href={`/products/${product.id}`}>
        <div className="relative bg-gray-100 aspect-[3/4] overflow-hidden cursor-pointer">
          {images.length > 0 ? (
            <>
              <img src={images[currentImg]} alt={product.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              {images.length > 1 && (
                <>
                  <button onClick={(e) => { e.preventDefault(); setCurrentImg(i => (i - 1 + images.length) % images.length) }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white w-8 h-8 rounded-full text-lg font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition">‹</button>
                  <button onClick={(e) => { e.preventDefault(); setCurrentImg(i => (i + 1) % images.length) }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white w-8 h-8 rounded-full text-lg font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition">›</button>
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                    {images.map((_: any, i: number) => (
                      <button key={i} onClick={(e) => { e.preventDefault(); setCurrentImg(i) }}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImg ? 'bg-white scale-125' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl opacity-30">
              {product.category === "Men's Wear" ? '👔' : product.category === "Women's Wear" ? '👗' : '🧒'}
            </div>
          )}
          {/* Badges */}
          <span className="absolute top-2 left-2 bg-red-700 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow">
            {product.category}
          </span>
          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-red-600 text-white px-3 py-1.5 rounded-full font-bold text-sm">Sold Out</span>
            </div>
          )}
          {product.stock > 0 && product.stock < 5 && (
            <span className="absolute bottom-2 right-2 bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
              Only {product.stock} left!
            </span>
          )}
          {/* View detail hint */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
            <span className="bg-white text-gray-800 px-3 py-1.5 rounded-full font-bold text-xs opacity-0 group-hover:opacity-100 transition shadow-lg">
              View Details →
            </span>
          </div>
          {/* Wishlist button */}
          <button
            onClick={(e) => { e.preventDefault(); onToggleWishlist(product.id) }}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition ${inWishlist ? 'bg-red-600 text-white' : 'bg-white text-gray-700 hover:scale-110'}`}
            title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {inWishlist ? '❤️' : '🤍'}
          </button>
        </div>
      </Link>

      {/* PRODUCT INFO */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <Link href={`/products/${product.id}`}>
          <h3 className="text-sm sm:text-base font-extrabold text-gray-900 mb-1 hover:text-red-600 transition cursor-pointer line-clamp-1">{product.name}</h3>
        </Link>

        {/* SIZE SWATCHES */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="mb-2 sm:mb-3">
            <div className="flex gap-1 flex-wrap">
              {product.sizes.map((size: string) => (
                <button key={size} onClick={() => setSelectedSize(size)}
                  className={`px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold border transition ${
                    selectedSize === size
                      ? 'bg-red-700 text-white border-red-700'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-red-400 hover:text-red-600'
                  }`}>
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PRICE + BUTTONS */}
        <div className="mt-auto pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg sm:text-xl font-extrabold text-red-700">Rs. {product.price?.toLocaleString()}</span>
          </div>
          <button
            onClick={() => onQuickAdd(product, selectedSize)}
            disabled={product.stock === 0}
            className="w-full bg-red-700 text-white py-2 rounded-xl font-bold hover:bg-red-600 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm shadow">
            {product.stock === 0 ? 'Sold Out' : '🛒 Quick Add'}
          </button>
        </div>
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
    const saved = localStorage.getItem('cart')
    if (saved) setCart(JSON.parse(saved))
    const savedWishlist = localStorage.getItem('wishlist')
    if (savedWishlist) setWishlist(JSON.parse(savedWishlist))
    logActivity('page_view', { page: 'products' }, '/products')
  }, [])

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser()
    setUser(data.user)
  }

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (data) setProducts(data)
    setLoading(false)
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
    <main className="min-h-screen bg-gray-50 pb-28 sm:pb-0">
      {/* TOAST */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-5 py-2.5 rounded-2xl shadow-2xl font-semibold text-sm animate-fade-in">
          {toast}
        </div>
      )}

      <Navbar onCartOpen={() => setCartOpen(true)} cartCount={cartCount} wishlistCount={wishlistCount} />

      {/* HERO */}
      <div className="bg-gradient-to-r from-red-800 via-red-700 to-red-600 text-white py-10 sm:py-14 px-6 sm:px-8 text-center">
        <h1 className="text-3xl sm:text-5xl font-extrabold mb-2 sm:mb-3 drop-shadow">Our Collection</h1>
        <p className="text-red-200 text-base sm:text-xl">Premium quality clothing — Made for Nepal 🇳🇵</p>
        <p className="text-red-300 text-xs sm:text-sm mt-2">{products.length} products available</p>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white shadow-sm px-4 py-3 sm:py-4 sticky top-[52px] sm:top-[56px] z-40">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold border-2 transition whitespace-nowrap flex-shrink-0 ${
                  category === cat ? 'bg-red-700 text-white border-red-700' : 'bg-white text-gray-700 border-gray-200 hover:border-red-400'
                }`}>
                {cat}
              </button>
            ))}
            <select value={sort} onChange={e => setSort(e.target.value)}
              className="border border-gray-300 rounded-xl px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white flex-shrink-0">
              <option value="newest">Newest</option>
              <option value="price-low">Price ↑</option>
              <option value="price-high">Price ↓</option>
            </select>
          </div>
        </div>
      </div>

      {/* PRODUCTS GRID */}
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
        {loading ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 text-base sm:text-lg">Loading products...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🧺</div>
            <p className="text-gray-500 text-lg font-semibold">No products found</p>
            <button onClick={() => { setCategory('All'); setSearch('') }}
              className="mt-4 text-red-600 font-bold text-sm hover:underline">Clear filters</button>
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-xs sm:text-sm mb-4 sm:mb-6">{filtered.length} product{filtered.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
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
