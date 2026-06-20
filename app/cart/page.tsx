'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function Cart() {
  const [cart, setCart] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cart')
      if (saved) setCart(JSON.parse(saved))
    } catch (e) { console.error('Failed to parse cart:', e) }
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser()
    setUser(data.user)
  }

  const updateQty = (key, delta) => {
    const updated = cart.map(i =>
      `${i.id}-${i.selectedSize}` === key
        ? { ...i, qty: Math.max(1, i.qty + delta) }
        : i
    )
    setCart(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
  }

  const removeItem = (key) => {
    const updated = cart.filter(i => `${i.id}-${i.selectedSize}` !== key)
    setCart(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
  }

  const clearCart = () => {
    if (!confirm('Clear all items from cart?')) return
    setCart([])
    localStorage.removeItem('cart')
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0)
  const itemCount = cart.reduce((sum, i) => sum + i.qty, 0)

  const handleCheckout = () => {
    if (!user) {
      alert('Please login first to place an order!')
      router.push('/auth/login')
      return
    }
    router.push('/checkout')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* NAVBAR */}
      <nav className="bg-red-700 text-white px-6 py-4 flex justify-between items-center shadow-lg sticky top-0 z-50">
        <Link href="/" className="text-2xl font-extrabold">🧺 Doko Pasal</Link>
        <Link href="/products" className="bg-yellow-400 text-red-800 px-4 py-2 rounded-full font-extrabold hover:bg-yellow-300 transition text-sm">
          ← Continue Shopping
        </Link>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">🛒 Your Cart</h1>
          {cart.length > 0 && (
            <button onClick={clearCart} className="text-red-500 text-sm font-semibold hover:underline">
              Clear All
            </button>
          )}
        </div>

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
                      <button onClick={() => removeItem(key)}
                        className="text-red-400 text-xs hover:text-red-600 hover:underline mt-1 transition">
                        Remove
                      </button>
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
      </div>
    </main>
  )
}