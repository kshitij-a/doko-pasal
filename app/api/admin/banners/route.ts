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

  const { data, error } = await supabase.from('banners').select('*').order('position', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ banners: data })
}

export async function POST(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request)
  if (!authorized) return response!

  try {
    const body = await request.json()
    const { data, error } = await supabase.from('banners').insert(body).select().single()
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
    const body = await request.json()
    const { id, ...updates } = body
    const { error } = await supabase.from('banners').update(updates).eq('id', id)
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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })
    const { error } = await supabase.from('banners').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
