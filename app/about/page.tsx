import Link from 'next/link'
import Navbar from '../../components/Navbar'

export const metadata = {
  title: 'About Us — Doko Pasal',
  description: "Nepal's favourite online clothing store. Our brand story.",
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F4] pb-16 sm:pb-0">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-14 sm:py-20">
        <p className="text-[10px] font-bold text-[#9E9994] uppercase tracking-[0.2em] mb-2">Our Story</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1E1A16]" style={{ fontFamily: 'var(--font-display)' }}>
          About Doko Pasal <span className="text-[#C9963A]">दोको पसल</span>
        </h1>
        <div className="w-12 h-0.5 bg-[#B5293A] mt-4 mb-8 rounded-full" />
        <div className="bg-white border border-[#E8E3DB] rounded-2xl p-6 sm:p-10 space-y-5 text-[#6B6560] leading-relaxed">
          <p>
            <strong className="text-[#1E1A16]">Doko Pasal</strong> started with a simple idea: make quality Nepali
            ethnic wear — Daura Suruwal, Saree, Kurta, blouses and everyday clothing — easy to buy from anywhere
            in Nepal.
          </p>
          <p>
            We handpick fabrics and tailoring partners, keep pricing honest in rupees, and deliver across all
            77 districts with Cash on Delivery, eSewa and Khalti.
          </p>
          <p>
            Every order is packed with care in Kathmandu and backed by our 7-day easy return policy. When you
            shop with us, you support local makers and honest Nepali craftsmanship.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-2 text-center">
            {[
              { n: '77', l: 'Districts served' },
              { n: '7-day', l: 'Easy returns' },
              { n: '100%', l: 'Genuine quality' },
            ].map((s) => (
              <div key={s.l} className="bg-[#FAF8F4] rounded-xl py-4 px-2">
                <p className="text-xl font-bold text-[#1E1A16]" style={{ fontFamily: 'var(--font-display)' }}>{s.n}</p>
                <p className="text-xs mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="text-center mt-8">
          <Link href="/" className="text-sm font-bold text-[#B5293A] hover:text-[#8C1E2A] transition">
            ← Back to Home
          </Link>
        </div>
      </div>
      <footer className="bg-[#1E1A16] text-white py-8 px-6 text-center">
        <Link href="/" className="text-sm font-bold" style={{ fontFamily: 'var(--font-display)' }}>
          Doko Pasal <span className="text-[#C9963A]">दोको पसल</span>
        </Link>
        <p className="text-xs text-white/30 mt-2">© 2026 Doko Pasal. Made with ❤️ in Nepal.</p>
      </footer>
    </main>
  )
}
