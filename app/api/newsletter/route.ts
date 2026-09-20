import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { check, getIp } from '../../../lib/rate-limit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  if (!check(getIp(request), 5, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
    }
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey)
    const { error } = await supabase.from('newsletter_subscribers').insert({ email })
    if (error) {
      // Graceful 500 if table missing (or duplicate)
      return NextResponse.json({ error: 'Subscription failed. Please try again later.' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Subscription failed' }, { status: 500 })
  }
}
