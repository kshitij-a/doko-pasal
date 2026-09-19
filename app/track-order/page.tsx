'use client'
import { useState } from 'react'
import Link from 'next/link'
import Navbar from '../../components/Navbar'

type Result = {
  shortId: string
  status: string
  paymentStatus: string
  paymentMethod: string
  total: number
  createdAt: string
  timeline: { step: string; done: boolean }[]
  items: { product_name: string; size: string; quantity: number; price: number }[]
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('')
  const [phone, setPhone] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus('')
    setResult(null)
    try {
      const res = await fetch('/api/track-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, phone }),
      })
      const data = await res.json()
      if (!res.ok) setStatus(data.error || 'Order not found.')
      else setResult(data)
    } catch {
      setStatus('Could not track. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF8F4] pb-16 sm:pb-0">
      <Navbar />
      <div className="max-w-xl mx-auto px-6 py-14">
        <p className="text-[10px] font-bold text-[#9E9994] uppercase tracking-[0.2em] mb-2">No login needed</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1E1A16]" style={{ fontFamily: 'var(--font-display)' }}>Track Order</h1>
        <div className="w-12 h-0.5 bg-[#B5293A] mt-4 mb-8 rounded-full" />
        <form onSubmit={submit} className="bg-white border border-[#E8E3DB] rounded-2xl p-6 space-y-4">
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Order ID (first 8 characters)"
            required
            minLength={8}
            maxLength={8}
            className="w-full bg-[#FAF8F4] border border-[#E8E3DB] rounded-xl px-4 py-3 text-sm font-mono uppercase focus:outline-none focus:border-[#C9963A]"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number used at checkout"
            required
            inputMode="tel"
            maxLength={15}
            className="w-full bg-[#FAF8F4] border border-[#E8E3DB] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C9963A]"
          />
          <button disabled={loading} className="w-full bg-[#1E1A16] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#C9963A] hover:text-[#1E1A16] transition disabled:opacity-50">
            {loading ? 'Tracking…' : 'Track Order'}
          </button>
          {status && <p className="text-sm text-center font-semibold text-[#B5293A]" role="status">{status}</p>}
        </form>

        {result && (
          <div className="bg-white border border-[#E8E3DB] rounded-2xl p-6 mt-6">
            <div className="flex justify-between items-center mb-4">
              <p className="font-mono font-bold text-[#1E1A16]">#{result.shortId}</p>
              <span className="text-xs font-bold uppercase bg-[#FAF8F4] border border-[#E8E3DB] rounded-full px-3 py-1">{result.status}</span>
            </div>
            <div className="flex items-center mb-5">
              {result.timeline.map((t, i) => (
                <div key={t.step} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${t.done ? 'bg-[#2A7D4F]' : 'bg-[#E8E3DB]'}`} />
                    <span className="text-[9px] font-semibold mt-1 capitalize">{t.step}</span>
                  </div>
                  {i < result.timeline.length - 1 && <div className={`h-0.5 flex-1 mx-1 ${result.timeline[i + 1].done ? 'bg-[#2A7D4F]' : 'bg-[#E8E3DB]'}`} />}
                </div>
              ))}
            </div>
            <div className="space-y-2 border-t border-[#F0EBE3] pt-4">
              {result.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="font-semibold text-[#1E1A16]">{item.product_name} <span className="font-normal text-[#9E9994]">· {item.size} × {item.quantity}</span></span>
                  <span className="font-bold">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
            <p className="text-right font-bold text-[#B5293A] mt-4">Rs. {result.total?.toLocaleString()}</p>
          </div>
        )}
        <div className="text-center mt-8">
          <Link href="/" className="text-sm font-bold text-[#B5293A] hover:text-[#8C1E2A] transition">← Back to Home</Link>
        </div>
      </div>
    </main>
  )
}
