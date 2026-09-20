// ponytail: in-memory per-process map; multi-instance deployments need a shared store (e.g. Redis/Upstash).
const hits = new Map<string, number[]>()

export function getIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
}

export function check(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs)
  if (arr.length >= limit) {
    hits.set(ip, arr)
    return false
  }
  arr.push(now)
  hits.set(ip, arr)
  return true
}
