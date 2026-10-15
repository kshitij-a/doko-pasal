// ponytail: in-memory per-process map; multi-instance deployments need a shared store (e.g. Redis/Upstash).
const hits = new Map<string, number[]>()
const MAX_KEYS = 5000

export function getIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
}

export function check(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  // Evict oldest keys when over cap to bound memory.
  if (hits.size > MAX_KEYS) {
    let n = hits.size - MAX_KEYS
    for (const k of hits.keys()) {
      hits.delete(k)
      if (--n <= 0) break
    }
  }
  const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs)
  if (arr.length >= limit) {
    hits.set(ip, arr)
    return false
  }
  arr.push(now)
  hits.set(ip, arr)
  return true
}
