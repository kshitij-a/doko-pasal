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

  const supabase = getClient()
  if (!supabase) return NextResponse.json({ error: 'Server configuration error - service role key not set' }, { status: 500 })
  const { data, error } = await supabase.from('site_settings').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const settings: Record<string, string> = {}
  data?.forEach(s => { settings[s.key] = s.value })
  return NextResponse.json({ settings })
}

export async function PUT(request: Request) {
  const { authorized, response } = await verifyAdminAccess(request)
  if (!authorized) return response!

  try {
    const supabase = getClient()
    if (!supabase) return NextResponse.json({ error: 'Server configuration error - service role key not set' }, { status: 500 })
    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) {
      return NextResponse.json({ error: 'settings object required' }, { status: 400 })
    }
    const entries = Object.entries(settings)
    if (entries.length === 0 || entries.length > 50) {
      return NextResponse.json({ error: 'settings must have 1-50 entries' }, { status: 400 })
    }
    for (const [key, value] of entries) {
      if (typeof key !== 'string' || !key.trim() || key.length > 100) {
        return NextResponse.json({ error: `invalid setting key: ${String(key).slice(0, 50)}` }, { status: 400 })
      }
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
        return NextResponse.json({ error: `invalid value for key: ${key}` }, { status: 400 })
      }
      if (String(value).length > 5000) {
        return NextResponse.json({ error: `value too long for key: ${key}` }, { status: 400 })
      }
    }

    for (const [key, value] of entries) {
      await supabase
        .from('site_settings')
        .upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'key' })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
