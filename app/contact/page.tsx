'use client'
import { useState } from 'react'
import Link from 'next/link'
import Navbar from '../../components/Navbar'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus('')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) setStatus(data.error || 'Something went wrong.')
      else {
        setStatus('Message sent! We will reply within 24 hours.')
        setForm({ name: '', email: '', message: '' })
      }
    } catch {
      setStatus('Could not send. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF8F4] pb-16 sm:pb-0">
      <Navbar />
      <div className="max-w-xl mx-auto px-6 py-14">
        <p className="text-[10px] font-bold text-[#9E9994] uppercase tracking-[0.2em] mb-2">Get in touch</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1E1A16]" style={{ fontFamily: 'var(--font-display)' }}>Contact Us</h1>
        <div className="w-12 h-0.5 bg-[#B5293A] mt-4 mb-8 rounded-full" />
        <form onSubmit={submit} className="bg-white border border-[#E8E3DB] rounded-2xl p-6 space-y-4">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
            required
            maxLength={100}
            className="w-full bg-[#FAF8F4] border border-[#E8E3DB] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C9963A]"
          />
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Your email"
            required
            maxLength={254}
            className="w-full bg-[#FAF8F4] border border-[#E8E3DB] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C9963A]"
          />
          <textarea
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Your message"
            required
            maxLength={1000}
            rows={5}
            className="w-full bg-[#FAF8F4] border border-[#E8E3DB] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C9963A] resize-y"
          />
          <p className="text-xs text-[#9E9994] text-right">{form.message.length}/1000</p>
          <button disabled={loading} className="w-full bg-[#1E1A16] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#C9963A] hover:text-[#1E1A16] transition disabled:opacity-50">
            {loading ? 'Sending…' : 'Send Message'}
          </button>
          {status && <p className="text-sm text-center font-semibold text-[#6B6560]" role="status">{status}</p>}
        </form>
        <p className="text-center text-sm text-[#6B6560] mt-6">
          Prefer email? <a href="mailto:dokopasal@gmail.com" className="font-bold text-[#B5293A]">dokopasal@gmail.com</a>
        </p>
        <div className="text-center mt-4">
          <Link href="/" className="text-sm font-bold text-[#B5293A] hover:text-[#8C1E2A] transition">← Back to Home</Link>
        </div>
      </div>
    </main>
  )
}
