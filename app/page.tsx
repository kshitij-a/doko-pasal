'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { logActivity } from '../lib/activity'

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [banners, setBanners] = useState<any[]>([])
  const [currentBanner, setCurrentBanner] = useState(0)
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([])

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) setUser(data.user)
    }
    loadUser()
    logActivity('page_view', { page: 'home' }, '/')

    const loadBanners = async () => {
      try {
        const { data, error } = await supabase.from('banners').select('*').eq('active', true).order('position', { ascending: true })
        if (error) console.error('Error fetching banners:', error.message)
        else if (data && data.length > 0) setBanners(data)
      } catch (err) { console.error('Failed to fetch banners:', err) }
    }
    loadBanners()

    const loadProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false }).limit(8)
        if (error) console.error('Error fetching products:', error.message)
        else if (data) setFeaturedProducts(data)
      } catch (err) { console.error('Failed to fetch products:', err) }
    }
    loadProducts()
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [banners.length])

  const categories = [
    { name: "Men's Wear", desc: "Shirts, Daura Suruwal, Trousers", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&crop=top" },
    { name: "Women's Wear", desc: "Saree, Kurta, Blouses, Tops", img: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop" },
    { name: "Kids' Wear", desc: "Cute outfits for your little ones", img: "https://images.unsplash.com/photo-1503944583220-79d8926ad5e2?w=600&h=800&fit=crop" },
  ]

  return (
    <main className="min-h-screen bg-[#FAF8F4] pb-16 sm:pb-0">
      <Navbar />

      {/* Hero / Banner Carousel */}
      {banners.length > 0 ? (
        <section className="relative overflow-hidden">
          <div className="flex transition-transform duration-700 ease-in-out" style={{ transform: `translateX(-${currentBanner * 100}%)` }}>
            {banners.map((banner) => (
              <div key={banner.id} className="w-full flex-shrink-0">
                <a href={banner.link_url || '/products'} className="block relative group">
                  <img src={banner.image_url} alt={banner.title || 'Banner'} className="w-full h-[50vh] sm:h-[65vh] md:h-[80vh] object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1E1A16]/80 via-[#1E1A16]/30 to-transparent" />
                  <div className="absolute bottom-8 sm:bottom-16 left-6 sm:left-16 text-white max-w-lg">
                    {banner.title && <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-3" style={{ fontFamily: 'var(--font-display)' }}>{banner.title}</h1>}
                    {banner.subtitle && <p className="text-base sm:text-xl text-white/80 mb-6">{banner.subtitle}</p>}
                    {banner.button_text && (
                      <span className="inline-block bg-white text-[#1E1A16] px-7 py-3 rounded-full font-bold text-sm sm:text-base hover:bg-[#C9963A] hover:text-white transition-colors">
                        {banner.button_text} →
                      </span>
                    )}
                  </div>
                </a>
              </div>
            ))}
          </div>
          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {banners.map((_, i) => (
                <button key={i} onClick={() => setCurrentBanner(i)}
                  className={`h-1.5 rounded-full transition-all ${i === currentBanner ? 'w-8 bg-white' : 'w-1.5 bg-white/40'}`} />
              ))}
            </div>
          )}
        </section>
      ) : (
        /* Default Hero */
        <section className="relative overflow-hidden bg-[#1E1A16]">
          <div className="absolute inset-0 opacity-20">
            <img src="https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1600&h=900&fit=crop" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="relative max-w-7xl mx-auto px-6 sm:px-8 py-20 sm:py-28 md:py-36 text-center text-white">
            <p className="text-[#C9963A] text-sm font-bold tracking-widest uppercase mb-4 animate-fade-in">Welcome to</p>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-4 animate-fade-in-up" style={{ fontFamily: 'var(--font-display)' }}>
              Doko Pasal
            </h1>
            <p className="text-xl sm:text-2xl text-[#C9963A] mb-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>दोको पसल</p>
            <p className="text-base sm:text-lg text-white/60 mb-8 max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Nepal&apos;s favourite online clothing store. Handpicked ethnic wear for every occasion.
            </p>
            <div className="flex flex-wrap justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <Link href="/products" className="bg-white text-[#1E1A16] px-8 py-3 rounded-full font-bold text-sm sm:text-base hover:bg-[#C9963A] hover:text-white transition-colors">
                Explore Collection →
              </Link>
              <Link href="/products?sale=true" className="border-2 border-[#C9963A] text-[#C9963A] px-8 py-3 rounded-full font-bold text-sm sm:text-base hover:bg-[#C9963A] hover:text-white transition-colors">
                View Sale
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Shop by Category */}
      <section className="py-16 sm:py-20 px-6 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <p className="text-[10px] font-bold text-[#9E9994] uppercase tracking-[0.2em] mb-2">Browse</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E1A16]" style={{ fontFamily: 'var(--font-display)' }}>Shop by Category</h2>
            <div className="w-12 h-0.5 bg-[#B5293A] mx-auto mt-4 rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
            {categories.map((cat) => (
              <Link href={`/products?category=${cat.name}`} key={cat.name} className="category-card group">
                <div className="aspect-[3/4] overflow-hidden bg-[#F5F2EE]">
                  <img src={cat.img} alt={cat.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="category-overlay">
                  <p className="text-xs font-bold text-white/60 uppercase tracking-widest mb-1">{cat.name.split(' ')[0]}</p>
                  <h3 className="text-xl sm:text-2xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>{cat.name}</h3>
                  <p className="text-sm text-white/70 mb-3">{cat.desc}</p>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#C9963A] group-hover:text-white transition-colors">
                    Browse →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-16 sm:py-20 px-6 sm:px-8 bg-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[10px] font-bold text-[#9E9994] uppercase tracking-[0.2em] mb-2">Just In</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#1E1A16]" style={{ fontFamily: 'var(--font-display)' }}>New Arrivals</h2>
              </div>
              <Link href="/products?sort=newest" className="text-sm font-bold text-[#B5293A] hover:text-[#8C1E2A] transition hidden sm:inline-flex items-center gap-1">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5">
              {featuredProducts.slice(0, 8).map((product) => {
                const images = product.image_urls?.length > 0 ? product.image_urls : product.image_url ? [product.image_url] : []
                return (
                  <Link href={`/products/${product.id}`} key={product.id} className="product-card group">
                    <div className="product-image-wrap">
                      {images.length > 0
                        ? <img src={images[0]} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
                        : <div className="w-full h-full flex items-center justify-center text-4xl bg-[#F5F2EE]">🧺</div>
                      }
                      {product.sale_price && product.sale_price < product.price && (
                        <span className="absolute top-3 left-3 badge-sale">SALE</span>
                      )}
                    </div>
                    <div className="product-body">
                      <p className="product-category">{product.category || 'Clothing'}</p>
                      <p className="product-name truncate">{product.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="price text-base">Rs. {(product.sale_price || product.price)?.toLocaleString()}</span>
                        {product.sale_price && product.sale_price < product.price && (
                          <span className="price-old text-sm">Rs. {product.price?.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
            <div className="text-center mt-8 sm:hidden">
              <Link href="/products?sort=newest" className="btn-primary">View All Products →</Link>
            </div>
          </div>
        </section>
      )}

      {/* Trust Bar */}
      <section className="py-16 sm:py-20 px-6 sm:px-8 bg-[#F2EFE9]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#1E1A16]" style={{ fontFamily: 'var(--font-display)' }}>Why Shop With Us?</h2>
            <div className="w-12 h-0.5 bg-[#C9963A] mx-auto mt-4 rounded-full" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {[
              { icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H18.375a1.125 1.125 0 001.125-1.125v-1.5M3.375 14.25h3.75m0 0V6.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v7.875m3-9h2.25c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125H16.5m-7.5 0h7.5"/></svg>, title: "Fast Delivery", desc: "Across all 77 districts" },
              { icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z"/></svg>, title: "Easy Payment", desc: "eSewa · Khalti · COD" },
              { icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"/></svg>, title: "Easy Returns", desc: "7-day return policy" },
              { icon: <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>, title: "100% Genuine", desc: "Quality guaranteed" },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white border border-[#E8E3DB] flex items-center justify-center text-[#B5293A]">
                  {item.icon}
                </div>
                <h3 className="font-bold text-[#1E1A16] mb-1 text-sm">{item.title}</h3>
                <p className="text-[#6B6560] text-xs">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1E1A16] text-white pt-16 pb-8 px-6 sm:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🧺</span>
                <div>
                  <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Doko Pasal</span>
                  <span className="block text-[10px] text-[#C9963A] font-semibold tracking-widest">दोको पसल</span>
                </div>
              </div>
              <p className="text-sm text-white/50 leading-relaxed">Nepal&apos;s favourite online clothing store. Quality ethnic wear for every occasion.</p>
            </div>

            {/* Shop */}
            <div>
              <h4 className="text-[10px] font-bold text-[#C9963A] uppercase tracking-widest mb-4">Shop</h4>
              <ul className="space-y-2.5">
                {["Men's Wear", "Women's Wear", "Kids' Wear", "New Arrivals", "Sale"].map(item => (
                  <li key={item}><Link href="/products" className="text-sm text-white/50 hover:text-white transition">{item}</Link></li>
                ))}
              </ul>
            </div>

            {/* Help */}
            <div>
              <h4 className="text-[10px] font-bold text-[#C9963A] uppercase tracking-widest mb-4">Help</h4>
              <ul className="space-y-2.5">
                {["About Us", "Contact Us", "FAQ", "Return Policy", "Track Order"].map(item => (
                  <li key={item}><Link href="/" className="text-sm text-white/50 hover:text-white transition">{item}</Link></li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h4 className="text-[10px] font-bold text-[#C9963A] uppercase tracking-widest mb-4">Connect</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-sm text-white/50 hover:text-white transition">Facebook</a></li>
                <li><a href="#" className="text-sm text-white/50 hover:text-white transition">Instagram</a></li>
                <li><a href="#" className="text-sm text-white/50 hover:text-white transition">TikTok</a></li>
              </ul>
              <div className="mt-6">
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Newsletter</p>
                <div className="flex">
                  <input type="email" placeholder="Your email" className="flex-1 bg-white/10 border border-white/15 rounded-l-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C9963A]/50" />
                  <button className="bg-[#C9963A] text-[#1E1A16] px-4 py-2 rounded-r-lg font-bold text-sm hover:bg-[#B5293A] hover:text-white transition">→</button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/30">© 2026 Doko Pasal. Made with ❤️ in Nepal.</p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/30">We accept:</span>
              <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/50">eSewa</span>
              <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/50">Khalti</span>
              <span className="text-xs bg-white/10 px-2 py-1 rounded text-white/50">COD</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
