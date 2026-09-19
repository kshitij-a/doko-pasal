'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Cart() {
  const [cart, setCart] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [toast, setToast] = useState('')
  const [upsell, setUpsell] = useState<any[]>([])
  const router = useRouter()

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cart')
      if (saved) {
        const parsed = JSON.parse(saved)
        setCart(parsed)
        if (parsed.length > 0) fetchUpsell(parsed[0]?.category, parsed.map((i: any) => i.id))
      }
    } catch (e) { console.error('Failed to parse cart:', e) }
    checkUser()
  }, [])

  const fetchUpsell = async (category: string, excludeIds: string[]) => {
    try {
      let q = supabase.from('products').select('*').limit(4)
      if (category) q = q.eq('category', category)
      const { data } = await q
      if (data) setUpsell(data.filter((p: any) => !excludeIds.includes(p.id)).slice(0, 4))
    } catch (e) { console.error('Failed to fetch upsell:', e) }
  }

  const quickAdd = (product: any) => {
    const selectedSize = product.sizes?.[0] || 'Free Size'
    const key = `${product.id}-${selectedSize}`
    const existing = cart.find(i => `${i.id}-${i.selectedSize}` === key)
    let updated
    if (existing) {
      let newQty = existing.qty + 1
      if (product.stock != null) newQty = Math.min(newQty, product.stock)
      updated = cart.map(i => `${i.id}-${i.selectedSize}` === key ? { ...i, qty: newQty } : i)
    } else {
      updated = [...cart, { ...product, qty: 1, selectedSize }]
    }
    setCart(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
    showToast(`✅ "${product.name}" added!`)
  }

  const saveForLater = (key: string, id: string) => {
    try {
      const raw = localStorage.getItem('wishlist')
      const ids: string[] = raw ? JSON.parse(raw) : []
      if (!ids.includes(id)) localStorage.setItem('wishlist', JSON.stringify([...ids, id]))
    } catch (e) { console.error('Failed to save for later:', e) }
    const updated = cart.filter(i => `${i.id}-${i.selectedSize}` !== key)
    setCart(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
    showToast('❤️ Saved for later')
  }

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser()
    setUser(data.user)
  }

  const updateQty = (key: any, delta: any) => {
    const updated = cart.map(i => {
      if (`${i.id}-${i.selectedSize}` !== key) return i
      const clamped = Math.max(1, i.qty + delta)
      const finalQty = i.stock != null ? Math.min(clamped, i.stock) : clamped
      return { ...i, qty: finalQty }
    })
    setCart(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
  }

  const removeItem = (key: any) => {
    const updated = cart.filter(i => `${i.id}-${i.selectedSize}` !== key)
    setCart(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
  }

  const clearCart = () => {
    setCart([])
    localStorage.removeItem('cart')
    showToast('🗑️ Cart cleared')
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0)
  const itemCount = cart.reduce((sum, i) => sum + i.qty, 0)

  const handleCheckout = () => {
    if (!user) {
      showToast('⚠️ Please login first to place an order!')
      setTimeout(() => router.push('/auth/login'), 800)
      return
    }
    router.push('/checkout')
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-28 sm:pb-0">
      {/* TOAST */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl font-semibold text-sm">
          {toast}
        </div>
      )}
      {/* NAVBAR */}
      <nav className="bg-red-700 text-white px-6 py-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <Link href="/" className="text-2xl font-extrabold">🧺 Doko Pasal</Link>
        <Link href="/products" className="bg-yellow-400 text-red-800 px-4 py-2 rounded-full font-extrabold hover:bg-yellow-300 transition text-sm">
          ← Continue Shopping
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-extrabold text-gray-900">🛒 Your Cart</h1>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-red-500 text-sm font-semibold hover:underline">
              Clear All
            </button>
          )}
        </div>

        {cart.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-4 mb-6">
            <p className="text-sm font-bold text-green-700 mb-2">🎉 You&apos;ve unlocked FREE delivery</p>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-full bg-green-500 rounded-full" />
            </div>
          </div>
        )}

        {cart.length === 0 ? (
          <div className="bg-white rounded-3xl shadow p-20 text-center">
            <div className="text-8xl mb-4">🧺</div>
            <p className="text-2xl font-bold text-gray-700 mb-2">Your cart is empty</p>
            <p className="text-gray-400 mb-8">Add some beautiful clothes to get started!</p>
            <Link href="/products"
              className="bg-red-700 text-white px-10 py-4 rounded-2xl font-extrabold text-lg hover:bg-red-600 transition shadow-lg">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {/* CART ITEMS */}
            <div className="md:col-span-2 space-y-4">
              {cart.map(item => {
                const key = `${item.id}-${item.selectedSize}`
                return (
                  <div key={key} className="bg-white rounded-2xl shadow p-5 flex items-center gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-red-50 flex items-center justify-center text-3xl flex-shrink-0">
                      {item.image_url || (item.image_urls && item.image_urls[0])
                        ? <img src={item.image_url || item.image_urls[0]} alt={item.name} className="w-full h-full object-cover" />
                        : item.category === "Men's Wear" ? '👔' : item.category === "Women's Wear" ? '👗' : '🧒'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-extrabold text-gray-900 truncate">{item.name}</h3>
                      <p className="text-gray-500 text-sm">{item.category}</p>
                      {item.selectedSize && (
                        <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded mt-1 font-semibold">
                          Size: {item.selectedSize}
                        </span>
                      )}
                      <p className="text-red-700 font-extrabold mt-1">Rs. {item.price?.toLocaleString()}</p>
                    </div>

                    {/* Qty Controls */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => updateQty(key, -1)}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-extrabold text-lg flex items-center justify-center transition">
                        −
                      </button>
                      <span className="w-8 text-center font-extrabold text-gray-900">{item.qty}</span>
                      <button onClick={() => updateQty(key, 1)}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 font-extrabold text-lg flex items-center justify-center transition">
                        +
                      </button>
                    </div>

                    {/* Subtotal + Remove */}
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="font-extrabold text-gray-900">Rs. {(item.price * item.qty).toLocaleString()}</p>
                      <div className="flex gap-2 justify-end mt-1">
                        <button onClick={() => saveForLater(key, item.id)} title="Save for later"
                          className="text-gray-400 text-sm hover:text-red-500 transition">♡</button>
                        <button onClick={() => removeItem(key)}
                          className="text-red-400 text-xs hover:text-red-600 hover:underline transition">
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ORDER SUMMARY */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-2xl shadow p-6 sticky top-24">
                <h2 className="text-xl font-extrabold text-gray-900 mb-5">Order Summary</h2>

                <div className="space-y-3 mb-5">
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Items ({itemCount})</span>
                    <span>Rs. {total.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 text-sm">
                    <span>Delivery</span>
                    <span className="text-green-600 font-bold">FREE</span>
                  </div>
                  <div className="border-t-2 pt-3 flex justify-between font-extrabold text-xl">
                    <span>Total</span>
                    <span className="text-red-700">Rs. {total.toLocaleString()}</span>
                  </div>
                </div>

                <button onClick={handleCheckout}
                  className="w-full bg-red-700 text-white py-4 rounded-2xl font-extrabold text-lg hover:bg-red-600 active:scale-95 transition shadow-lg">
                  Checkout →
                </button>

                {!user && (
                  <p className="text-center text-xs text-gray-400 mt-3">
                    <Link href="/auth/login" className="text-red-600 font-bold hover:underline">Login</Link> required to checkout
                  </p>
                )}

                <div className="mt-5 pt-4 border-t space-y-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>✅</span><span>Free delivery across Nepal</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>💳</span><span>eSewa, Khalti, COD accepted</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>↩️</span><span>7-day easy returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* UPSELL */}
        {cart.length > 0 && upsell.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-extrabold text-gray-900 mb-4">You may also like 👀</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {upsell.map((p: any) => (
                <div key={p.id} className="bg-white rounded-2xl shadow p-3">
                  <Link href={`/products/${p.id}`}>
                    <div className="h-28 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center">
                      {p.image_url || p.image_urls?.[0]
                        ? <img src={p.image_url || p.image_urls[0]} alt={p.name} className="w-full h-full object-cover" />
                        : <span className="text-3xl opacity-30">🧺</span>}
                    </div>
                    <p className="font-bold text-sm text-gray-800 truncate mt-2">{p.name}</p>
                    <p className="text-red-700 font-extrabold text-sm">Rs. {(p.sale_price && p.sale_price < p.price ? p.sale_price : p.price)?.toLocaleString()}</p>
                  </Link>
                  <button onClick={() => quickAdd(p)}
                    className="mt-2 w-full bg-red-700 text-white py-1.5 rounded-xl text-xs font-bold hover:bg-red-600 transition">
                    + Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}