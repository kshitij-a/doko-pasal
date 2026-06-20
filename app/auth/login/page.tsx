'use client'
import { useState } from 'react'
import { supabase } from '../../../lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { logActivity } from '../../../lib/activity'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      logActivity('login', { email }, '/auth/login')
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-red-50 flex flex-col">

      {/* NAVBAR */}
      <nav className="bg-red-700 text-white px-6 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">🧺 Doko Pasal</Link>
        <Link href="/auth/signup" className="bg-yellow-400 text-red-800 px-4 py-1 rounded-full font-bold">Sign Up</Link>
      </nav>

      {/* FORM */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-red-700 mb-2 text-center">Welcome Back!</h1>
          <p className="text-gray-500 text-center mb-6">Login to your Doko Pasal account</p>

          {error && (
            <div className="bg-red-100 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              ❌ {error}
            </div>
          )}

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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
              <div className="text-right mt-1">
                <Link href="/auth/forgot-password" className="text-sm text-red-700 hover:underline font-medium">Forgot password?</Link>
              </div>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-red-700 text-white py-3 rounded-lg font-bold text-lg hover:bg-red-600 transition disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>

          <p className="text-center text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link href="/auth/signup" className="text-red-700 font-bold hover:underline">Sign up free</Link>
          </p>
        </div>
      </div>
    </main>
  )
}