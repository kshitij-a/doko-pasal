import { NextResponse } from 'next/server'
import { verifyAdminAccess } from '../../../../lib/admin-api'
import { createClient } from '@supabase/supabase-js'

function getClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key)
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const COUPON_UPDATE_FIELDS = ['code', 'type', 'value', 'min_order', 'max_uses', 'expires_at', 'active'] as const

function validateCoupon(input: any): string | null {
  if (input.code !== undefined && (typeof input.code !== 'string' || !input.code.trim())) {
    return 'code must be a non-empty string'
  }
  if (input.type !== undefined && input.type !== 'percentage' && input.type !== 'fixed') {
    return 'type must be percentage or fixed'
  }
  if (input.value !== undefined && (typeof input.value !== 'number' || !(input.value > 0))) {
    return 'value must be a number > 0'
  }
  if (input.type === 'percentage' && typeof input.value === 'number' && input.value > 100) {
    return 'percentage value must be <= 100'
  }
  if (input.min_order !== undefined && (typeof input.min_order !== 'number' || input.min_order < 0)) {
    return 'min_order must be >= 0'
  }
  if (input.max_uses !== undefined && (typeof input.max_uses !== 'number' || input.max_uses < 0)) {
    return 'max_uses must be >= 0'
  }
  return null
}

export async function GET(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request)
  if (!authorized) return response!

  const supabase = getClient()
  if (!supabase) return NextResponse.json({ error: 'Server configuration error - service role key not set' }, { status: 500 })
  const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ coupons: data })
}

export async function POST(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request)
  if (!authorized) return response!

  try {
    const supabase = getClient()
    if (!supabase) return NextResponse.json({ error: 'Server configuration error - service role key not set' }, { status: 500 })
    const body = await request.json()
    const { code, type, value, min_order, max_uses, expires_at } = body

    const err = validateCoupon({ code, type, value, min_order, max_uses })
    if (err) return NextResponse.json({ error: err }, { status: 400 })
    if (!code || type === undefined || value === undefined) {
      return NextResponse.json({ error: 'code, type and value are required' }, { status: 400 })
    }

    const { data, error } = await supabase.from('coupons').insert({
      code: (code as string).toUpperCase(),
      type,
      value,
      min_order: min_order || 0,
      max_uses: max_uses || 0,
      expires_at: expires_at || null,
      active: true,
    }).select().single()

    if (error) throw error
    return NextResponse.json({ coupon: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request)
  if (!authorized) return response!

  try {
    const supabase = getClient()
    if (!supabase) return NextResponse.json({ error: 'Server configuration error - service role key not set' }, { status: 500 })
    const body = await request.json()
    const { id, ...updates } = body

    if (!id || typeof id !== 'string' || !UUID_RE.test(id)) {
      return NextResponse.json({ error: 'valid coupon id required' }, { status: 400 })
    }
    const safe: Record<string, any> = {}
    for (const f of COUPON_UPDATE_FIELDS) {
      if (updates[f] !== undefined) safe[f] = updates[f]
    }
    if (Object.keys(safe).length === 0) {
      return NextResponse.json({ error: 'no valid fields to update' }, { status: 400 })
    }
    const err = validateCoupon(safe)
    if (err) return NextResponse.json({ error: err }, { status: 400 })
    if (typeof safe.code === 'string') safe.code = safe.code.toUpperCase()

    const { error } = await supabase.from('coupons').update(safe).eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request)
  if (!authorized) return response!

  try {
    const supabase = getClient()
    if (!supabase) return NextResponse.json({ error: 'Server configuration error - service role key not set' }, { status: 500 })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id || !UUID_RE.test(id)) return NextResponse.json({ error: 'valid ID required' }, { status: 400 })

    const { error } = await supabase.from('coupons').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
