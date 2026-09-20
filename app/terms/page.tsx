import Link from 'next/link'
import Navbar from '../../components/Navbar'

export const metadata = {
  title: 'Terms of Service — Doko Pasal',
  description: 'Ordering, pricing in NPR, payments, delivery, returns, and governing law for Doko Pasal Nepal.',
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F4] pb-16 sm:pb-0">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-14">
        <p className="text-[10px] font-bold text-[#9E9994] uppercase tracking-[0.2em] mb-2">The Fine Print</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1E1A16]" style={{ fontFamily: 'var(--font-display)' }}>Terms of Service</h1>
        <div className="w-12 h-0.5 bg-[#B5293A] mt-4 mb-8 rounded-full" />
        <div className="bg-white border border-[#E8E3DB] rounded-2xl p-6 sm:p-10 space-y-5 text-sm text-[#6B6560] leading-relaxed">
          <p className="text-xs text-[#9E9994]">Last updated: September 2026</p>
          <p>By placing an order with Doko Pasal, you agree to these terms.</p>
          <p><strong className="text-[#1E1A16]">Ordering.</strong> Orders are confirmed by phone or message before dispatch. We may cancel or refuse any order (e.g. stock issues, incorrect pricing, suspected fraud) and refund any amount already paid.</p>
          <p><strong className="text-[#1E1A16]">Pricing in NPR, tax-inclusive.</strong> All prices are listed in Nepalese Rupees (NPR) and include applicable taxes. If a price is shown incorrectly, we will inform you before dispatch and you may cancel for a full refund.</p>
          <p><strong className="text-[#1E1A16]">Payments.</strong> We accept Cash on Delivery (COD), Khalti, eSewa, and bank transfer. Online payments are processed through hosted gateways — we never see or store your card details.</p>
          <p><strong className="text-[#1E1A16]">Delivery charges confirmed on contact.</strong> Delivery charges vary by location and are confirmed with you by phone or message before dispatch. No order ships until you have accepted the charge.</p>
          <p><strong className="text-[#1E1A16]">7-day returns.</strong> Request a return within 7 days of delivery for unworn items with tags attached. Custom-stitched items are final sale unless damaged or wrong. See our <Link href="/return-policy" className="font-bold text-[#B5293A]">Return Policy</Link> for details.</p>
          <p><strong className="text-[#1E1A16]">Cancellations.</strong> Cancel free any time before dispatch by contacting us. Once dispatched, standard return terms apply.</p>
          <p><strong className="text-[#1E1A16]">Coupons.</strong> One coupon per order unless stated otherwise. We may revoke coupons issued in error or through misuse.</p>
          <p><strong className="text-[#1E1A16]">Liability.</strong> Our liability for any order is limited to the amount you paid for that order. Product colours may vary slightly from photos due to lighting and screens.</p>
          <p><strong className="text-[#1E1A16]">Governing law.</strong> These terms are governed by the laws of Nepal. Disputes will be resolved in the courts of Kathmandu, Nepal.</p>
          <p>
            Questions? WhatsApp us at <a href="https://wa.me/9779806603339" className="font-bold text-[#B5293A]">+977 9806603339</a> or
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
