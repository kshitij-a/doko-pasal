'use client'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleReset = async () => {
    if (!email) { setError('Please enter your email address'); return }
    setLoading(true)
    setError('')
    setMessage('')

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/auth/reset-password`,
    })

    if (error) {
      setError(error.message)
    } else {
      setMessage('Check your email for a password reset link.')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-red-50 flex flex-col">
      <nav className="bg-red-700 text-white px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">🧺 Doko Pasal</Link>
        <Link href="/auth/login" className="bg-white text-red-700 px-4 py-1 rounded-full font-bold text-sm">Login</Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-red-700 mb-2 text-center">Forgot Password?</h1>
          <p className="text-gray-500 text-center mb-6">Enter your email and we'll send you a reset link</p>

          {error && <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">❌ {error}</div>}
          {message && <div className="bg-green-100 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">✅ {message}</div>}

          <div className="space-y-4">
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

            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full bg-red-700 text-white py-3 rounded-lg font-bold text-lg hover:bg-red-600 transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </div>

          <p className="text-center text-gray-500 mt-6">
            Remember your password?{' '}
            <Link href="/auth/login" className="text-red-700 font-bold hover:underline">Back to Login</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
