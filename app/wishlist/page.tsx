'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Link from 'next/link'

export default function Wishlist() {
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cart, setCart] = useState<any[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [user, setUser] = useState<any>(null)
  const [toast, setToast] = useState('')

  useEffect(() => {
    checkUser()
    const savedCart = localStorage.getItem('cart')
    if (savedCart) setCart(JSON.parse(savedCart))
    const savedWishlist = localStorage.getItem('wishlist')
    if (savedWishlist) {
      const ids = JSON.parse(savedWishlist)
      setWishlist(ids)
      if (ids.length > 0) fetchWishlistProducts(ids)
      else setLoading(false)
    } else {
      setLoading(false)
    }
  }, [])

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser()
    setUser(data.user)
  }

  const fetchWishlistProducts = async (ids: string[]) => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .in('id', ids)
    if (data) setProducts(data)
    setLoading(false)
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const removeFromWishlist = (productId: string) => {
    const newWishlist = wishlist.filter(id => id !== productId)
    setWishlist(newWishlist)
    setProducts(products.filter(p => p.id !== productId))
    localStorage.setItem('wishlist', JSON.stringify(newWishlist))
    showToast('💔 Removed from wishlist')
  }

  const addToCart = (product: any) => {
    const existing = cart.find((i: any) => i.id === product.id)
    let newCart
    if (existing) {
      newCart = cart.map((i: any) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
    } else {
      newCart = [...cart, { ...product, qty: 1 }]
    }
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
    showToast(`✅ "${product.name}" added to cart!`)
  }

  const addAllToCart = () => {
    let newCart = [...cart]
    products.forEach(product => {
      const existing = newCart.find((i: any) => i.id === product.id)
      if (existing) {
        newCart = newCart.map((i: any) => i.id === product.id ? { ...i, qty: i.qty + 1 } : i)
      } else {
        newCart = [...newCart, { ...product, qty: 1 }]
      }
    })
    setCart(newCart)
    localStorage.setItem('cart', JSON.stringify(newCart))
    showToast(`✅ All ${products.length} items added to cart!`)
  }

  const clearWishlist = () => {
    if (!confirm('Clear your entire wishlist?')) return
    setWishlist([])
    setProducts([])
    localStorage.removeItem('wishlist')
    showToast('🗑️ Wishlist cleared')
  }

  const cartCount = cart.reduce((a: number, i: any) => a + i.qty, 0)

  return (
    <main className="min-h-screen bg-gray-50">

      {/* TOAST */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl font-semibold text-sm">
          {toast}
        </div>
      )}

      {/* NAVBAR */}
      <nav className="bg-red-700 text-white px-6 py-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <Link href="/" className="text-2xl font-extrabold">🧺 Doko Pasal</Link>
        <div className="flex gap-3 items-center">
          <Link href="/products" className="hover:text-yellow-300 font-medium hidden sm:block">Shop</Link>
          <Link href="/cart" className="relative hover:text-yellow-300 font-medium text-lg">
            🛒 Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-yellow-400 text-red-800 text-xs rounded-full w-5 h-5 flex items-center justify-center font-extrabold">
                {cartCount}
              </span>
            )}
          </Link>
          {user ? (
            <Link href="/orders" className="bg-yellow-400 text-red-800 px-4 py-1.5 rounded-full font-extrabold text-sm">My Orders</Link>
          ) : (
            <Link href="/auth/login" className="bg-white text-red-700 px-4 py-1.5 rounded-full font-extrabold text-sm">Login</Link>
          )}
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">❤️ My Wishlist</h1>
            <p className="text-gray-500 mt-1">{products.length} item{products.length !== 1 ? 's' : ''} saved</p>
          </div>
          {products.length > 0 && (
            <div className="flex gap-3">
              <button onClick={addAllToCart}
                className="bg-red-700 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-600 transition text-sm shadow">
                🛒 Add All to Cart
              </button>
              <button onClick={clearWishlist}
                className="bg-gray-200 text-gray-600 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-300 transition text-sm">
                🗑️ Clear All
              </button>
            </div>
          )}
        </div>

        {/* EMPTY STATE */}
        {loading ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading wishlist...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-3xl shadow p-20 text-center">
            <div className="text-8xl mb-4">🤍</div>
            <h2 className="text-2xl font-extrabold text-gray-700 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-400 mb-8">Save products you love by clicking the ❤️ button</p>
            <Link href="/products"
              className="bg-red-700 text-white px-10 py-4 rounded-2xl font-extrabold text-lg hover:bg-red-600 transition shadow-lg">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((product: any) => {
              const images = product.image_urls?.length > 0
                ? product.image_urls
                : product.image_url ? [product.image_url] : []

              return (
                <div key={product.id} className="bg-white rounded-2xl shadow-md hover:shadow-xl transition overflow-hidden group">
                  {/* Image */}
                  <Link href={`/products/${product.id}`}>
                    <div className="relative h-56 bg-gray-50 overflow-hidden cursor-pointer">
                      {images.length > 0 ? (
                        <img src={images[0]} alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">
                          {product.category === "Men's Wear" ? '👔' : product.category === "Women's Wear" ? '👗' : '🧒'}
                        </div>
                      )}
                      <span className="absolute top-3 left-3 bg-red-700 text-white text-xs px-3 py-1 rounded-full font-bold">
                        {product.category}
                      </span>
                      {/* Remove from wishlist */}
                      <button
                        onClick={(e) => { e.preventDefault(); removeFromWishlist(product.id) }}
                        className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full shadow flex items-center justify-center text-lg hover:scale-110 transition">
                        ❤️
                      </button>
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="bg-red-600 text-white px-4 py-2 rounded-full font-bold">Sold Out</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="p-4">
                    <Link href={`/products/${product.id}`}>
                      <h3 className="font-extrabold text-gray-900 mb-1 hover:text-red-600 transition cursor-pointer">{product.name}</h3>
                    </Link>
                    {product.description && (
                      <p className="text-gray-500 text-sm mb-3 line-clamp-2">{product.description}</p>
                    )}

                    {/* Sizes */}
                    {product.sizes && product.sizes.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-3">
                        {product.sizes.slice(0, 4).map((size: string) => (
                          <span key={size} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-semibold">{size}</span>
                        ))}
                        {product.sizes.length > 4 && (
                          <span className="text-xs text-gray-400">+{product.sizes.length - 4} more</span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xl font-extrabold text-red-700">Rs. {product.price?.toLocaleString()}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => removeFromWishlist(product.id)}
                          className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:border-red-300 hover:text-red-500 transition text-sm">
                          🗑️
                        </button>
                        <button
                          onClick={() => addToCart(product)}
                          disabled={product.stock === 0}
                          className="bg-red-700 text-white px-4 py-2 rounded-xl font-bold hover:bg-red-600 transition text-sm disabled:opacity-50">
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* SUGGESTIONS */}
        {products.length > 0 && (
          <div className="mt-10 text-center">
            <Link href="/products"
              className="inline-block bg-white border-2 border-red-700 text-red-700 px-8 py-3 rounded-2xl font-extrabold hover:bg-red-50 transition">
              Continue Shopping →
            </Link>
          </div>
        )}
      </div>

      <footer className="bg-red-700 text-white py-10 text-center mt-10">
        <p className="text-xl font-extrabold">🧺 Doko Pasal</p>
        <p className="text-red-200 text-sm mt-1">Made with ❤️ in Nepal</p>
      </footer>
    </main>
  )
}