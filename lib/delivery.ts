export const FREE_DELIVERY_THRESHOLD = 2000
// Delivery charge is confirmed with the customer on contact before delivery.
export const DELIVERY_DISPLAY = 'On contact'

export function deliveryProgress(total: number): { remaining: number; widthPct: number } {
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - total)
  // Informational bar only — no free-shipping promise.
  return { remaining, widthPct: 100 }
}
