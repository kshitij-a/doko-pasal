import { supabase } from './supabase'

export async function logActivity(action: string, details?: Record<string, any>, page?: string) {
  try {
    // Identity is derived server-side from the Bearer token; only
    // action/page/details are sent from the client.
    const { data: { session } } = await supabase.auth.getSession()
    await fetch('/api/activity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      },
      body: JSON.stringify({
        action,
        details: details || null,
        page: page || (typeof window !== 'undefined' ? window.location.pathname : null),
      })
    })
  } catch (e) {
    // Silent fail - don't break user experience
  }
}
