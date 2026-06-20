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
  const [scrolled, setScrolled] = useState(false)
  const megaRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const mobileSearchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    checkUser()
    fetchProducts()
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
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
    ).slice(0, 6)
    setSuggestions(matched)
    setShowSuggestions(matched.length > 0)
  }

  const closeSuggestions = () => {
    setTimeout(() => setShowSuggestions(false), 150)
  }

  const categories = [
    { name: "Men's Wear", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" },
    { name: "Women's Wear", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" },
    { name: "Kids' Wear", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" },
  ]

  const quickLinks = [
    { label: 'New Arrivals', href: '/products?sort=newest' },
    { label: 'Best Sellers', href: '/products?sort=popular' },
    { label: 'Sale', href: '/products?sale=true' },
  ]

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#1E1A16]/95 backdrop-blur-md shadow-lg' : 'bg-[#1E1A16]'}`}>
      {/* Announcement Bar */}
      <div className="bg-[#C9963A] text-[#1E1A16] text-center py-1.5 px-4">
        <p className="text-xs sm:text-sm font-semibold">Free delivery on orders above Rs. 2,000 · Easy returns within 7 days</p>
      </div>

      {/* Main Nav */}
      <nav className="text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <span className="text-2xl">🧺</span>
              <div className="leading-none">
                <span className="text-lg sm:text-xl font-extrabold tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>Doko Pasal</span>
                <span className="hidden sm:block text-[10px] text-[#C9963A] font-semibold tracking-widest uppercase">दोको पसल</span>
              </div>
            </Link>

            {/* Desktop Search */}
            <div ref={searchRef} className="hidden md:flex flex-1 max-w-lg mx-8 relative">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="Search kurta, saree, daura..."
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                  onFocus={() => { if (suggestions.length) setShowSuggestions(true) }}
                  className="w-full bg-white/10 border border-white/15 rounded-full pl-11 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:bg-white/15 focus:border-[#C9963A]/50 transition"
                />
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
                </svg>
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white text-gray-900 border border-gray-100 rounded-2xl shadow-2xl mt-2 z-50 max-h-80 overflow-auto">
                  {suggestions.map((p: any) => (
                    <Link key={p.id} href={`/products/${p.id}`}
                      onClick={() => { setSearch(''); closeSuggestions() }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#FAF8F4] transition border-b border-gray-100 last:border-0">
                      <div className="w-12 h-12 rounded-lg bg-[#F5F2EE] overflow-hidden flex-shrink-0">
                        {p.image_url || p.image_urls?.[0]
                          ? <img src={p.image_url || p.image_urls[0]} alt={p.name} className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center text-lg">🧺</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{p.name}</p>
                        <div className="flex items-center gap-2 text-xs text-[#6B6560]">
                          <span>{p.category}</span>
                          {p.sizes?.length > 0 && <span>· {p.sizes.slice(0, 3).join(', ')}</span>}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-[#B5293A] whitespace-nowrap">Rs. {p.price?.toLocaleString()}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Desktop Nav Icons */}
            <div className="hidden md:flex items-center gap-1">
              {/* Menu */}
              <div ref={megaRef} className="relative">
                <button onClick={() => setMegaOpen(!megaOpen)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 text-sm font-semibold transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/>
                  </svg>
                  <span>Menu</span>
                </button>
                {megaOpen && (
                  <div className="absolute right-0 mt-2 w-[420px] bg-white text-gray-900 rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    <div className="grid grid-cols-2">
                      <div className="p-5 border-r border-gray-100">
                        <p className="text-[10px] font-bold text-[#9E9994] uppercase tracking-widest mb-3">Categories</p>
                        {categories.map(cat => (
                          <Link key={cat.name} href={`/products?category=${cat.name}`}
                            onClick={() => setMegaOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#FAF8F4] transition group">
                            <span className="text-lg">📋</span>
                            <span className="font-semibold text-sm group-hover:text-[#B5293A] transition">{cat.name}</span>
                          </Link>
                        ))}
                      </div>
                      <div className="p-5">
                        <p className="text-[10px] font-bold text-[#9E9994] uppercase tracking-widest mb-3">Quick Links</p>
                        {quickLinks.map(link => (
                          <Link key={link.label} href={link.href}
                            onClick={() => setMegaOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#FAF8F4] transition group">
                            <span className="text-lg">✨</span>
                            <span className="font-semibold text-sm group-hover:text-[#B5293A] transition">{link.label}</span>
                          </Link>
                        ))}
                        <div className="border-t border-gray-100 mt-3 pt-3">
                          <Link href="/products"
                            onClick={() => setMegaOpen(false)}
                            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-[#B5293A] hover:bg-[#8C1E2A] text-white transition text-sm font-bold">
                            Browse All Products →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link href="/products" className="px-3 py-2 rounded-lg hover:bg-white/10 text-sm font-semibold transition">Shop</Link>

              {/* Wishlist */}
              <Link href="/wishlist" className="relative px-3 py-2 rounded-lg hover:bg-white/10 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
                </svg>
                {wishlistCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#B5293A] text-white text-[9px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-extrabold">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              {onCartOpen && (
                <button onClick={onCartOpen} className="relative px-3 py-2 rounded-lg hover:bg-white/10 transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-[#C9963A] text-[#1E1A16] text-[9px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center font-extrabold">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}

              {user ? (
                <>
                  <Link href="/profile" className="ml-2 px-3 py-2 rounded-full hover:bg-white/10 transition text-xs font-semibold flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    Profile
                  </Link>
                  <Link href="/orders" className="ml-2 border border-[#C9963A] text-[#C9963A] px-4 py-2 rounded-full font-bold hover:bg-[#C9963A] hover:text-[#1E1A16] transition text-xs">My Orders</Link>
                </>
              ) : (
                <Link href="/auth/login" className="ml-2 bg-white text-[#1E1A16] px-4 py-2 rounded-full font-bold hover:bg-gray-100 transition text-xs">Login</Link>
              )}
            </div>

            {/* Mobile Icons */}
            <div className="flex md:hidden items-center gap-1">
              {onCartOpen && (
                <button onClick={onCartOpen} className="relative p-2.5 rounded-lg hover:bg-white/10">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"/>
                  </svg>
                  {cartCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 bg-[#C9963A] text-[#1E1A16] text-[9px] rounded-full min-w-[16px] h-[16px] flex items-center justify-center font-extrabold">
                      {cartCount}
                    </span>
                  )}
                </button>
              )}
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2.5 rounded-lg hover:bg-white/10">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  {mobileMenuOpen
                    ? <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12"/>
                    : <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/>}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search */}
        <div ref={mobileSearchRef} className="md:hidden px-4 pb-3 relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
              onFocus={() => { if (suggestions.length) setShowSuggestions(true) }}
              className="w-full bg-white/10 border border-white/15 rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/40 focus:outline-none focus:bg-white/15 transition"
            />
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute left-4 right-4 bg-white text-gray-900 border border-gray-100 rounded-2xl shadow-2xl mt-2 z-50 max-h-60 overflow-auto">
              {suggestions.map((p: any) => (
                <Link key={p.id} href={`/products/${p.id}`}
                  onClick={() => { setSearch(''); closeSuggestions() }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#FAF8F4] transition border-b border-gray-100 last:border-0">
                  <div className="w-10 h-10 rounded-lg bg-[#F5F2EE] overflow-hidden flex-shrink-0">
                    {p.image_url || p.image_urls?.[0]
                      ? <img src={p.image_url || p.image_urls[0]} alt={p.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-sm">🧺</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.name}</p>
                    <p className="text-xs text-[#6B6560]">{p.category} · Rs. {p.price?.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#1E1A16]">
            <div className="px-4 py-4 space-y-1">
              <Link href="/products" onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 rounded-xl hover:bg-white/10 font-semibold text-sm transition">
                Shop All
              </Link>
              {categories.map(cat => (
                <Link key={cat.name} href={`/products?category=${cat.name}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-xl hover:bg-white/10 font-semibold text-sm transition">
                  {cat.name}
                </Link>
              ))}
              <div className="border-t border-white/10 pt-2 mt-2">
                {quickLinks.map(link => (
                  <Link key={link.label} href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl hover:bg-white/10 font-semibold text-sm transition">
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="border-t border-white/10 pt-2 mt-2">
                {user ? (
                  <>
                    <Link href="/profile" onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-xl hover:bg-white/10 font-semibold text-sm transition">Profile</Link>
                    <Link href="/orders" onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-xl hover:bg-white/10 font-semibold text-sm transition">My Orders</Link>
                    <Link href="/wishlist" onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-xl hover:bg-white/10 font-semibold text-sm transition">Wishlist</Link>
                  </>
                ) : (
                  <div className="flex gap-2 px-4">
                    <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 bg-white text-[#1E1A16] py-3 rounded-xl font-bold text-center text-sm">Login</Link>
                    <Link href="/auth/signup" onClick={() => setMobileMenuOpen(false)}
                      className="flex-1 bg-[#C9963A] text-[#1E1A16] py-3 rounded-xl font-bold text-center text-sm">Sign Up</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
