import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminAccess, getSupabaseAdmin } from '../../../../lib/admin-api'

function getAdminClient() {
  const client = getSupabaseAdmin()
  if (!client) {
    return null
  }
  return client
}

export async function GET(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request)
  if (!authorized) return response!

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    let users: any[] = []
    const supabaseAdmin = getAdminClient()

    if (supabaseAdmin) {
      const { data: authData, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
      if (!error && authData?.users) {
        users = authData.users
      }
    }

    if (users.length === 0) {
      const fallbackClient = supabaseAdmin || createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: activityUsers } = await fallbackClient
        .from('activity_logs')
        .select('user_id, user_email, user_name')
        .not('user_id', 'is', null)

      const userMap = new Map<string, any>()
      activityUsers?.forEach((a: any) => {
        if (a.user_id && !userMap.has(a.user_id)) {
          userMap.set(a.user_id, {
            id: a.user_id,
            email: a.user_email,
            full_name: a.user_name || '',
            phone: '',
            avatar_url: '',
            banned: false,
            created_at: '',
            last_sign_in: null,
          })
        }
      })
      users = Array.from(userMap.values())
    }

    let filtered = users
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(u =>
        u.email?.toLowerCase().includes(q) ||
        u.user_metadata?.full_name?.toLowerCase().includes(q) ||
        u.full_name?.toLowerCase().includes(q) ||
        u.user_metadata?.phone?.includes(q)
      )
    }

    const userIds = filtered.map(u => u.id).filter(Boolean)
    let orderData: any[] = []
    if (userIds.length > 0) {
      const client = supabaseAdmin || createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data } = await client
        .from('orders')
        .select('user_id, total_amount, order_status')
        .in('user_id', userIds)
      orderData = data || []
    }

    const userStats: Record<string, { orderCount: number; totalSpent: number }> = {}
    orderData.forEach(o => {
      if (!userStats[o.user_id]) userStats[o.user_id] = { orderCount: 0, totalSpent: 0 }
      userStats[o.user_id].orderCount++
      if (o.order_status !== 'cancelled') userStats[o.user_id].totalSpent += o.total_amount || 0
    })

    const enriched = filtered.map(u => ({
      id: u.id,
      email: u.email,
      full_name: u.user_metadata?.full_name || u.full_name || '',
      phone: u.user_metadata?.phone || '',
      avatar_url: u.user_metadata?.avatar_url || u.avatar_url || '',
      banned: u.user_metadata?.banned || false,
      ban_reason: u.user_metadata?.ban_reason || '',
      created_at: u.created_at || '',
      last_sign_in: u.last_sign_in_at || null,
      orderCount: userStats[u.id]?.orderCount || 0,
      totalSpent: userStats[u.id]?.totalSpent || 0,
    }))

    const ordersForUserId = searchParams.get('ordersForUser')
    if (ordersForUserId) {
      const client = supabaseAdmin || createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { data: orders } = await client
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', ordersForUserId)
        .order('created_at', { ascending: false })
      return NextResponse.json({ orders: orders || [] })
    }

    return NextResponse.json({ users: enriched })
  } catch (error: any) {
    return NextResponse.json({ error: error.message, users: [] }, { status: 200 })
  }
}

export async function PATCH(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request)
  if (!authorized) return response!

  try {
    const body = await request.json()
    const { userId, data } = body

    if (userId === '__order__' && data?.orderId) {
      const client = getAdminClient()
      if (!client) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
      const { error } = await client.from('orders').update({ order_status: data.order_status }).eq('id', data.orderId)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    const client = getAdminClient()
    if (!client) return NextResponse.json({ error: 'Server configuration error - service role key not set' }, { status: 500 })

    const { error } = await client.auth.admin.updateUserById(userId, {
      user_metadata: data,
    })
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request)
  if (!authorized) return response!

  const client = getAdminClient()
  if (!client) {
    return NextResponse.json({
      error: 'Admin actions require SUPABASE_SERVICE_ROLE_KEY. Please add it to your Vercel environment variables.'
    }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { action, email } = body

    if (action === 'magic-link') {
      if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
      const { error } = await client.auth.admin.inviteUserByEmail(email, {
        redirectTo: process.env.NEXT_PUBLIC_BASE_URL || 'https://birthdaysuprise.me'
      })
      if (error) throw error
      return NextResponse.json({ success: true, message: 'Magic link sent to ' + email })
    }

    if (action === 'reset-password') {
      if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://birthdaysuprise.me'
      const { error } = await client.auth.admin.inviteUserByEmail(email, {
        redirectTo: `${baseUrl}/auth/reset-password`,
        data: { reset_only: true }
      })
      if (error) throw error
      return NextResponse.json({ success: true, message: 'Reset password link sent to ' + email })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Admin action failed' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request)
  if (!authorized) return response!

  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'delete-order') {
      const client = getAdminClient()
      if (!client) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
      const orderId = searchParams.get('orderId')
      if (!orderId) return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
      await client.from('order_items').delete().eq('order_id', orderId)
      const { error } = await client.from('orders').delete().eq('id', orderId)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    const client = getAdminClient()
    if (!client) {
      return NextResponse.json({
        error: 'User deletion requires SUPABASE_SERVICE_ROLE_KEY. Please add it to your Vercel environment variables.'
      }, { status: 500 })
    }

    const cleanupErrors: string[] = []

    const { error: msgErr } = await client.from('messages').delete().eq('sender_id', userId)
    if (msgErr) cleanupErrors.push('messages: ' + msgErr.message)

    const { error: convErr } = await client.from('conversations').delete().eq('user_id', userId)
    if (convErr) cleanupErrors.push('conversations: ' + convErr.message)

    const { data: userOrders } = await client.from('orders').select('id').eq('user_id', userId)
    const orderIds = (userOrders || []).map((o: any) => o.id)
    if (orderIds.length > 0) {
      const { error: itemErr } = await client.from('order_items').delete().in('order_id', orderIds)
      if (itemErr) cleanupErrors.push('order_items: ' + itemErr.message)
    }

    const { error: orderErr } = await client.from('orders').delete().eq('user_id', userId)
    if (orderErr) cleanupErrors.push('orders: ' + orderErr.message)

    const { error: revErr } = await client.from('reviews').delete().eq('user_id', userId)
    if (revErr) cleanupErrors.push('reviews: ' + revErr.message)

    const { error: actErr } = await client.from('activity_logs').delete().eq('user_id', userId)
    if (actErr) cleanupErrors.push('activity_logs: ' + actErr.message)

    const { error } = await client.auth.admin.deleteUser(userId)
    if (error) {
      return NextResponse.json({
        error: 'Database error deleting user: ' + error.message,
        cleanupErrors,
      }, { status: 500 })
    }

    return NextResponse.json({ success: true, cleanupErrors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
