import { supabase } from './supabase'

export async function logActivity(action: string, details?: Record<string, any>, page?: string) {
  try {
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user

    await fetch('/api/admin/activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: user?.id || null,
        user_email: user?.email || null,
        user_name: user?.user_metadata?.full_name || null,
        action,
        details: details || null,
        page: page || (typeof window !== 'undefined' ? window.location.pathname : null),
      })
    })
  } catch (e) {
    // Silent fail - don't break user experience
  }
}
