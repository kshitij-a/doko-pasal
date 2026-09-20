// Central site constants. Single source for base URL / name / currency.
export const SITE_NAME = 'Doko Pasal';
export const CURRENCY = 'NPR';
export const FALLBACK_BASE_URL = 'https://birthdaysuprise.me';

// ponytail: warn + safe fallback instead of throwing so builds never break on missing env.
export function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[site] NEXT_PUBLIC_BASE_URL missing in production, falling back to ' + FALLBACK_BASE_URL);
    }
    return FALLBACK_BASE_URL;
  }
  try {
    const url = new URL(raw);
    return url.toString().replace(/\/$/, '');
  } catch {
    console.warn('[site] Invalid NEXT_PUBLIC_BASE_URL, falling back to ' + FALLBACK_BASE_URL);
    return FALLBACK_BASE_URL;
  }
}
