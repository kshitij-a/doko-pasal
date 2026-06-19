export const NP_TZ = 'Asia/Kathmandu'

function parseUTC(dateStr: string): Date {
  if (!dateStr) return new Date(NaN)
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return d
  const hasTimezone = /[Zz]|[+-]\d{2}(:\d{2})?$/.test(dateStr.trim())
  if (!hasTimezone) {
    return new Date(dateStr + 'Z')
  }
  return d
}

export function npDate(dateStr: string | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!dateStr) return ''
  const d = parseUTC(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { timeZone: NP_TZ, ...options })
}

export function npTime(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const d = parseUTC(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-US', { timeZone: NP_TZ, hour: '2-digit', minute: '2-digit', hour12: true })
}

export function npDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const d = parseUTC(dateStr)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleString('en-US', { timeZone: NP_TZ, month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
}

export function npRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const d = parseUTC(dateStr)
  if (isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return npDate(dateStr, { month: 'short', day: 'numeric' })
}

export function npShortDate(dateStr: string | null | undefined): string {
  return npDate(dateStr, { month: 'short', day: 'numeric' })
}

export function npFullDate(dateStr: string | null | undefined): string {
  return npDate(dateStr, { day: 'numeric', month: 'short', year: 'numeric' })
}

export { parseUTC }
