import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminAccess } from '../../../../lib/admin-api'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request)
  if (!authorized) return response!

  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''

    let users: any[] = []

    // Try admin API first (requires service_role key)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { data: authData, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
      if (!error && authData?.users) {
        users = authData.users
      }
    }

    // Fallback: get users from activity_logs if admin API not available
    if (users.length === 0) {
      const { data: activityUsers } = await supabaseAdmin
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

    // Get order counts for each user
    const userIds = filtered.map(u => u.id).filter(Boolean)
    let orderData: any[] = []
    if (userIds.length > 0) {
      const { data } = await supabaseAdmin
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

    // Support fetching orders for a specific user
    const ordersForUserId = searchParams.get('ordersForUser')
    if (ordersForUserId) {
      const { data: orders } = await supabaseAdmin
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
      const { error } = await supabaseAdmin.from('orders').update({ order_status: data.order_status }).eq('id', data.orderId)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: data,
      })
      if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request)
  if (!authorized) return response!

  try {
    const body = await request.json()
    const { action, email } = body

    if (action === 'magic-link') {
      if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
      const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo: process.env.NEXT_PUBLIC_BASE_URL || 'https://birthdaysuprise.me' })
      if (error) throw error
      return NextResponse.json({ success: true, message: 'Magic link sent to ' + email })
    }

    if (action === 'reset-password') {
      if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://birthdaysuprise.me'
      const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo: `${baseUrl}/auth/reset-password`, data: { reset_only: true } })
      if (error) throw error
      return NextResponse.json({ success: true, message: 'Reset password link sent to ' + email })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request)
  if (!authorized) return response!

  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'magic-link') {
      const email = searchParams.get('email')
      if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
      const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo: process.env.NEXT_PUBLIC_BASE_URL || 'https://birthdaysuprise.me' })
      if (error) throw error
      return NextResponse.json({ success: true, message: 'Magic link sent to ' + email })
    }

    if (action === 'reset-password') {
      const email = searchParams.get('email')
      if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://birthdaysuprise.me'
      const { error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, { redirectTo: `${baseUrl}/auth/reset-password`, data: { reset_only: true } })
      if (error) throw error
      return NextResponse.json({ success: true, message: 'Reset password link sent to ' + email })
    }

    if (action === 'delete-order') {
      const orderId = searchParams.get('orderId')
      if (!orderId) return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
      await supabaseAdmin.from('order_items').delete().eq('order_id', orderId)
      const { error } = await supabaseAdmin.from('orders').delete().eq('id', orderId)
      if (error) throw error
      return NextResponse.json({ success: true })
    }

    const userId = searchParams.get('userId')
    if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 })

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Service role key required for user deletion' }, { status: 400 })
    }

    const cleanupErrors: string[] = []

    // 1. Delete messages sent by this user
    const { error: msgErr } = await supabaseAdmin.from('messages').delete().eq('sender_id', userId)
    if (msgErr) cleanupErrors.push('messages: ' + msgErr.message)

    // 2. Delete user's conversations (messages already deleted above)
    const { error: convErr } = await supabaseAdmin.from('conversations').delete().eq('user_id', userId)
    if (convErr) cleanupErrors.push('conversations: ' + convErr.message)

    // 3. Delete order items for user's orders
    const { data: userOrders } = await supabaseAdmin.from('orders').select('id').eq('user_id', userId)
    const orderIds = (userOrders || []).map((o: any) => o.id)
    if (orderIds.length > 0) {
      const { error: itemErr } = await supabaseAdmin.from('order_items').delete().in('order_id', orderIds)
      if (itemErr) cleanupErrors.push('order_items: ' + itemErr.message)
    }

    // 4. Delete orders
    const { error: orderErr } = await supabaseAdmin.from('orders').delete().eq('user_id', userId)
    if (orderErr) cleanupErrors.push('orders: ' + orderErr.message)

    // 5. Delete reviews
    const { error: revErr } = await supabaseAdmin.from('reviews').delete().eq('user_id', userId)
    if (revErr) cleanupErrors.push('reviews: ' + revErr.message)

    // 6. Delete activity logs
    const { error: actErr } = await supabaseAdmin.from('activity_logs').delete().eq('user_id', userId)
    if (actErr) cleanupErrors.push('activity_logs: ' + actErr.message)

    // 7. Delete auth user
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
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
