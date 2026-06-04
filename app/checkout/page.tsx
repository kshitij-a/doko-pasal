// File location: app/checkout/page.jsx
// Replace your entire app/checkout/page.tsx with this file
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { logActivity } from '../../lib/activity'

export default function Checkout() {
  const router = useRouter()
  const [cart, setCart] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ name: '', phone: '', address: '', city: '', landmark: '', note: '' })

  useEffect(() => {
    const saved = localStorage.getItem('cart')
    if (saved) setCart(JSON.parse(saved))
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
    if (cart.length === 0) { alert('Your cart is empty!'); return }

    setLoading(true)

    // Create order in database first
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

    // Save order items
    const items = cart.map(i => ({
      order_id: order.id,
      product_id: i.id,
      product_name: i.name,
      size: i.selectedSize || 'Free Size',
      quantity: i.qty,
      price: i.price,
    }))
    await supabase.from('order_items').insert(items)

    // ====== HANDLE PAYMENT METHOD ======

    // KHALTI
    if (paymentMethod === 'khalti') {
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'khalti',
          amount: total,
          orderId: order.id,
          productName: 'Doko Pasal Order',
          customerName: form.name,
          customerPhone: form.phone,
          customerEmail: user.email,
        }),
      })
      const data = await response.json()
      if (data.paymentUrl) {
        localStorage.removeItem('cart')
        window.location.href = data.paymentUrl // Redirect to Khalti
      } else {
        alert('Khalti error: ' + (data.error || 'Could not initiate payment'))
        setLoading(false)
      }
      return
    }

    // ESEWA
    if (paymentMethod === 'esewa') {
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'esewa',
          amount: total,
          orderId: order.id,
          productName: 'Doko Pasal Order',
        }),
      })
      const data = await response.json()
      if (data.esewaData && data.paymentUrl) {
        localStorage.removeItem('cart')
        // Submit form to eSewa
        const form_el = document.createElement('form')
        form_el.method = 'POST'
        form_el.action = data.paymentUrl
        Object.entries(data.esewaData).forEach(([key, val]) => {
          const input = document.createElement('input')
          input.type = 'hidden'
          input.name = key
          input.value = val
          form_el.appendChild(input)
        })
        document.body.appendChild(form_el)
        form_el.submit()
      } else {
        alert('eSewa error: ' + (data.error || 'Could not initiate payment'))
        setLoading(false)
      }
      return
    }

    // COD or BANK TRANSFER
    localStorage.removeItem('cart')
    if (paymentMethod === 'bank') {
      alert(`🏦 Bank Transfer Details:\n\nBank: Nepal Investment Bank\nAccount Name: Doko Pasal\nAccount No: 001234567890\n\nAfter transfer, WhatsApp screenshot to: 98XXXXXXXX\nMention Order ID: ${order.id.slice(0,8).toUpperCase()}`)
    }
    // Send confirmation email
