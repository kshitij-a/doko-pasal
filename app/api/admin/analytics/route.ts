import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminAccess } from '../../../../lib/admin-api'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request)
  if (!authorized) return response!

  try {
    const now = new Date()
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(now.getDate() - 30)
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString()

    const [ordersResult, productsResult, recentOrdersResult, dailyRevenueResult, orderItemsResult, orderStatusResult, activityResult] = await Promise.all([
      supabase.from('orders').select('total_amount, payment_status, order_status', { count: 'exact' }),
      supabase.from('products').select('id, stock'),
      supabase.from('orders').select('id, customer_name, customer_phone, total_amount, order_status, payment_method, created_at').order('created_at', { ascending: false }).limit(8),
      supabase.from('orders').select('id, total_amount, created_at').gte('created_at', thirtyDaysAgoStr).neq('order_status', 'cancelled'),
      supabase.from('order_items').select('product_id, product_name, quantity, price, order_id'),
      supabase.from('orders').select('order_status'),
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(8),
    ])

    const orders = ordersResult.data || []
    const products = productsResult.data || []

    const totalRevenue = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + (o.total_amount || 0), 0)
    const totalOrders = orders.length
    const totalProducts = products.length
    const pendingOrders = orders.filter(o => o.order_status === 'pending').length
    const deliveredOrders = orders.filter(o => o.order_status === 'delivered').length
    const cancelledOrders = orders.filter(o => o.order_status === 'cancelled').length
    const lowStockProducts = products.filter(p => p.stock <= 5 && p.stock > 0).length
    const outOfStock = products.filter(p => p.stock === 0).length

    const revenueByDate: Record<string, number> = {}
    ;(dailyRevenueResult.data || []).forEach((o: any) => {
      const d = new Date(o.created_at)
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      revenueByDate[date] = (revenueByDate[date] || 0) + (o.total_amount || 0)
    })
    const chartData = Object.entries(revenueByDate).map(([date, revenue]) => ({ date, revenue })).sort((a, b) => a.date.localeCompare(b.date))

    const recentOrderIds = new Set((dailyRevenueResult.data || []).map((o: any) => o.id))
    const productSales: Record<string, { name: string; total: number; qty: number }> = {}
    ;(orderItemsResult.data || []).forEach((item: any) => {
      if (!recentOrderIds.has(item.order_id)) return
      if (!productSales[item.product_id]) productSales[item.product_id] = { name: item.product_name, total: 0, qty: 0 }
      productSales[item.product_id].total += (item.price || 0) * (item.quantity || 0)
      productSales[item.product_id].qty += item.quantity || 0
    })
    const topProducts = Object.entries(productSales).map(([id, data]) => ({ id, ...data })).sort((a: any, b: any) => b.total - a.total).slice(0, 10)

    const statusBreakdown: Record<string, number> = {}
    ;(orderStatusResult.data || []).forEach((o: any) => {
      statusBreakdown[o.order_status] = (statusBreakdown[o.order_status] || 0) + 1
    })

    return NextResponse.json({
      stats: { totalRevenue, totalOrders, totalProducts, pendingOrders, deliveredOrders, cancelledOrders, lowStockProducts, outOfStock },
      chartData,
      topProducts,
      statusBreakdown,
      recentOrders: recentOrdersResult.data || [],
      recentActivity: activityResult.data || [],
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
