const requiredServerVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
]

const requiredPaymentVars = [
  'KHALTI_SECRET_KEY',
  'ESEWA_MERCHANT_CODE',
  'ESEWA_SECRET_KEY',
]

export function validateEnv() {
  const missing: string[] = []

  for (const key of requiredServerVars) {
    if (!process.env[key]) missing.push(key)
  }

  if (missing.length > 0) {
    console.error(`[ENV ERROR] Missing required environment variables: ${missing.join(', ')}`)
    return false
  }

  return true
}

export function validatePaymentEnv(method: string): { valid: boolean; error?: string } {
  if (method === 'khalti' && !process.env.KHALTI_SECRET_KEY) {
    return { valid: false, error: 'Khalti payment is not configured. Missing KHALTI_SECRET_KEY.' }
  }
  if (method === 'esewa') {
    if (!process.env.ESEWA_MERCHANT_CODE) return { valid: false, error: 'eSewa payment is not configured. Missing ESEWA_MERCHANT_CODE.' }
    if (!process.env.ESEWA_SECRET_KEY) return { valid: false, error: 'eSewa payment is not configured. Missing ESEWA_SECRET_KEY.' }
  }
  return { valid: true }
}
