'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { logActivity } from '../../lib/activity'

export default function Checkout() {
  const router = useRouter()
  const [cart, setCart] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', landmark: '', note: '' })

  useEffect(() => {
    try {
      const saved = localStorage.getItem('cart')
      if (saved) setCart(JSON.parse(saved))
    } catch (e) { console.error('Failed to parse cart:', e) }
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data } = await supabase.auth.getUser()
    if (!data.user) { router.push('/auth/login'); return }
    setUser(data.user)
    setForm(f => ({
      ...f,
      name: data.user.user_metadata?.full_name || '',
      phone: data.user.user_metadata?.phone || '',
    }))
  }

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0)
  const itemCount = cart.reduce((sum, i) => sum + i.qty, 0)

  const placeOrder = async () => {
    if (!form.name || !form.phone || !form.address || !form.city) {
      alert('Please fill all required delivery details!'); setStep(1); return
    }
    if (form.phone.length !== 10 || !/^(98|97)\d{8}$/.test(form.phone)) {
      alert('Please enter a valid 10-digit Nepal phone number starting with 98 or 97.'); return
    }
    if (form.name.length > 100 || form.address.length > 200 || form.city.length > 100) {
      alert('Input fields exceed maximum length.'); return
    }
    if (cart.length === 0) { alert('Your cart is empty!'); return }

    setLoading(true)

    const { data: order, error } = await supabase.from('orders').insert({
      user_id: user.id,
      customer_name: form.name,
      customer_phone: form.phone,
      customer_address: `${form.address}${form.landmark ? ', near ' + form.landmark : ''}, ${form.city}`,
      total_amount: total,
      payment_method: paymentMethod,
      payment_status: 'pending',
      order_status: 'pending',
      order_note: form.note || null,
    }).select().single()

    if (error) {
      alert('Error placing order: ' + error.message)
      setLoading(false)
      return
    }

    const items = cart.map(i => ({
      order_id: order.id,
      product_id: i.id,
      product_name: i.name,
      size: i.selectedSize || 'Free Size',
      quantity: i.qty,
      price: i.price,
    }))
    await supabase.from('order_items').insert(items)

    try {
      await fetch('/api/validate-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id, userId: user.id }),
      })
    } catch (e) { console.error('Order validation error:', e) }

    if (paymentMethod === 'khalti') {
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'khalti', amount: total, orderId: order.id, productName: 'Doko Pasal Order', customerName: form.name, customerPhone: form.phone, customerEmail: user.email }),
      })
      const data = await response.json()
      if (data.paymentUrl) { localStorage.removeItem('cart'); window.location.href = data.paymentUrl }
      else { alert('Khalti error: ' + (data.error || 'Could not initiate payment')); setLoading(false) }
      return
    }

    if (paymentMethod === 'esewa') {
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'esewa', amount: total, orderId: order.id, productName: 'Doko Pasal Order' }),
      })
      const data = await response.json()
      if (data.esewaData && data.paymentUrl) {
        localStorage.removeItem('cart')
        const form_el = document.createElement('form')
        form_el.method = 'POST'; form_el.action = data.paymentUrl
        Object.entries(data.esewaData).forEach(([key, val]) => { const input = document.createElement('input'); input.type = 'hidden'; input.name = key; input.value = val; form_el.appendChild(input) })
        document.body.appendChild(form_el); form_el.submit()
      } else { alert('eSewa error: ' + (data.error || 'Could not initiate payment')); setLoading(false) }
      return
    }

    localStorage.removeItem('cart')
    if (paymentMethod === 'bank') {
      alert(`Bank Transfer Details:\n\nBank: Nepal Investment Bank\nAccount Name: Doko Pasal\nAccount No: 001234567890\n\nAfter transfer, WhatsApp screenshot to: 98XXXXXXXX\nMention Order ID: ${order.id.slice(0,8).toUpperCase()}`)
    }
    try {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: form.name, customerEmail: user.email, customerPhone: form.phone, orderId: order.id, items, total, paymentMethod, address: `${form.address}, ${form.city}` }),
      })
    } catch (e) { console.log('Email error:', e) }
    router.push('/orders?success=true')
    logActivity('purchase', { total, payment_method: paymentMethod, items: cart.length }, '/checkout')
    setLoading(false)
  }

  const payments = [
    { id: 'khalti', label: 'Khalti', desc: 'Pay instantly with Khalti wallet', badge: 'RECOMMENDED', color: '#6B21A8' },
    { id: 'esewa', label: 'eSewa', desc: 'Pay instantly with eSewa wallet', badge: 'POPULAR', color: '#2A7D4F' },
    { id: 'cod', label: 'Cash on Delivery', desc: 'Pay when your order arrives', badge: '', color: '#C9963A' },
    { id: 'bank', label: 'Bank Transfer', desc: 'Direct bank transfer — we confirm manually', badge: '', color: '#3B82F6' },
  ]

  return (
    <main className="min-h-screen bg-[#FAF8F4]">
      {/* Header */}
      <nav className="bg-[#1E1A16] text-white px-6 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl">🧺</span>
          <span className="text-lg font-bold" style={{ fontFamily: 'var(--font-display)' }}>Doko Pasal</span>
        </Link>
        <Link href="/cart" className="text-sm font-semibold text-white/70 hover:text-white transition">← Back to Cart</Link>
      </nav>

      {/* Step Indicator */}
      <div className="bg-white border-b border-[#E8E3DB]">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center">
            {[{ n: 1, label: 'Delivery' }, { n: 2, label: 'Payment' }, { n: 3, label: 'Confirm' }].map((s, i) => (
              <div key={s.n} className="flex items-center flex-1 last:flex-none">
                <div className={`flex items-center gap-2.5 ${step > s.n ? 'text-[#2A7D4F]' : step === s.n ? 'text-[#B5293A]' : 'text-[#9E9994]'}`}>
                  <div className={`step-num ${step > s.n ? 'done' : step === s.n ? 'active' : ''}`}>
                    {step > s.n ? '✓' : s.n}
                  </div>
                  <span className="text-sm font-semibold hidden sm:block">{s.label}</span>
                </div>
                {i < 2 && <div className={`step-line flex-1 mx-3 ${step > s.n ? 'done' : ''}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-5 gap-6">
          {/* Left - Form */}
          <div className="md:col-span-3">
            {step === 1 && (
              <div className="bg-white rounded-2xl p-6 border border-[#E8E3DB]">
                <h2 className="text-xl font-bold text-[#1E1A16] mb-6" style={{ fontFamily: 'var(--font-display)' }}>Delivery Details</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#6B6560] uppercase tracking-wider mb-1.5">Full Name *</label>
                      <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Ram Sharma" className="input" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#6B6560] uppercase tracking-wider mb-1.5">Phone *</label>
                      <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="98XXXXXXXX" className="input" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#6B6560] uppercase tracking-wider mb-1.5">Street / Tole *</label>
                    <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})} placeholder="Ward No. / Street name / Tole" className="input" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#6B6560] uppercase tracking-wider mb-1.5">City / District *</label>
                      <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})} placeholder="Kathmandu" className="input" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#6B6560] uppercase tracking-wider mb-1.5">Landmark</label>
                      <input type="text" value={form.landmark} onChange={e => setForm({...form, landmark: e.target.value})} placeholder="Near school/hospital" className="input" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#6B6560] uppercase tracking-wider mb-1.5">Order Note</label>
                    <textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})} placeholder="Any special instructions..." rows={2} className="input resize-none h-auto py-3" />
                  </div>
                  <button onClick={() => { if (!form.name || !form.phone || !form.address || !form.city) { alert('Please fill Name, Phone, Address and City!'); return } setStep(2) }} className="w-full btn-primary py-4 text-base">
                    Continue to Payment →
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-2xl p-6 border border-[#E8E3DB]">
                <h2 className="text-xl font-bold text-[#1E1A16] mb-6" style={{ fontFamily: 'var(--font-display)' }}>Choose Payment</h2>
                <div className="space-y-3 mb-6">
                  {payments.map(method => (
                    <label key={method.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition ${paymentMethod === method.id ? 'border-[#C9963A] bg-[#FEFBF3]' : 'border-[#E8E3DB] bg-white hover:border-[#9E9994]'}`}>
                      <input type="radio" name="payment" value={method.id} checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} className="w-4 h-4 accent-[#B5293A]" />
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ background: method.color }}>
                        {method.id === 'khalti' ? 'K' : method.id === 'esewa' ? 'e' : method.id === 'cod' ? '₹' : 'B'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-[#1E1A16] text-sm">{method.label}</p>
                          {method.badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#92400E]">{method.badge}</span>}
                        </div>
                        <p className="text-xs text-[#6B6560]">{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 btn-ghost-dark py-3.5 text-sm">← Back</button>
                  <button onClick={() => setStep(3)} className="flex-1 btn-primary py-3.5 text-sm">Review Order →</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-2xl p-6 border border-[#E8E3DB]">
                <h2 className="text-xl font-bold text-[#1E1A16] mb-6" style={{ fontFamily: 'var(--font-display)' }}>Confirm Your Order</h2>
                <div className="bg-[#FAF8F4] rounded-xl p-5 mb-5 space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-[#6B6560]">Name</span><span className="font-bold text-[#1E1A16]">{form.name}</span></div>
                  <div className="flex justify-between"><span className="text-[#6B6560]">Phone</span><span className="font-bold text-[#1E1A16]">{form.phone}</span></div>
                  <div className="flex justify-between"><span className="text-[#6B6560]">Address</span><span className="font-bold text-[#1E1A16] text-right max-w-xs">{form.address}{form.landmark ? ', near '+form.landmark : ''}, {form.city}</span></div>
                  <div className="flex justify-between"><span className="text-[#6B6560]">Payment</span><span className="font-bold text-[#1E1A16]">{payments.find(p=>p.id===paymentMethod)?.label}</span></div>
                  <div className="flex justify-between pt-2 border-t border-[#E8E3DB] text-lg"><span className="font-bold">Total</span><span className="font-bold text-[#B5293A]">Rs. {total.toLocaleString()}</span></div>
                </div>
                {(paymentMethod === 'khalti' || paymentMethod === 'esewa') && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-sm text-blue-700">
                    You will be redirected to {paymentMethod === 'khalti' ? 'Khalti' : 'eSewa'} to complete payment securely.
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="flex-1 btn-ghost-dark py-3.5 text-sm">← Back</button>
                  <button onClick={placeOrder} disabled={loading} className="flex-1 btn-primary py-3.5 text-sm">
                    {loading ? 'Processing...' : 'Place Order'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right - Summary */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl p-5 border border-[#E8E3DB] sticky top-24">
              <h2 className="font-bold text-[#1E1A16] mb-4" style={{ fontFamily: 'var(--font-display)' }}>Order Summary ({itemCount} items)</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4 pr-1">
                {cart.map(item => (
                  <div key={`${item.id}-${item.selectedSize}`} className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#F5F2EE] flex-shrink-0">
                      {item.image_url || (item.image_urls?.[0])
                        ? <img src={item.image_url || item.image_urls[0]} alt={item.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-sm">🧺</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate text-[#1E1A16]">{item.name}</p>
                      {item.selectedSize && <p className="text-[#9E9994] text-xs">Size: {item.selectedSize}</p>}
                      <p className="text-[#9E9994] text-xs">Qty: {item.qty}</p>
                    </div>
                    <p className="font-bold text-[#B5293A] text-sm">Rs. {(item.price * item.qty).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#E8E3DB] pt-3 space-y-2">
                <div className="flex justify-between text-sm text-[#6B6560]"><span>Subtotal</span><span>Rs. {total.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm text-[#2A7D4F] font-bold"><span>Delivery</span><span>FREE</span></div>
                <div className="flex justify-between font-bold text-xl text-[#B5293A] pt-2 border-t border-[#E8E3DB]">
                  <span>Total</span><span>Rs. {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
