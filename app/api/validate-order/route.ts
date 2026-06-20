import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, userId } = body

    if (!orderId || !userId) {
      return NextResponse.json({ error: 'Missing orderId or userId' }, { status: 400 })
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    let serverTotal = 0
    for (const item of order.order_items) {
      const { data: product } = await supabase
        .from('products')
        .select('price, sale_price, stock')
        .eq('id', item.product_id)
        .single()

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${item.product_id}` }, { status: 400 })
      }

      const validPrice = product.sale_price && product.sale_price < product.price ? product.sale_price : product.price
      serverTotal += validPrice * item.quantity
    }

    if (Math.abs(serverTotal - order.total_amount) > 0.01) {
      await supabase
        .from('orders')
        .update({ total_amount: serverTotal })
        .eq('id', orderId)

      return NextResponse.json({
        valid: false,
        corrected: true,
        serverTotal,
        clientTotal: order.total_amount,
        message: 'Order total was corrected to match server prices',
      })
    }

    return NextResponse.json({ valid: true, total: serverTotal })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
