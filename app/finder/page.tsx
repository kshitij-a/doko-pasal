'use client'
import { useState } from 'react'
import Link from 'next/link'
import Navbar from '../../components/Navbar'

const NEEDS = ['Festive', 'Wedding', 'Winter', 'Daily', 'Gift']
const CATEGORIES = ["Men's Wear", "Women's Wear", "Kids' Wear"]
const SIZES = ['S', 'M', 'L', 'XL', 'Free Size']

export default function Finder() {
  const [need, setNeed] = useState('')
  const [category, setCategory] = useState('')
  const [size, setSize] = useState('')
  const step = !need ? 1 : !category ? 2 : 3
  const href = `/products?category=${encodeURIComponent(category)}&search=${encodeURIComponent(need)}`

  const pill = (active: boolean) =>
    `filter-pill whitespace-nowrap ${active ? 'active' : ''}`

  return (
    <main className="min-h-screen bg-[#FAF8F4] pb-16 sm:pb-0">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <p className="text-[10px] font-bold text-[#9E9994] uppercase tracking-[0.2em] mb-2">Step {step} of 3</p>
        <h1 className="text-3xl font-bold text-[#1E1A16] mb-8" style={{ fontFamily: 'var(--font-display)' }}>
          {!need ? 'What is it for?' : !category ? 'Whose section?' : 'What size?'}
        </h1>

        {step === 1 && (
          <div className="flex flex-wrap gap-3">
            {NEEDS.map(n => (
              <button key={n} onClick={() => setNeed(n)} className={pill(need === n)}>{n}</button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="flex flex-wrap gap-3 mb-6">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)} className={pill(category === c)}>{c}</button>
              ))}
            </div>
            <button onClick={() => setNeed('')} className="text-sm font-bold text-[#9E9994] hover:text-[#1E1A16]">← Back</button>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="flex flex-wrap gap-3 mb-6">
              {SIZES.map(s => (
                <button key={s} onClick={() => setSize(s)} className={pill(size === s)}>{s}</button>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-5 border border-[#E8E3DB] mb-6">
              <p className="text-sm text-[#6B6560]">
                Showing <b>{need}</b> picks in <b>{category}</b>
                {size && <> · size <b>{size}</b> (pick it on the product)</>}
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setCategory('')} className="btn-ghost-dark py-3 px-6 text-sm">← Back</button>
              <Link href={href} className="btn-primary py-3 px-6 text-sm">Show my picks →</Link>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
