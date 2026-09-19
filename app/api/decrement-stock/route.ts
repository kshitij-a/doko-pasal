import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// COD/bank path: anon/AUTH users can't update products (public-read RLS),
// so stock decrement goes through this service-role route.
export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'Server configuration error - service role key not set' }, { status: 500 })
  }
  const supabase = createClient(url, key)

  try {
    const { orderId } = await request.json()
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 })

    const { data: items } = await supabase.from('order_items').select('product_id, quantity').eq('order_id', orderId)
    for (const it of items || []) {
      const { data: p } = await supabase.from('products').select('stock').eq('id', it.product_id).single()
      if (p && p.stock != null) {
        await supabase.from('products').update({ stock: Math.max(0, p.stock - it.quantity) }).eq('id', it.product_id)
      }
    }
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Stock update failed' }, { status: 500 })
  }
}
