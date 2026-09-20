import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminAccess, getSupabaseAdmin } from '../../../lib/admin-api'

function clients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const admin = getSupabaseAdmin()
  const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  return { admin, anon }
}

async function getUser(request: Request) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { anon } = clients()
  const { data: { user } } = await anon.auth.getUser(token)
  return user
}

// GET: admin (Bearer admin) → all requests; user → own requests
export async function GET(request: Request) {
  const { authorized } = await verifyAdminAccess(request)
  const { admin } = clients()
  if (!admin) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  if (authorized) {
    const { data } = await admin.from('return_requests').select('*').order('created_at', { ascending: false })
    return NextResponse.json({ returns: data || [] })
  }
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data } = await admin.from('return_requests').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
  return NextResponse.json({ returns: data || [] })
}

// POST: delivered-order owner requests a return { orderId, reason }
export async function POST(request: Request) {
  const { admin } = clients()
  if (!admin) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  const user = await getUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { orderId, reason } = await request.json()
  if (!orderId || !String(reason || '').trim()) {
    return NextResponse.json({ error: 'orderId and reason required' }, { status: 400 })
  }
  const { data: order } = await admin.from('orders').select('id, user_id, order_status').eq('id', orderId).single()
  if (!order || order.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (order.order_status !== 'delivered') return NextResponse.json({ error: 'Only delivered orders can be returned' }, { status: 400 })
  const { data, error } = await admin.from('return_requests').insert({ order_id: orderId, user_id: user.id, reason: String(reason).slice(0, 500) }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, return: data })
}

// PATCH: admin approves/rejects { id, status }
export async function PATCH(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request)
  if (!authorized) return response!
  const { admin } = clients()
  if (!admin) return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 })
  const { id, status } = await request.json()
  if (!id || !['approved', 'rejected'].includes(status)) {
    return NextResponse.json({ error: 'id + approved|rejected required' }, { status: 400 })
  }
  const { error } = await admin.from('return_requests').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
