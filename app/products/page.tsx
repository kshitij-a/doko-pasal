'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

function ProductCard({ product, onAddToCart }) {
  const [currentImg, setCurrentImg] = useState(0)
  const [selectedSize, setSelectedSize] = useState('')
  const images = product.image_urls?.length > 0
    ? product.image_urls
    : product.image_url
      ? [product.image_url]
      : []

  const nextImg = (e) => {
    e.stopPropagation()
    setCurrentImg(i => (i + 1) % images.length)
  }
  const prevImg = (e) => {
    e.stopPropagation()
    setCurrentImg(i => (i - 1 + images.length) % images.length)
  }

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
      {/* IMAGE SLIDER */}
      <div className="relative bg-gray-100 h-64 overflow-hidden group">
        {images.length > 0 ? (
          <>
            <img
              src={images[currentImg]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {images.length > 1 && (
              <>
                <button onClick={prevImg}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white w-9 h-9 rounded-full text-xl font-bold flex items-center justify-center transition opacity-0 group-hover:opacity-100">
                  ‹
                </button>
                <button onClick={nextImg}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white w-9 h-9 rounded-full text-xl font-bold flex items-center justify-center transition opacity-0 group-hover:opacity-100">
                  ›
                </button>
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {images.map((_, i) => (
                    <button key={i} onClick={(e) => { e.stopPropagation(); setCurrentImg(i) }}
                      className={`w-2 h-2 rounded-full transition-all ${i === currentImg ? 'bg-white scale-125' : 'bg-white/50'}`} />
                  ))}
                </div>
                <span className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                  {currentImg + 1}/{images.length}
                </span>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl opacity-30">
            {product.category === "Men's Wear" ? '👔' : product.category === "Women's Wear" ? '👗' : '🧒'}
          </div>
        )}
        <span className="absolute top-3 left-3 bg-red-700 text-white text-xs px-3 py-1 rounded-full font-bold shadow">
          {product.category}
        </span>
        {product.stock < 5 && product.stock > 0 && (
          <span className="absolute bottom-3 right-3 bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-bold">
            Only {product.stock} left!
          </span>
        )}
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-600 text-white px-4 py-2 rounded-full font-bold text-lg">Sold Out</span>
          </div>
        )}
      </div>

      {/* PRODUCT INFO */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-extrabold text-gray-900 mb-1">{product.name}</h3>
        {product.description && (
          <p className="text-gray-500 text-sm mb-3 line-clamp-2 flex-1">{product.description}</p>
        )}

        {/* SIZE SELECTOR */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Select Size:</p>
            <div className="flex gap-1.5 flex-wrap">
              {product.sizes.map(size => (
                <button key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border-2 transition ${
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

        {/* PRICE + BUTTON */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          <div>
            <span className="text-2xl font-extrabold text-red-700">
              Rs. {product.price?.toLocaleString()}
            </span>
          </div>
          <button
            onClick={() => {
              if (product.sizes?.length > 0 && !selectedSize) {
                alert('Please select a size first!')
                return
              }
              onAddToCart({ ...product, selectedSize })
            }}
            disabled={product.stock === 0}
            className="bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-600 active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow">
            {product.stock === 0 ? 'Sold Out' : '🛒 Add to Cart'}
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
  const [user, setUser] = useState(null)
  const [cart, setCart] = useState([])
  const [toast, setToast] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')

  useEffect(() => {
    fetchProducts()
    checkUser()
    const saved = localStorage.getItem('cart')
    if (saved) setCart(JSON.parse(saved))
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

  const addToCart = (product) => {
    const key = `${product.id}-${product.selectedSize}`
    const existing = cart.find(i => `${i.id}-${i.selectedSize}` === key)
    let newCart
    if (existing) {
      newCart = cart.map(i => `${i.id}-${i.selectedSize}` === key ? { ...i, qty: i.qty + 1 } : i)
    } else {
      newCart = [...cart, { ...product, qty: 1 }]
    }
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
    setToast(`✅ "${product.name}" added to cart!`)
    setTimeout(() => setToast(''), 2500)
  }

  const categories = ['All', "Men's Wear", "Women's Wear", "Kids' Wear"]

  let filtered = category === 'All' ? [...products] : products.filter(p => p.category === category)

  if (search.trim()) {
    filtered = filtered.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
    )
  }

  if (sort === 'price-low') filtered.sort((a, b) => a.price - b.price)
  else if (sort === 'price-high') filtered.sort((a, b) => b.price - a.price)

  const cartCount = cart.reduce((a, i) => a + i.qty, 0)

  return (
    <main className="min-h-screen bg-gray-50">

      {/* TOAST */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl font-semibold text-sm animate-bounce">
          {toast}
        </div>
      )}

      {/* NAVBAR */}
      <nav className="bg-red-700 text-white px-6 py-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <Link href="/" className="text-2xl font-extrabold tracking-wide flex items-center gap-2">
          🧺 Doko Pasal
        </Link>
        <div className="flex gap-3 items-center">
          <Link href="/cart" className="relative hover:text-yellow-300 font-semibold text-lg transition">
            🛒 Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-yellow-400 text-red-800 text-xs rounded-full w-5 h-5 flex items-center justify-center font-extrabold shadow">
                {cartCount}
              </span>
            )}
          </Link>
          {user ? (
            <Link href="/orders" className="bg-yellow-400 text-red-800 px-4 py-1.5 rounded-full font-extrabold hover:bg-yellow-300 transition text-sm">
              My Orders
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="bg-white text-red-700 px-4 py-1.5 rounded-full font-extrabold hover:bg-gray-100 transition text-sm">
                Login
              </Link>
              <Link href="/auth/signup" className="bg-yellow-400 text-red-800 px-4 py-1.5 rounded-full font-extrabold hover:bg-yellow-300 transition text-sm">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* HERO HEADER */}
      <div className="bg-gradient-to-r from-red-800 via-red-700 to-red-600 text-white py-14 px-8 text-center">
        <h1 className="text-5xl font-extrabold mb-3 drop-shadow">Our Collection</h1>
        <p className="text-red-200 text-xl">Premium quality clothing — Made for Nepal 🇳🇵</p>
        <p className="text-red-300 text-sm mt-2">{products.length} products available</p>
      </div>

      {/* SEARCH + SORT BAR */}
      <div className="bg-white shadow-sm px-4 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-3 items-center justify-between">
          <input
            type="text"
            placeholder="🔍 Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 w-64"
          />
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition ${
                  category === cat
                    ? 'bg-red-700 text-white border-red-700'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-red-400 hover:text-red-600'
                }`}>
                {cat}
              </button>
            ))}
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white">
            <option value="newest">Newest First</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* PRODUCTS GRID */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        {loading ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 text-lg">Loading products...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🧺</div>
            <p className="text-gray-500 text-xl font-semibold">No products found</p>
            <p className="text-gray-400 text-sm mt-2">Try a different category or search term</p>
          </div>
        ) : (
          <>
            <p className="text-gray-500 text-sm mb-6">{filtered.length} product{filtered.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filtered.map(product => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* FOOTER */}
      <footer className="bg-red-700 text-white py-10 text-center mt-10">
        <p className="text-xl font-extrabold">🧺 Doko Pasal</p>
        <p className="text-red-200 text-sm mt-1">Premium clothing from the heart of Nepal</p>
        <p className="text-red-300 text-xs mt-3">© 2026 Doko Pasal. All rights reserved.</p>
      </footer>
    </main>
  )
}