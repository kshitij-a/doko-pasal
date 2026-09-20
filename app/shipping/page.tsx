import Link from 'next/link'
import Navbar from '../../components/Navbar'

export const metadata = {
  title: 'Shipping Policy — Doko Pasal',
  description: 'Delivery zones, timelines, COD, tracking, and delivery charges across Nepal.',
}

export default function ShippingPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F4] pb-16 sm:pb-0">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-14">
        <p className="text-[10px] font-bold text-[#9E9994] uppercase tracking-[0.2em] mb-2">Delivery Across Nepal</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1E1A16]" style={{ fontFamily: 'var(--font-display)' }}>Shipping Policy</h1>
        <div className="w-12 h-0.5 bg-[#B5293A] mt-4 mb-8 rounded-full" />
        <div className="bg-white border border-[#E8E3DB] rounded-2xl p-6 sm:p-10 space-y-5 text-sm text-[#6B6560] leading-relaxed">
          <p className="text-xs text-[#9E9994]">Last updated: September 2026</p>
          <p><strong className="text-[#1E1A16]">Delivery zones & timelines.</strong></p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Kathmandu Valley: 1–2 business days.</li>
            <li>Pokhara & Chitwan: 2–3 business days.</li>
            <li>Rest of Terai & accessible hill towns: 3–5 business days.</li>
            <li>Remote / hilly regions: 5–10 business days depending on transport and weather.</li>
          </ol>
          <p><strong className="text-[#1E1A16]">Charge confirmed before dispatch.</strong> Delivery charges vary by location and are confirmed with you by phone or message before dispatch. No order ships until you have accepted the charge.</p>
          <p><strong className="text-[#1E1A16]">COD available nationwide.</strong> Cash on Delivery is available across all 77 districts — pay in cash when your order arrives.</p>
          <p><strong className="text-[#1E1A16]">Tracking.</strong> Track your order on our <Link href="/track-order" className="font-bold text-[#B5293A]">Track Order page</Link> using your order ID and phone number — no login needed.</p>
          <p><strong className="text-[#1E1A16]">Delays & failed delivery.</strong> Weather, festivals, and road conditions can cause delays — we will keep you updated. If delivery fails (wrong address, unreachable phone), we attempt redelivery; please respond to our call or message within 3 days or the order may be cancelled.</p>
          <p>
            Questions? WhatsApp <a href="https://wa.me/9779806603339" className="font-bold text-[#B5293A]">+977 9806603339</a> or
            email <a href="mailto:support@dokopasal.com" className="font-bold text-[#B5293A]">support@dokopasal.com</a>.
          </p>
        </div>
        <div className="text-center mt-8">
          <Link href="/" className="text-sm font-bold text-[#B5293A] hover:text-[#8C1E2A] transition">← Back to Home</Link>
        </div>
      </div>
    </main>
  )
}
