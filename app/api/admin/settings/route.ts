import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET() {
  const { data, error } = await supabase.from('site_settings').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const settings: Record<string, string> = {}
  data?.forEach(s => { settings[s.key] = s.value })
  return NextResponse.json({ settings })
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { settings } = body

    for (const [key, value] of Object.entries(settings)) {
      await supabase
        .from('site_settings')
        .upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'key' })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
