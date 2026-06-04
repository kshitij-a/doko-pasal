'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MobileBottomBarProps {
  cartCount?: number
  cartTotal?: number
  onCartOpen?: () => void
}

export default function MobileBottomBar({ cartCount = 0, cartTotal = 0, onCartOpen }: MobileBottomBarProps) {
  const pathname = usePathname()

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/checkout')) return null

  const items = [
    { href: '/', label: 'Home', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
    )},
    { href: '/products', label: 'Shop', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
    )},
    { type: 'cart' as const, label: 'Cart', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
    ), count: cartCount},
    { href: '/wishlist', label: 'Wishlist', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
    )},
    { href: '/orders', label: 'Orders', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
    )},
  ]

  return (
    <>
      {/* Sticky Cart Bar when items in cart */}
      {cartCount > 0 && (
        <div className="fixed bottom-14 left-3 right-3 z-[108] sm:hidden">
          <button
            onClick={onCartOpen}
            className="w-full bg-red-700 text-white rounded-2xl px-4 py-2.5 shadow-2xl flex items-center justify-between font-bold text-sm"
          >
            <span className="flex items-center gap-2">
              <span className="bg-yellow-400 text-red-800 text-[10px] rounded-full min-w-[20px] h-[20px] flex items-center justify-center font-extrabold">
                {cartCount}
              </span>
              View Cart
            </span>
            <span>Rs. {cartTotal.toLocaleString()} →</span>
          </button>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[109] sm:hidden bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex items-center justify-around px-1 py-1.5">
          {items.map((item, i) => {
            if (item.type === 'cart') {
              return (
                <button key={i} onClick={onCartOpen}
                  className="relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition">
                  <div className="relative">
                    {item.icon}
                    {item.count && item.count > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] rounded-full min-w-[16px] h-[16px] flex items-center justify-center font-extrabold">
                        {item.count}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-semibold ${pathname === item.href ? 'text-red-700' : 'text-gray-500'}`}>
                    {item.label}
                  </span>
                </button>
              )
            }
            const isActive = pathname === item.href
            return (
              <Link key={i} href={item.href!}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${isActive ? 'text-red-700' : 'text-gray-500'}`}>
                {item.icon}
                <span className="text-[10px] font-semibold">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
