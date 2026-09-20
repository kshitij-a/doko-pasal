# Roadmap — ticket-level backlog (Scenario B)

## Phase 1 — Trust & correctness (this order)
1. `FIX-01` Bar leak: suppress pill on `/cart,/auth` (`MobileBottomBar.tsx:34`). S.
2. `FIX-02` Delivery truth: threshold constant + real progress bar (`cart`, `checkout`, `Navbar:111`). M.
3. `FIX-03` Upsell price/size (`cart/page.tsx:40-55`). S.
4. `FIX-04` Validate-before-insert or orphan delete (`checkout/page.tsx:79-130`). M.
5. `FIX-05` Coupon idempotency via `coupon_redemptions` (data-model M3). M.
6. `FIX-06` Auth `/api/decrement-stock` + `/api/send-email` (session/ownership/rate-limit). M.
7. `FIX-07` Server `middleware.ts` admin session check. S.
8. `FIX-08` Atomic stock RPC (data-model M4) in verify + decrement-stock. M.
9. `FIX-09` Split public activity POST (`lib/activity.ts`, admin route). S.
10. `FIX-10` Toast z-index/safe-area + badge sync (`cart:update` event). S.
11. `FIX-11` Dialog/a11y pass (carousel buttons, dots labels, FAQ not applicable). S.

## Phase 2 — SEO & discovery
12. Server Components for `/`, `/products`, `/products/[id]` + ISR.
13. `generateMetadata` + static metadata everywhere; `lib/site.ts` base URL.
14. JSON-LD (Organization/WebSite/Product/FAQ) + Rich Results Test.
15. Dynamic sitemap + robots verify.
16. `next/image` migration + Unsplash remotePattern; `next/font` (2 families).
17. Category SEO intros + trending-search block; standardize `Rs.` formatting.
18. Flash-sale block with countdown + discount-% badges (Daraz pattern).

## Phase 3 — Commerce depth
19. Delivery zones table + checkout zone selector + COD rules (data-model M1).
20. Returns flow: customer request + admin approve + restock (M2).
21. Reviews photos/helpful votes; Q&A-lite on PDP.
22. Loyalty points (SmartDoko pattern); referral codes.
23. Guided finder (CakeZake pattern: Need × Category × Size).

## Phase 4 — Launch readiness
24. Terms/Privacy/Shipping pages; compliance checklist sign-off.
25. GA4 + Search Console + uptime/error monitoring; rate limits everywhere.
26. Real product photography swap; social verification; GBP.
27. Lighthouse ≥ 90 ×4 pages; DoD gates 1–10 (master prompt §12, minus gift-specific items); go/no-go report.

Effort: S < 0.5d, M 1–3d. DoD per ticket: build+lint clean, 390px+1366px browser check, evidence screenshot.
