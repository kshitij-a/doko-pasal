import { NextResponse } from 'next/server'
import { verifyAdminAccess } from '../../../../lib/admin-api'
import { createClient } from '@supabase/supabase-js'

function getClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key)
}

export async function GET(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request)
  if (!authorized) return response!

  try {
    const supabase = getClient()
    if (!supabase) return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 500 })
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const action = searchParams.get('action') || ''
    const rawPage = parseInt(searchParams.get('page') || '1')
    const rawLimit = parseInt(searchParams.get('limit') || '20')
    const page = Math.max(Number.isNaN(rawPage) ? 1 : rawPage, 1)
    const limit = Math.min(Math.max(Number.isNaN(rawLimit) ? 20 : rawLimit, 1), 100)
    const offset = (page - 1) * limit

    let query = supabase.from('activity_logs').select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      // Escape LIKE wildcards and PostgREST `or` separators so user input
      // cannot alter the filter structure.
      const esc = search.replace(/([%_(),])/g, '\\$1')
      query = query.or(`user_email.ilike.%${esc}%,user_name.ilike.%${esc}%`)
    }
    if (action) {
      query = query.eq('action', action)
    }

    const { data, error, count } = await query
    if (error) throw error

    return NextResponse.json({ logs: data, total: count })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request)
  if (!authorized) return response!

  try {
    const body = await request.json()
    if (!body.action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 })
    }
    const supabase = getClient()
    if (!supabase) return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 500 })
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
