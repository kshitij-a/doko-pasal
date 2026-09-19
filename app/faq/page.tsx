import Link from 'next/link'
import Navbar from '../../components/Navbar'

export const metadata = {
  title: 'FAQ — Doko Pasal',
  description: 'Delivery, COD, returns, sizing, tracking and payment questions.',
}

const FAQS = [
  { q: 'How long does delivery take?', a: 'Inside Kathmandu Valley: 1–2 business days. Outside the valley: 2–5 business days across all 77 districts.' },
  { q: 'What are the delivery charges?', a: 'Flat Rs. 100 nationwide. Orders above Rs. 2,000 get free delivery.' },
  { q: 'Do you offer Cash on Delivery (COD)?', a: 'Yes! COD is available everywhere in Nepal. Pay in cash when your order arrives.' },
  { q: 'What is your return policy?', a: '7-day easy returns on unworn items with tags attached. Custom-stitched items are final sale. See our Return Policy page for details.' },
  { q: 'How do I find my size?', a: 'Each product page lists sizes (S–XXL / Free Size). Measure your chest and compare with the size chart. Between sizes? Size up for kurtas and saree blouses.' },
  { q: 'How can I track my order?', a: 'Use our Track Order page with your order ID (first 8 characters) and phone number — no login needed. Or check My Orders after logging in.' },
  { q: 'Which payment methods do you accept?', a: 'eSewa, Khalti, bank transfer, and Cash on Delivery.' },
  { q: 'What if I receive a damaged or wrong item?', a: 'Contact us within 7 days with your order ID and a photo. We will replace it or refund you — no extra charge.' },
]

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F4] pb-16 sm:pb-0">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-14">
        <p className="text-[10px] font-bold text-[#9E9994] uppercase tracking-[0.2em] mb-2">Help Center</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1E1A16]" style={{ fontFamily: 'var(--font-display)' }}>
          Frequently Asked Questions
        </h1>
        <div className="w-12 h-0.5 bg-[#B5293A] mt-4 mb-8 rounded-full" />
        <div className="space-y-3">
          {FAQS.map((f) => (
            <details key={f.q} className="bg-white border border-[#E8E3DB] rounded-2xl px-5 py-4 group">
              <summary className="font-bold text-sm text-[#1E1A16] cursor-pointer list-none flex justify-between items-center gap-4">
                {f.q}
                <span className="text-[#C9963A] group-open:rotate-45 transition text-lg leading-none">+</span>
              </summary>
              <p className="text-sm text-[#6B6560] leading-relaxed mt-3">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="text-center mt-8">
          <Link href="/" className="text-sm font-bold text-[#B5293A] hover:text-[#8C1E2A] transition">← Back to Home</Link>
        </div>
      </div>
    </main>
  )
}
