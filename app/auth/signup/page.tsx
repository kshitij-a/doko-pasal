'use client'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logActivity } from '../../../lib/activity'

export default function SignUp() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSignUp = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, phone: phone }
      }
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('✅ Account created! Please check your email to confirm, then login.')
      logActivity('signup', { email }, '/auth/signup')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-red-50 flex flex-col">

      {/* NAVBAR */}
      <nav className="bg-red-700 text-white px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">🧺 Doko Pasal</Link>
        <Link href="/auth/login" className="bg-white text-red-700 px-4 py-1 rounded-full font-bold">Login</Link>
      </nav>

      {/* FORM */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-red-700 mb-2 text-center">Create Account</h1>
          <p className="text-gray-500 text-center mb-6">Join Doko Pasal — it's free!</p>

          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              ❌ {error}
            </div>
          )}
          {message && (
            <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {message}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Ram Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="e.g. ram@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                placeholder="e.g. 98XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>

            <button
              onClick={handleSignUp}
              disabled={loading}
              className="w-full bg-red-700 text-white py-3 rounded-lg font-bold text-lg hover:bg-red-600 transition disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </div>

          <p className="text-center text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-red-700 font-bold hover:underline">Login here</Link>
          </p>
        </div>
      </div>
    </main>
  )
}