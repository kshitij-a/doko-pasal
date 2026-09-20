import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createServiceClient } from './lib/supabase-server'

export async function proxy(request: NextRequest) {
  try {
    const response = NextResponse.next({ request })
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookies) {
            cookies.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
    const service = createServiceClient()
    if (!service) return response
    const { data: admin } = await service.from('admins').select('email').eq('email', user.email).single()
    if (!admin) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return response
  } catch (e) {
    console.error('proxy admin gate error:', e)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}
