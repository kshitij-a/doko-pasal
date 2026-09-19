import { supabase } from './supabase'

// NOTE: no cache on purpose — always fetch fresh so a logout/login as a
// different user can never reuse the previous user's admin flag.
export async function checkAdminAccess(): Promise<{ isAdmin: boolean; email: string }> {
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return { email: '', isAdmin: false }
  }

  const { data: adminData } = await supabase.from('admins').select('email').eq('email', userData.user.email).single()

  return {
    email: userData.user.email || '',
    isAdmin: !!adminData,
  }
}

// Kept as no-op for backwards compat with existing callers.
export function clearAdminCache() {}
