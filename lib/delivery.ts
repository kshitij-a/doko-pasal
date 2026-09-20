export const FREE_DELIVERY_THRESHOLD = 2000
export const DELIVERY_DISPLAY = 'FREE'

export function deliveryProgress(total: number): { remaining: number; widthPct: number } {
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - total)
  // Free delivery on all orders — bar always full.
  return { remaining, widthPct: 100 }
}
