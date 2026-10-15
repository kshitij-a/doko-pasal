import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '../../../lib/supabase-server'
import { check, getIp } from '../../../lib/rate-limit'

export async function POST(request: Request) {
  if (!check(getIp(request), 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }
  try {
    const body = await request.json()
    if (typeof body.action !== 'string' || !body.action || body.action.length > 64) {
      return NextResponse.json({ error: 'action must be a string of 1-64 characters' }, { status: 400 })
    }
    if (body.page !== undefined && body.page !== null && (typeof body.page !== 'string' || body.page.length > 128)) {
      return NextResponse.json({ error: 'page must be a string of max 128 characters' }, { status: 400 })
    }
    if (body.details !== undefined && body.details !== null && (typeof body.details !== 'object' || Array.isArray(body.details))) {
      return NextResponse.json({ error: 'details must be an object' }, { status: 400 })
    }
    const supabase = createServiceClient()
    if (!supabase) return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 500 })
    // Identity comes from the optional Bearer token, never the client body.
    let userId: string | null = null
    let userEmail: string | null = null
    let userName: string | null = null
    const auth = request.headers.get('authorization')
    if (auth?.startsWith('Bearer ')) {
      const anon = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: { user } } = await anon.auth.getUser(auth.replace('Bearer ', ''))
      if (user) {
        userId = user.id
        userEmail = user.email?.trim().toLowerCase() || null
        userName = (user.user_metadata?.full_name as string) || null
      }
    }
    const { error } = await supabase.from('activity_logs').insert({
      user_id: userId,
      user_email: userEmail,
      user_name: userName,
      action: body.action,
      details: body.details || null,
      page: body.page || null,
    })
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
