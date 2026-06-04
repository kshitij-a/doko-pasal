'use client'
import Link from 'next/link'

interface CartDrawerProps {
  open: boolean
  onClose: () => void
  cart: any[]
  cartTotal: number
  onRemove: (key: string) => void
  onUpdateQty: (key: string, qty: number) => void
}

export default function CartDrawer({ open, onClose, cart, cartTotal, onRemove, onUpdateQty }: CartDrawerProps) {
  if (!open) return null

  const itemCount = cart.reduce((a: number, i: any) => a + i.qty, 0)

  return (
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900">Your Cart</h3>
            <p className="text-xs text-gray-500">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-bold text-lg transition">
            ×
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🛒</div>
              <p className="text-gray-500 font-semibold">Your cart is empty</p>
              <Link href="/products" onClick={onClose}
                className="inline-block mt-4 bg-red-700 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-red-600 transition">
                Start Shopping →
              </Link>
            </div>
          ) : (
            cart.map((item: any) => {
              const key = `${item.id}-${item.selectedSize}`
              return (
                <div key={key} className="flex gap-3 items-center bg-gray-50 rounded-xl p-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.image_url || item.image_urls?.[0]
                      ? <img src={item.image_url || item.image_urls[0]} alt={item.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl">🧺</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                    {item.selectedSize && <p className="text-xs text-gray-500">Size: {item.selectedSize}</p>}
                    <p className="text-sm font-bold text-red-700 mt-1">Rs. {(item.price * item.qty).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button onClick={() => onRemove(key)} className="text-gray-400 hover:text-red-500 text-xs transition">
                      ✕
                    </button>
                    <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200">
                      <button onClick={() => onUpdateQty(key, Math.max(1, item.qty - 1))}
                        className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-red-600 font-bold text-sm transition">
                        −
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{item.qty}</span>
                      <button onClick={() => onUpdateQty(key, item.qty + 1)}
                        className="w-7 h-7 flex items-center justify-center text-gray-600 hover:text-red-600 font-bold text-sm transition">
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 bg-white">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-500">Subtotal ({itemCount} items)</span>
              <span className="text-lg font-extrabold text-gray-900">Rs. {cartTotal.toLocaleString()}</span>
            </div>
            <p className="text-xs text-green-600 font-semibold mb-4">✓ Free delivery across Nepal</p>
            <div className="flex gap-3">
              <Link href="/cart" onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-center hover:bg-gray-200 transition text-sm">
                View Cart
              </Link>
              <Link href="/checkout" onClick={onClose}
                className="flex-1 bg-red-700 text-white py-3 rounded-xl font-bold text-center hover:bg-red-600 transition text-sm shadow-lg">
                Checkout →
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
