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
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>
    )},
    { href: '/products', label: 'Shop', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>
    )},
    { type: 'cart' as const, label: 'Cart', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
    ), count: cartCount},
    { href: '/orders', label: 'Orders', icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"/></svg>
    )},
  ]

  return (
    <>
      {/* Sticky Cart Bar when items in cart */}
      {cartCount > 0 && (
        <div className="fixed bottom-14 left-3 right-3 z-[108] sm:hidden">
          <button
            onClick={onCartOpen}
            className="w-full bg-[#1E1A16] text-white rounded-2xl px-4 py-2.5 shadow-2xl flex items-center justify-between font-bold text-sm"
          >
            <span className="flex items-center gap-2">
              <span className="bg-[#C9963A] text-[#1E1A16] text-[10px] rounded-full min-w-[20px] h-[20px] flex items-center justify-center font-extrabold">
                {cartCount}
              </span>
              View Cart
            </span>
            <span>Rs. {cartTotal.toLocaleString()} →</span>
          </button>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[109] sm:hidden bg-white border-t border-[#E8E3DB] safe-area-bottom">
        <div className="flex items-center justify-around px-1 py-1.5">
          {items.map((item, i) => {
            if (item.type === 'cart') {
              return (
                <button key={i} onClick={onCartOpen}
                  className="relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition text-[#9E9994]">
                  <div className="relative">
                    {item.icon}
                    {item.count && item.count > 0 && (
                      <span className="absolute -top-2 -right-2 bg-[#B5293A] text-white text-[9px] rounded-full min-w-[16px] h-[16px] flex items-center justify-center font-extrabold">
                        {item.count}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-semibold">{item.label}</span>
                </button>
              )
            }
            const isActive = pathname === item.href
            return (
              <Link key={i} href={item.href!}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${isActive ? 'text-[#B5293A]' : 'text-[#9E9994]'}`}>
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
