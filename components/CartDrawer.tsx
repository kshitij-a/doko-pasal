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
      <aside className="absolute right-0 top-0 h-full w-full max-w-sm bg-[#FAF8F4] shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E8E3DB] flex items-center justify-between bg-[#1E1A16]">
          <div>
            <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>Your Cart</h3>
            <p className="text-xs text-[#C9963A]">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold text-lg transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-auto px-5 py-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#F2EFE9] flex items-center justify-center">
                <svg className="w-10 h-10 text-[#9E9994]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/></svg>
              </div>
              <p className="text-[#6B6560] font-semibold mb-1">Your cart is empty</p>
              <p className="text-[#9E9994] text-sm mb-4">Add some items to get started</p>
              <Link href="/products" onClick={onClose}
                className="btn-primary text-sm">
                Start Shopping →
              </Link>
            </div>
          ) : (
            cart.map((item: any) => {
              const key = `${item.id}-${item.selectedSize}`
              return (
                <div key={key} className="flex gap-3 items-center bg-white rounded-xl p-3 border border-[#E8E3DB]">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-[#F5F2EE] flex-shrink-0">
                    {item.image_url || item.image_urls?.[0]
                      ? <img src={item.image_url || item.image_urls[0]} alt={item.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-xl">🧺</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1E1A16] truncate">{item.name}</p>
                    {item.selectedSize && <p className="text-xs text-[#9E9994]">Size: {item.selectedSize}</p>}
                    <p className="text-sm font-bold text-[#B5293A] mt-1">Rs. {(item.price * item.qty).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button onClick={() => onRemove(key)} className="text-[#9E9994] hover:text-[#B5293A] transition">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                    <div className="flex items-center gap-0 bg-[#F2EFE9] rounded-lg overflow-hidden">
                      <button onClick={() => onUpdateQty(key, Math.max(1, item.qty - 1))}
                        className="w-8 h-8 flex items-center justify-center text-[#6B6560] hover:text-[#B5293A] font-bold text-sm transition">
                        −
                      </button>
                      <span className="w-7 text-center text-sm font-bold text-[#1E1A16]">{item.qty}</span>
                      <button onClick={() => onUpdateQty(key, item.qty + 1)}
                        className="w-8 h-8 flex items-center justify-center text-[#6B6560] hover:text-[#B5293A] font-bold text-sm transition">
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
          <div className="border-t border-[#E8E3DB] px-5 py-4 bg-white">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-[#6B6560]">Subtotal ({itemCount} items)</span>
              <span className="text-lg font-bold text-[#1E1A16]">Rs. {cartTotal.toLocaleString()}</span>
            </div>
            <p className="text-xs text-[#2A7D4F] font-semibold mb-4">Free delivery across Nepal</p>
            <div className="flex gap-3">
              <Link href="/cart" onClick={onClose}
                className="flex-1 btn-ghost-dark text-center py-3 text-sm">
                View Cart
              </Link>
              <Link href="/checkout" onClick={onClose}
                className="flex-1 btn-primary py-3 text-sm">
                Checkout →
              </Link>
            </div>
          </div>
        )}
      </aside>
    </div>
  )
}
