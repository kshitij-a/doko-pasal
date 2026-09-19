import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Lightest possible guard for /admin/* without extra deps: if no Supabase
// auth cookie is present, send the user to login. Real authorization still
// happens server-side in each admin API via verifyAdminAccess.
export function middleware(req: NextRequest) {
  const hasSession = req.cookies
    .getAll()
    .some((c) => c.name.startsWith('sb-') && c.name.includes('auth-token'))
  if (!hasSession) {
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
  return NextResponse.next()
}

export const config = { matcher: ['/admin/:path*'] }
