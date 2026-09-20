# Bug Audit — verified against live code 2026-09-20 (Scenario B)

## Functional / layout
| # | Verdict | Severity | Location | Fix |
|---|---|---|---|---|
| 1 | CONFIRMED — View-Cart pill leaks to `/cart`, `/`, `/auth/*` | Medium | `components/MobileBottomBar.tsx:34`, `app/layout.tsx:45` | Add `/cart` + `/auth` to suppression guard |
| 2 | CONFIRMED (tight) — chat FAB collides when pill+nav stack; open window 520px overflows small phones | Low-Med | `components/ChatWidget.tsx:172,181,184-185` | `bottom-[136px]` on mobile or suppress on `/cart,/checkout` |
| 3 | CHANGED — inline + sticky ATC coexistence is intentional (`pb-16` clearance) | Low | `app/products/[id]/page.tsx:223,372-381,623-632` | Optional: IntersectionObserver hide |
| 4 | FIXED (weak UX) — size toast exists, no scroll/highlight | Low | `app/products/[id]/page.tsx:117-151,225-229` | scrollIntoView + error ring on size row |
| 5 | CONFIRMED — always-full "FREE delivery" bar vs Rs.2000 announcement; no fee anywhere | Medium | `app/cart/page.tsx:135-142,221-224`, `app/checkout/page.tsx:369`, `components/Navbar.tsx:111` | Single threshold constant; real progress bar |
| 6 | CONFIRMED — 401s from `logActivity` POST without auth on all public pages | Medium | `lib/activity.ts:8`, `app/api/admin/activity/route.ts:45-47` | Split public `POST /api/activity` (rate-limited) |
| 7 | CONFIRMED (partial) — toasts `z-[100]` under bars; pill missing safe-area | Low-Med | `app/cart/page.tsx:113`, `MobileBottomBar.tsx:55`, `app/globals.css:473-475` | Toasts to `z-[300]`; safe-area on pill |
| N1 | NEW High — cart upsell charges full `price` while showing sale price + forces `sizes[0]` | High | `app/cart/page.tsx:40-55` vs `:272` | Use effective price; require/confirm size |
| N2 | NEW High — order inserted BEFORE server validation; validation failure leaves orphan | High | `app/checkout/page.tsx:79-91` vs `:125-130` | Validate before insert or delete on failure |
| N3 | NEW Med — cart/wishlist badges stale in writing tab (`storage` event never fires locally) | Medium | `components/MobileBottomBar.tsx:16-29`, `components/Navbar.tsx:30-44` | `cart:update` custom event or context |
| N4 | NEW Low — `buyNow` toasts overwritten by instant navigation | Low | `app/products/[id]/page.tsx:117-151` | Silent flag + 400ms delay |

## SEO / rendering
| # | Verdict | Severity | Location | Fix |
|---|---|---|---|---|
| 8 | CONFIRMED — home/listing/detail/cart/checkout client + effect-fetched | Medium | `app/page.tsx:1,39-64` etc. | Server Components for `/`, `/products`, `/products/[id]` |
| 9 | CONFIRMED — only root + 3 info pages have metadata; zero `generateMetadata` | Medium | `app/layout.tsx:8` | Add metadata + `generateMetadata` on `[id]` |
| 10 | CONFIRMED absent — no JSON-LD | Low | grep 0 hits | Organization+WebSite in layout, Product in `[id]` |
| 11 | CONFIRMED thin — 2 URLs, hardcoded `2026-01-01` | Low | `app/sitemap.ts:5-12` | Dynamic sitemap with real `updated_at` |
| 12 | CHANGED (partial) — 4 files default `doko-pasal.vercel.app`, initiate defaults `localhost:3000` | Medium | `app/layout.tsx:6` + 4 files | Single `lib/site.ts getBaseUrl()` |
| 13 | CONFIRMED — ~30 raw `<img>`, remotePatterns Supabase-only | Low | `app/page.tsx:75-77,119`, `next.config.ts:8` | `next/image` + Unsplash pattern |
| 14 | CONFIRMED suboptimal — 1 blocking font link, 4 families | Low | `app/layout.tsx:39-41` | `next/font/google` |
| 15 | CONFIRMED — `script-src 'unsafe-inline'` | Medium | `next.config.ts:20-29` | Nonce/hash approach |
| 16 | CONFIRMED mixed — 3 routes still `.js` | Low | `api/send-email`, `api/payment/*` | Rename to `route.ts` |
| 17 | CONFIRMED minimal — internal log only | Low | `lib/activity.ts:3-23` | Vercel Analytics/Speed Insights or Sentry |
| 18 | CHANGED — stacking/expiry fixed; `used_count` double-count race remains | High | `app/api/validate-order/route.ts:85-87`, `app/api/payment/verify/route.js:23-27` | Idempotent redemption (conditional update) |
| 19 | FIXED (residual: no rate-limit) | Medium | `app/auth/forgot-password/page.tsx:20-24` | Per-IP rate limits on public POSTs |
| 20 | CHANGED — real URLs (`/dokopasal`), unverified ownership | Low | `app/page.tsx:365-367` | Verify in Business Manager |

## Security / race / a11y (new hunt)
| # | Severity | Location | Fix |
|---|---|---|---|
| N1-stock | High — `/api/decrement-stock` bare `orderId`, no auth, non-atomic | `app/api/decrement-stock/route.ts:15-24` | Session + ownership + atomic decrement |
| N2-mail | High — `/api/send-email` open relay via Resend | `app/api/send-email/route.js:14-24` | Session-vs-order check + rate limit |
| N3-gate | Medium — no `middleware.ts` (removed `d70800e`); admin pages client-gated only | `app/admin/layout.tsx:10-13`, glob empty | Server middleware session check |
| N4-oversell | Medium — read-then-write stock in verify + decrement-stock | `app/api/payment/verify/route.js:14-31` | Atomic `SET stock = stock - qty WHERE stock >= qty` / RPC |
| N5-a11y | Low — `<span onClick>` carousel, unlabeled dots, dialog no Escape | `app/products/page.tsx:28-31`, `app/page.tsx:109-110` | Real buttons + labels + focus trap |
