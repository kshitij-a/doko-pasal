import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminAccess } from '../../../../lib/admin-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request)
  if (!authorized) return response!

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const action = searchParams.get('action') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    let query = supabase.from('activity_logs').select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`user_email.ilike.%${search}%,user_name.ilike.%${search}%`)
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
  try {
    const body = await request.json()
    if (!body.action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 })
    }
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
