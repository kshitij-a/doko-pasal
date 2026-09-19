import { supabase } from './supabase'

// Client helper: attaches the user's Bearer token so the server-side
// verifyAdminAccess check can run. The actual admin check must run
// server-side — this helper grants nothing by itself.
export async function adminFetch(url: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token

  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
}
