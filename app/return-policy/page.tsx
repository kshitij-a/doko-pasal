import Link from 'next/link'
import Navbar from '../../components/Navbar'

export const metadata = {
  title: 'Return Policy — Doko Pasal',
  description: '7-day easy return policy.',
}

export default function ReturnPolicyPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F4] pb-16 sm:pb-0">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-14">
        <p className="text-[10px] font-bold text-[#9E9994] uppercase tracking-[0.2em] mb-2">Easy Returns</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1E1A16]" style={{ fontFamily: 'var(--font-display)' }}>Return Policy</h1>
        <div className="w-12 h-0.5 bg-[#B5293A] mt-4 mb-8 rounded-full" />
        <div className="bg-white border border-[#E8E3DB] rounded-2xl p-6 sm:p-10 space-y-5 text-sm text-[#6B6560] leading-relaxed">
          <p><strong className="text-[#1E1A16]">7-day returns.</strong> Request a return within 7 days of delivery for a replacement or refund.</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Items must be unworn, unwashed, with tags attached and original packaging.</li>
            <li>Custom-stitched or altered items are final sale unless damaged or wrong.</li>
            <li>Damaged or wrong items: send your order ID + photo within 7 days for free replacement or full refund.</li>
            <li>Size exchanges are free once per order (you cover re-delivery outside the valley).</li>
            <li>Refunds go to eSewa/Khalti/bank within 3–5 business days; COD orders via bank transfer or store credit.</li>
            <li>Sale items can be exchanged for size, but not refunded, unless damaged or wrong.</li>
          </ol>
          <p>
            Start a return via our <Link href="/contact" className="font-bold text-[#B5293A]">Contact page</Link> or
            email <a href="mailto:dokopasal@gmail.com" className="font-bold text-[#B5293A]">dokopasal@gmail.com</a> with
            your order ID and reason.
          </p>
        </div>
        <div className="text-center mt-8">
          <Link href="/" className="text-sm font-bold text-[#B5293A] hover:text-[#8C1E2A] transition">← Back to Home</Link>
        </div>
      </div>
    </main>
  )
}
