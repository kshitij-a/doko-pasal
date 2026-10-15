import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// IMPORTANT: admin check must run server-side (Route Handlers / server code only).
// Never call this from client components — the Bearer token + admins lookup
// below is server-side verification, not client-side gating.
// NOTE: the admins lookup uses the service-role client to bypass RLS; the
// anon client is only used to validate the Bearer token via auth.getUser.
export async function verifyAdminAccess(request: Request): Promise<{ authorized: boolean; response?: NextResponse }> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return { authorized: false, response: NextResponse.json({ error: 'Unauthorized - no Bearer token provided' }, { status: 401 }) }
    }

    const token = authHeader.replace('Bearer ', '')

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return { authorized: false, response: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }) }
    }

    const email = user.email?.trim().toLowerCase()
    if (!email) {
      return { authorized: false, response: NextResponse.json({ error: 'Forbidden - not an admin' }, { status: 403 }) }
    }

    const admin = getSupabaseAdmin()
    if (!admin) {
      return { authorized: false, response: NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 500 }) }
    }

    const { data: adminData } = await admin
      .from('admins')
      .select('email')
      .eq('email', email)
      .single()

    if (!adminData) {
      return { authorized: false, response: NextResponse.json({ error: 'Forbidden - not an admin' }, { status: 403 }) }
    }

    return { authorized: true }
  } catch (error: any) {
    return { authorized: false, response: NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 500 }) }
  }
}

export function getSupabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    return null
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key)
}
