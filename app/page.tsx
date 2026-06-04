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

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      if (data.user) setUser(data.user)
    }
    loadUser()
    logActivity('page_view', { page: 'home' }, '/')

    const loadBanners = async () => {
      const { data } = await supabase.from('banners').select('*').eq('active', true).order('position', { ascending: true })
      if (data && data.length > 0) setBanners(data)
    }
    loadBanners()
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return
    const timer = setInterval(() => {
      setCurrentBanner(prev => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [banners.length])

  return (
    <main className="min-h-screen bg-white pb-16 sm:pb-0">

      <Navbar />

      {/* HERO BANNER */}
      {banners.length > 0 ? (
        <section className="relative overflow-hidden">
          <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentBanner * 100}%)` }}>
            {banners.map((banner, i) => (
              <div key={banner.id} className="w-full flex-shrink-0">
                <a href={banner.link_url || '/products'} className="block relative">
                  <img src={banner.image_url} alt={banner.title || 'Banner'} className="w-full h-[200px] sm:h-[350px] md:h-[450px] object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-6 sm:bottom-10 left-6 sm:left-10 text-white">
                    {banner.title && <h2 className="text-2xl sm:text-4xl font-extrabold mb-1 sm:mb-2">{banner.title}</h2>}
                    {banner.subtitle && <p className="text-base sm:text-xl text-yellow-200 mb-3 sm:mb-4">{banner.subtitle}</p>}
                    {banner.button_text && (
                      <span className="bg-yellow-400 text-red-800 px-5 sm:px-7 py-2 sm:py-2.5 rounded-full font-bold text-sm sm:text-lg hover:bg-yellow-300 transition inline-block">
                        {banner.button_text}
                      </span>
                    )}
                  </div>
                </a>
              </div>
            ))}
          </div>
          {banners.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {banners.map((_, i) => (
                <button key={i} onClick={() => setCurrentBanner(i)}
                  className={`w-2.5 h-2.5 rounded-full transition ${i === currentBanner ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="bg-gradient-to-r from-red-700 to-red-500 text-white py-16 sm:py-20 px-6 sm:px-8 text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-3 sm:mb-4 leading-tight">नमस्ते! Welcome to Doko Pasal</h1>
          <p className="text-lg sm:text-xl mb-2 text-yellow-200">Nepal&apos;s favourite online clothing store</p>
          <p className="text-base sm:text-lg mb-6 sm:mb-8 text-red-100">Men • Women • Kids — All in one place</p>
          <Link href="/products" className="bg-yellow-400 text-red-800 px-6 sm:px-8 py-2.5 sm:py-3 rounded-full text-lg sm:text-xl font-bold hover:bg-yellow-300 transition shadow-lg inline-block">
            Shop Now →
          </Link>
        </section>
      )}

      {/* CATEGORIES */}
      <section className="py-12 sm:py-16 px-6 sm:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-red-700 mb-8 sm:mb-10">Shop by Category</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {[
            { name: "Men's Wear", emoji: "👔", desc: "Shirts, Daura Suruwal, Trousers", color: "bg-blue-50 border-blue-200" },
            { name: "Women's Wear", emoji: "👗", desc: "Saree, Kurta, Blouses, Tops", color: "bg-pink-50 border-pink-200" },
            { name: "Kids' Wear", emoji: "🧒", desc: "Cute outfits for your little ones", color: "bg-yellow-50 border-yellow-200" },
          ].map((cat) => (
            <Link href={`/products?category=${cat.name}`} key={cat.name}
              className={`${cat.color} border-2 rounded-2xl p-6 sm:p-8 text-center hover:shadow-lg transition cursor-pointer`}>
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">{cat.emoji}</div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-1 sm:mb-2">{cat.name}</h3>
              <p className="text-gray-500 text-sm sm:text-base">{cat.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* QUICK LINKS BANNER */}
      <section className="py-8 px-6 sm:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto grid grid-cols-3 gap-3 sm:gap-6">
          <Link href="/products?sort=newest" className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 text-center hover:shadow-lg hover:border-red-300 transition group">
            <div className="text-3xl sm:text-4xl mb-2">✨</div>
            <p className="font-bold text-gray-800 text-sm sm:text-base group-hover:text-red-700 transition">New Arrivals</p>
          </Link>
          <Link href="/products?sort=popular" className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 text-center hover:shadow-lg hover:border-red-300 transition group">
            <div className="text-3xl sm:text-4xl mb-2">🔥</div>
            <p className="font-bold text-gray-800 text-sm sm:text-base group-hover:text-red-700 transition">Best Sellers</p>
          </Link>
          <Link href="/products?sale=true" className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 text-center hover:shadow-lg hover:border-red-300 transition group">
            <div className="text-3xl sm:text-4xl mb-2">🏷️</div>
            <p className="font-bold text-gray-800 text-sm sm:text-base group-hover:text-red-700 transition">Sale</p>
          </Link>
        </div>
      </section>

      {/* WHY US */}
      <section className="bg-red-50 py-12 sm:py-16 px-6 sm:px-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-center text-red-700 mb-8 sm:mb-10">Why Shop With Us?</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto text-center">
          {[
            { icon: "🚚", title: "Fast Delivery", desc: "Delivered across Nepal" },
            { icon: "💳", title: "Easy Payment", desc: "eSewa, Khalti, COD" },
            { icon: "↩️", title: "Easy Returns", desc: "7 day return policy" },
            { icon: "✅", title: "100% Genuine", desc: "Quality guaranteed" },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">{item.icon}</div>
              <h3 className="font-bold text-gray-800 mb-1 text-sm sm:text-base">{item.title}</h3>
              <p className="text-gray-500 text-xs sm:text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-red-700 text-white py-8 text-center pb-20 sm:pb-8">
        <p className="text-lg font-bold">🧺 Doko Pasal</p>
        <p className="text-red-200 mt-1 text-sm">Made with ❤️ in Nepal</p>
        <p className="text-red-300 text-xs mt-2">© 2026 Doko Pasal. All rights reserved.</p>
      </footer>

    </main>
  )
}
