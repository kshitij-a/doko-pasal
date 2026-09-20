import Link from 'next/link'
import Navbar from '../../components/Navbar'

export const metadata = {
  title: 'Privacy Policy — Doko Pasal',
  description: 'How Doko Pasal collects, uses, and protects your personal data in Nepal.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F4] pb-16 sm:pb-0">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 sm:px-8 py-14">
        <p className="text-[10px] font-bold text-[#9E9994] uppercase tracking-[0.2em] mb-2">Your Data</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1E1A16]" style={{ fontFamily: 'var(--font-display)' }}>Privacy Policy</h1>
        <div className="w-12 h-0.5 bg-[#B5293A] mt-4 mb-8 rounded-full" />
        <div className="bg-white border border-[#E8E3DB] rounded-2xl p-6 sm:p-10 space-y-5 text-sm text-[#6B6560] leading-relaxed">
          <p className="text-xs text-[#9E9994]">Last updated: September 2026</p>
          <p><strong className="text-[#1E1A16]">Data we collect.</strong> Account details (name, phone, address), order details (items, delivery address, payment method), and messages you send us (contact forms, WhatsApp, returns requests).</p>
          <p><strong className="text-[#1E1A16]">How we use it.</strong> To process and deliver orders, confirm delivery charges, handle returns and support, and — only with your consent — send offers or updates.</p>
          <p><strong className="text-[#1E1A16]">Consent.</strong> By placing an order or creating an account, you consent to this use. You can withdraw marketing consent any time by messaging us.</p>
          <p><strong className="text-[#1E1A16]">Retention.</strong> We keep order records as long as needed for returns, warranties, and legal compliance, then delete or anonymise them.</p>
          <p><strong className="text-[#1E1A16]">Security.</strong> Data is stored securely via Supabase with restricted access. We never store card details — online payments run entirely through hosted gateways (Khalti, eSewa, banks).</p>
          <p><strong className="text-[#1E1A16]">Cookies.</strong> We track nothing except what is needed to keep you logged in (auth session). No advertising or analytics trackers.</p>
          <p>
            <strong className="text-[#1E1A16]">Your rights & contact.</strong> Ask for a copy, correction, or deletion of your data via WhatsApp at <a href="https://wa.me/9779806603339" className="font-bold text-[#B5293A]">+977 9806603339</a> or <a href="mailto:support@dokopasal.com" className="font-bold text-[#B5293A]">support@dokopasal.com</a>. We respond to grievances within 48 hours.
          </p>
        </div>
        <div className="text-center mt-8">
          <Link href="/" className="text-sm font-bold text-[#B5293A] hover:text-[#8C1E2A] transition">← Back to Home</Link>
        </div>
      </div>
    </main>
  )
}
