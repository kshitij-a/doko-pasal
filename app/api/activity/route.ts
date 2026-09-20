import { NextResponse } from 'next/server'
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
    if (!supabase) return NextResponse.json({ error: 'Server configuration error - service role key not set' }, { status: 500 })
    const { error } = await supabase.from('activity_logs').insert({
      user_id: body.user_id || null,
      user_email: body.user_email || null,
      user_name: body.user_name || null,
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