try {
  await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerName: form.name,
      customerEmail: user.email,
      customerPhone: form.phone,
      orderId: order.id,
      items: items,
      total: total,
      paymentMethod: paymentMethod,
      address: `${form.address}, ${form.city}`,
    }),
  })
} catch (e) {
  console.log('Email error:', e)
}
    router.push('/orders?success=true')
    logActivity('purchase', { total, payment_method: paymentMethod, items: cart.length }, '/checkout')
    logActivity('checkout', { total, payment_method: paymentMethod }, '/checkout')
    setLoading(false)
  }

  const payments = [
    { id: 'khalti', label: 'Khalti', icon: '💜', desc: 'Pay instantly with Khalti wallet', color: 'border-purple-400 bg-purple-50', badge: 'RECOMMENDED' },
    { id: 'esewa', label: 'eSewa', icon: '💚', desc: 'Pay instantly with eSewa wallet', color: 'border-green-400 bg-green-50', badge: 'POPULAR' },
    { id: 'cod', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when your order arrives', color: 'border-yellow-400 bg-yellow-50', badge: '' },
    { id: 'bank', label: 'Bank Transfer', icon: '🏦', desc: 'Direct bank transfer — we confirm manually', color: 'border-blue-400 bg-blue-50', badge: '' },
  ]

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-red-700 text-white px-6 py-4 flex justify-between items-center shadow-lg">
        <Link href="/" className="text-2xl font-extrabold">🧺 Doko Pasal</Link>
        <Link href="/cart" className="bg-white text-red-700 px-4 py-2 rounded-full font-extrabold text-sm">← Cart</Link>
      </nav>

      {/* STEP INDICATOR */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          {[{ n: 1, label: '📦 Delivery' }, { n: 2, label: '💳 Payment' }, { n: 3, label: '✅ Confirm' }].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              {i > 0 && <div className={`h-0.5 w-8 ${step > i ? 'bg-red-600' : 'bg-gray-200'}`} />}
              <div className={`flex items-center gap-1.5 ${step >= s.n ? 'text-red-700' : 'text-gray-400'}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-extrabold ${step >= s.n ? 'bg-red-700 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  {step > s.n ? '✓' : s.n}
                </div>
                <span className="text-sm font-semibold hidden sm:block">{s.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-5 gap-6">
          {/* LEFT */}
          <div className="md:col-span-3">

            {/* STEP 1 */}
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-xl font-extrabold text-gray-900 mb-5">📦 Delivery Details</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
                      <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                        placeholder="Ram Sharma"
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Phone *</label>
                      <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                        placeholder="98XXXXXXXX"
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Street / Tole *</label>
                    <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                      placeholder="Ward No. / Street name / Tole"
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-400" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">City / District *</label>
                      <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                        placeholder="Kathmandu"
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Landmark</label>
                      <input type="text" value={form.landmark} onChange={e => setForm({...form, landmark: e.target.value})}
                        placeholder="Near school/hospital"
                        className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Order Note</label>
                    <textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})}
                      placeholder="Any special instructions..." rows={2}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-red-400 resize-none" />
                  </div>
                  <button onClick={() => {
                    if (!form.name || !form.phone || !form.address || !form.city) {
                      alert('Please fill Name, Phone, Address and City!'); return
                    }
                    setStep(2)
                  }} className="w-full bg-red-700 text-white py-4 rounded-2xl font-extrabold text-lg hover:bg-red-600 transition">
                    Continue to Payment →
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-xl font-extrabold text-gray-900 mb-5">💳 Choose Payment</h2>
                <div className="space-y-3 mb-5">
                  {payments.map(method => (
                    <label key={method.id}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition ${paymentMethod === method.id ? method.color : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                      <input type="radio" name="payment" value={method.id}
                        checked={paymentMethod === method.id}
                        onChange={() => setPaymentMethod(method.id)}
                        className="w-4 h-4 accent-red-600" />
                      <span className="text-3xl">{method.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-gray-900">{method.label}</p>
                          {method.badge && (
                            <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold">{method.badge}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{method.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-2xl font-extrabold hover:bg-gray-200 transition">← Back</button>
                  <button onClick={() => setStep(3)} className="flex-1 bg-red-700 text-white py-3.5 rounded-2xl font-extrabold hover:bg-red-600 transition">Review Order →</button>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="bg-white rounded-2xl shadow p-6">
                <h2 className="text-xl font-extrabold text-gray-900 mb-5">✅ Confirm Your Order</h2>
                <div className="bg-gray-50 rounded-2xl p-5 mb-5 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-bold">{form.name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Phone</span><span className="font-bold">{form.phone}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Address</span><span className="font-bold text-right max-w-xs">{form.address}{form.landmark ? ', near '+form.landmark : ''}, {form.city}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="font-bold">{payments.find(p=>p.id===paymentMethod)?.icon} {payments.find(p=>p.id===paymentMethod)?.label}</span></div>
                  <div className="flex justify-between pt-2 border-t text-lg"><span className="font-extrabold">Total</span><span className="font-extrabold text-red-700">Rs. {total.toLocaleString()}</span></div>
                </div>

                {(paymentMethod === 'khalti' || paymentMethod === 'esewa') && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-sm text-blue-700">
                    ℹ️ You will be redirected to {paymentMethod === 'khalti' ? 'Khalti' : 'eSewa'} to complete payment securely.
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-2xl font-extrabold hover:bg-gray-200 transition">← Back</button>
                  <button onClick={placeOrder} disabled={loading}
                    className="flex-1 bg-red-700 text-white py-3.5 rounded-2xl font-extrabold hover:bg-red-600 transition disabled:opacity-50">
                    {loading ? '⏳ Processing...' : `🎉 Place Order`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT - SUMMARY */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-2xl shadow p-5 sticky top-24">
              <h2 className="font-extrabold text-gray-900 mb-4">🧾 Order ({itemCount} items)</h2>
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4 pr-1">
                {cart.map(item => (
                  <div key={`${item.id}-${item.selectedSize}`} className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-red-50 flex items-center justify-center text-xl flex-shrink-0">
                      {item.image_url || (item.image_urls?.[0])
                        ? <img src={item.image_url || item.image_urls[0]} alt={item.name} className="w-full h-full object-cover" />
                        : '👔'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{item.name}</p>
                      {item.selectedSize && <p className="text-gray-400 text-xs">Size: {item.selectedSize}</p>}
                      <p className="text-gray-400 text-xs">Qty: {item.qty}</p>
                    </div>
                    <p className="font-extrabold text-red-700 text-sm">Rs. {(item.price * item.qty).toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>Rs. {total.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm text-green-600 font-bold"><span>Delivery</span><span>FREE 🎉</span></div>
                <div className="flex justify-between font-extrabold text-xl text-red-700 pt-1 border-t">
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