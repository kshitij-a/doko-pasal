'use client'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">

      {/* NAVBAR */}
      <nav className="bg-red-700 text-white px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="text-2xl font-bold tracking-wide">
          🧺 Doko Pasal
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/products" className="hover:text-yellow-300 font-medium">Shop</Link>
          <Link href="/cart" className="hover:text-yellow-300 font-medium">🛒 Cart</Link>
          <Link href="/auth/login" className="bg-white text-red-700 px-4 py-1 rounded-full font-bold hover:bg-yellow-300 hover:text-red-800 transition">Login</Link>
          <Link href="/auth/signup" className="bg-yellow-400 text-red-800 px-4 py-1 rounded-full font-bold hover:bg-yellow-300 transition">Sign Up</Link>
        </div>
      </nav>

      {/* HERO BANNER */}
      <section className="bg-gradient-to-r from-red-700 to-red-500 text-white py-20 px-8 text-center">
        <h1 className="text-5xl font-extrabold mb-4">नमस्ते! Welcome to Doko Pasal</h1>
        <p className="text-xl mb-2 text-yellow-200">Nepal's favourite online clothing store</p>
        <p className="text-lg mb-8 text-red-100">Men • Women • Kids — All in one place</p>
        <Link href="/products" className="bg-yellow-400 text-red-800 px-8 py-3 rounded-full text-xl font-bold hover:bg-yellow-300 transition shadow-lg">
          Shop Now →
        </Link>
      </section>

      {/* CATEGORIES */}
      <section className="py-16 px-8">
        <h2 className="text-3xl font-bold text-center text-red-700 mb-10">Shop by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { name: "Men's Wear", emoji: "👔", desc: "Shirts, Daura Suruwal, Trousers", color: "bg-blue-50 border-blue-200" },
            { name: "Women's Wear", emoji: "👗", desc: "Saree, Kurta, Blouses, Tops", color: "bg-pink-50 border-pink-200" },
            { name: "Kids' Wear", emoji: "🧒", desc: "Cute outfits for your little ones", color: "bg-yellow-50 border-yellow-200" },
          ].map((cat) => (
            <Link href={`/products?category=${cat.name}`} key={cat.name}
              className={`${cat.color} border-2 rounded-2xl p-8 text-center hover:shadow-lg transition cursor-pointer`}>
              <div className="text-6xl mb-4">{cat.emoji}</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{cat.name}</h3>
              <p className="text-gray-500">{cat.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* WHY US */}
      <section className="bg-red-50 py-16 px-8">
        <h2 className="text-3xl font-bold text-center text-red-700 mb-10">Why Shop With Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto text-center">
          {[
            { icon: "🚚", title: "Fast Delivery", desc: "Delivered across Nepal" },
            { icon: "💳", title: "Easy Payment", desc: "eSewa, Khalti, COD" },
            { icon: "↩️", title: "Easy Returns", desc: "7 day return policy" },
            { icon: "✅", title: "100% Genuine", desc: "Quality guaranteed" },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="text-4xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-gray-800 mb-1">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-red-700 text-white py-8 text-center">
        <p className="text-lg font-bold">🧺 Doko Pasal</p>
        <p className="text-red-200 mt-1">Made with ❤️ in Nepal</p>
        <p className="text-red-300 text-sm mt-2">© 2026 Doko Pasal. All rights reserved.</p>
      </footer>

    </main>
  )
}