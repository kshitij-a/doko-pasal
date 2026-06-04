'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

interface NavbarProps {
  onCartOpen?: () => void
  cartCount?: number
  wishlistCount?: number
}

export default function Navbar({ onCartOpen, cartCount = 0, wishlistCount = 0 }: NavbarProps) {
  const [user, setUser] = useState<any>(null)
  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [products, setProducts] = useState<any[]>([])
  const megaRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const mobileSearchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkUser()
    fetchProducts()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (megaRef.current && !megaRef.current.contains(e.target as Node)) {
        setMegaOpen(false)
      }
      const target = e.target as Node
      const inDesktop = searchRef.current && searchRef.current.contains(target)
      const inMobile = mobileSearchRef.current && mobileSearchRef.current.contains(target)
      if (!inDesktop && !inMobile) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser()
    setUser(data.user)
  }

  const fetchProducts = async () => {
    const { data } = await supabase.from('products').select('*')
    if (data) setProducts(data)
  }

  const handleSearch = (val: string) => {
    setSearch(val)
    if (!val.trim()) { setSuggestions([]); return }
    const q = val.toLowerCase()
    const matched = products.filter(p =>
      p.name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q) ||
      p.sizes?.some((s: string) => s.toLowerCase().includes(q)) ||
      (p.price && p.price.toString().includes(q))
    ).slice(0, 8)
    setSuggestions(matched)
    setShowSuggestions(matched.length > 0)
  }

  const categories = [
    { name: "Men's Wear", icon: '👔' },
    { name: "Women's Wear", icon: '👗' },
    { name: "Kids' Wear", icon: '🧒' },
  ]

  const quickLinks = [
    { label: 'New Arrivals', href: '/products?sort=newest', icon: '✨' },
    { label: 'Best Sellers', href: '/products?sort=popular', icon: '🔥' },
    { label: 'Sale', href: '/products?sale=true', icon: '🏷️' },
  ]

  const closeSuggestions = () => {
    setTimeout(() => setShowSuggestions(false), 100)
  }

  return (
    <nav className="bg-red-700 text-white sticky top-0 z-50 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="text-xl sm:text-2xl font-extrabold tracking-wide whitespace-nowrap">
            🧺 Doko Pasal
          </Link>

          {/* Desktop Search */}
          <div ref={searchRef} className="hidden md:flex flex-1 max-w-xl relative">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search by name, category, size, price..."
                value={search}
                onChange={e => handleSearch(e.target.value)}
                onFocus={() => { if (suggestions.length) setShowSuggestions(true) }}
                className="w-full bg-white/15 backdrop-blur border border-white/25 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:bg-white/25 transition"
              />
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white text-gray-900 border border-gray-200 rounded-2xl shadow-2xl mt-2 z-50 max-h-80 overflow-auto">
                {suggestions.map((p: any) => (
                  <Link key={p.id} href={`/products/${p.id}`}
                    onClick={() => { setSearch(''); closeSuggestions() }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-100 last:border-0">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                      {p.image_url || p.image_urls?.[0]
                        ? <img src={p.image_url || p.image_urls[0]} alt={p.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-lg">🧺</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{p.category}</span>
                        {p.sizes?.length > 0 && <span>· {p.sizes.slice(0, 3).join(', ')}{p.sizes.length > 3 ? '...' : ''}</span>}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-red-700 whitespace-nowrap">Rs. {p.price?.toLocaleString()}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {/* Mega Nav Trigger */}
            <div ref={megaRef} className="relative">
              <button
                onClick={() => setMegaOpen(!megaOpen)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/15 font-semibold text-sm transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <span>Menu</span>
                <svg className={`w-3 h-3 transition-transform ${megaOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {megaOpen && (
                <div className="absolute right-0 mt-2 w-[480px] bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  <div className="grid grid-cols-2">
                    {/* Categories */}
                    <div className="p-5 border-r border-gray-100">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Categories</p>
                      {categories.map(cat => (
                        <Link key={cat.name} href={`/products?category=${cat.name}`}
                          onClick={() => setMegaOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition group">
                          <span className="text-2xl">{cat.icon}</span>
                          <span className="font-semibold text-gray-800 group-hover:text-red-700 transition">{cat.name}</span>
                        </Link>
                      ))}
                    </div>
                    {/* Quick Links */}
                    <div className="p-5">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Links</p>
                      {quickLinks.map(link => (
                        <Link key={link.label} href={link.href}
                          onClick={() => setMegaOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 transition group">
                          <span className="text-2xl">{link.icon}</span>
                          <span className="font-semibold text-gray-800 group-hover:text-red-700 transition">{link.label}</span>
                        </Link>
                      ))}
                      <div className="border-t border-gray-100 mt-3 pt-3">
                        <Link href="/products"
                          onClick={() => setMegaOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 transition">
                          <span className="font-bold text-red-700 text-sm">Browse All Products →</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link href="/products" className="px-3 py-2 rounded-lg hover:bg-white/15 font-semibold text-sm transition">Shop</Link>

            {/* Wishlist */}
            <Link href="/wishlist" className="relative px-3 py-2 rounded-lg hover:bg-white/15 font-semibold text-sm transition">
              ❤️
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-yellow-400 text-red-800 text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-extrabold">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            {onCartOpen && (
              <button onClick={onCartOpen} className="relative px-3 py-2 rounded-lg hover:bg-white/15 font-semibold text-sm transition">
                🛒
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-yellow-400 text-red-800 text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-extrabold">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {user ? (
              <Link href="/orders" className="bg-yellow-400 text-red-800 px-4 py-2 rounded-full font-extrabold hover:bg-yellow-300 transition text-xs">My Orders</Link>
            ) : (
              <Link href="/auth/login" className="bg-white text-red-700 px-4 py-2 rounded-full font-extrabold hover:bg-gray-100 transition text-xs">Login</Link>
            )}
          </div>

          {/* Mobile: Wishlist + Cart + Hamburger */}
          <div className="flex md:hidden items-center gap-1">
            <Link href="/wishlist" className="relative p-2 rounded-lg hover:bg-white/15">
              ❤️
              {wishlistCount > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-yellow-400 text-red-800 text-[9px] rounded-full min-w-[16px] h-[16px] flex items-center justify-center font-extrabold">
                  {wishlistCount}
                </span>
              )}
            </Link>
            {onCartOpen && (
              <button onClick={onCartOpen} className="relative p-2 rounded-lg hover:bg-white/15">
                🛒
                {cartCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-yellow-400 text-red-800 text-[9px] rounded-full min-w-[16px] h-[16px] flex items-center justify-center font-extrabold">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-white/15">
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div ref={mobileSearchRef} className="md:hidden mt-3 relative">
          <input
            type="text"
            placeholder="🔍 Search products..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            onFocus={() => { if (suggestions.length) setShowSuggestions(true) }}
            className="w-full bg-white/15 backdrop-blur border border-white/25 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-white text-gray-900 border border-gray-200 rounded-2xl shadow-2xl mt-2 z-50 max-h-60 overflow-auto">
              {suggestions.map((p: any) => (
                <Link key={p.id} href={`/products/${p.id}`}
                  onClick={() => { setSearch(''); closeSuggestions() }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition border-b border-gray-100 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                    {p.image_url || p.image_urls?.[0]
                      ? <img src={p.image_url || p.image_urls[0]} alt={p.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-sm">🧺</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.category} · Rs. {p.price?.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 pb-3 border-t border-white/20 pt-3 space-y-2">
            <Link href="/products" onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl hover:bg-white/15 font-semibold text-sm transition">
              🛍️ Shop All
            </Link>
            {categories.map(cat => (
              <Link key={cat.name} href={`/products?category=${cat.name}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2.5 rounded-xl hover:bg-white/15 font-semibold text-sm transition">
                {cat.icon} {cat.name}
              </Link>
            ))}
            <div className="border-t border-white/20 pt-2 mt-2">
              {quickLinks.map(link => (
                <Link key={link.label} href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-2.5 rounded-xl hover:bg-white/15 font-semibold text-sm transition">
                  {link.icon} {link.label}
                </Link>
              ))}
            </div>
            <div className="border-t border-white/20 pt-2 mt-2">
              {user ? (
                <>
                  <Link href="/orders" onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 rounded-xl hover:bg-white/15 font-semibold text-sm transition">📦 My Orders</Link>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2.5 rounded-xl hover:bg-white/15 font-semibold text-sm transition">👤 Profile</Link>
                </>
              ) : (
                <div className="flex gap-2 px-4">
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 bg-white text-red-700 py-2.5 rounded-xl font-bold text-center text-sm">Login</Link>
                  <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 bg-yellow-400 text-red-800 py-2.5 rounded-xl font-bold text-center text-sm">Sign Up</Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
