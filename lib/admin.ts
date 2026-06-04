import { supabase } from './supabase'

let adminCache: { email: string; isAdmin: boolean } | null = null

export async function checkAdminAccess(): Promise<{ isAdmin: boolean; email: string }> {
  if (adminCache) return adminCache

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    adminCache = { email: '', isAdmin: false }
    return adminCache
  }

  const { data: adminData } = await supabase.from('admins').select('email').eq('email', userData.user.email).single()

  adminCache = {
    email: userData.user.email || '',
    isAdmin: !!adminData,
  }

  return adminCache
}

export function clearAdminCache() {
  adminCache = null
}
