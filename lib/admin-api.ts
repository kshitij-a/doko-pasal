import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    const { data: adminData } = await supabase
      .from('admins')
      .select('email')
      .eq('email', user.email)
      .single()

    if (!adminData) {
      return { authorized: false, response: NextResponse.json({ error: 'Forbidden - not an admin' }, { status: 403 }) }
    }

    return { authorized: true }
  } catch (error: any) {
    return { authorized: false, response: NextResponse.json({ error: 'Auth verification failed: ' + (error.message || 'Unknown error') }, { status: 500 }) }
  }
}

export function getSupabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    return null
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key)
}
