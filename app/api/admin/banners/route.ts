import { NextResponse } from 'next/server'
import { verifyAdminAccess } from '../../../../lib/admin-api'
import { createClient } from '@supabase/supabase-js'

function getClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key)
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const BANNER_UPDATE_FIELDS = ['title', 'image_url', 'link', 'position', 'active'] as const

function validateBanner(input: any): string | null {
  if (input.title !== undefined && (typeof input.title !== 'string' || !input.title.trim())) {
    return 'title must be a non-empty string'
  }
  if (input.image_url !== undefined && (typeof input.image_url !== 'string' || !input.image_url.trim())) {
    return 'image_url must be a non-empty string'
  }
  if (input.position !== undefined && (typeof input.position !== 'number' || input.position < 0)) {
    return 'position must be >= 0'
  }
  if (input.active !== undefined && typeof input.active !== 'boolean') {
    return 'active must be a boolean'
  }
  return null
}

export async function GET(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request)
  if (!authorized) return response!

  const supabase = getClient()
  if (!supabase) return NextResponse.json({ error: 'Server configuration error - service role key not set' }, { status: 500 })
  const { data, error } = await supabase.from('banners').select('*').order('position', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ banners: data })
}

export async function POST(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request)
  if (!authorized) return response!

  try {
    const supabase = getClient()
    if (!supabase) return NextResponse.json({ error: 'Server configuration error - service role key not set' }, { status: 500 })
    const body = await request.json()
    const safe: Record<string, any> = {}
    for (const f of BANNER_UPDATE_FIELDS) {
      if (body[f] !== undefined) safe[f] = body[f]
    }
    const err = validateBanner(safe)
    if (err) return NextResponse.json({ error: err }, { status: 400 })
    if (!safe.title || !safe.image_url) {
      return NextResponse.json({ error: 'title and image_url are required' }, { status: 400 })
    }
    const { data, error } = await supabase.from('banners').insert(safe).select().single()
    if (error) throw error
    return NextResponse.json({ banner: data })
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
      return NextResponse.json({ error: 'valid banner id required' }, { status: 400 })
    }
    const safe: Record<string, any> = {}
    for (const f of BANNER_UPDATE_FIELDS) {
      if (updates[f] !== undefined) safe[f] = updates[f]
    }
    if (Object.keys(safe).length === 0) {
      return NextResponse.json({ error: 'no valid fields to update' }, { status: 400 })
    }
    const err = validateBanner(safe)
    if (err) return NextResponse.json({ error: err }, { status: 400 })
    const { error } = await supabase.from('banners').update(safe).eq('id', id)
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
    const { error } = await supabase.from('banners').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
