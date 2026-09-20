# PRD — Doko Pasal Clothing Store (Scenario B)

## 1. Executive summary / vision / metrics
Keep and professionalize Nepal's ethnic + casual clothing store. Success metrics: conversion rate, AOV, repeat rate, organic sessions, LCP < 2.5s, average rating, return rate.

## 2. Positioning (Scenario B)
Brand stays "Doko Pasal — Nepal's Favourite Clothing Store". Domain decision (separate memo): short-term keep `birthdaysuprise.me` with birthday-signal cleanup; mid-term move to clothing domain with 301s. Tone: warm, Nepali-proud, honest pricing.

## 3. Market & competitors (see `comparison-matrix.md`)
Direct: Daraz (price/format), SmartDoko (loyalty/trust), Sastodeal (assortment). Patterns borrowed from gift vertical: cutoff labels, coupon bar, SEO intros, guided finder. SWOT: authentic ethnic niche + COD trust vs Daraz price pressure; differentiation = fit accuracy (size guides), honest photography, 7-day exchanges.

## 4. Personas
Local buyer (Kathmandu/Pokhara, COD), value buyer (price filters, coupons), festive bulk buyer (Dashain/Tihar), admin/operator (fulfillment, support chat).

## 5. Journeys & stories (acceptance criteria each)
Discover/browse (category, search, filters), product (gallery, size guide, reviews), cart (threshold bar, upsell), checkout (delivery → payment → confirm; COD/Khalti/eSewa/bank), tracking (`/track-order` + `/orders`), auth, profile/wishlist, reviews, returns (new `return_requests` flow), support chat, admin (catalog, orders + status machine, coupons, banners, messages, analytics).

## 6. Page requirements
Home (hero, categories, bestsellers, trust, testimonials), listing (search, price/stock/size filters, sort), detail (gallery, %off, histogram, recently viewed, sticky ATC), cart, 3-step checkout, confirmation, orders/track, auth ×4, profile, wishlist, about/contact/faq/return-policy/track-order, payment verify/failed, full admin (11 pages).

## 7. Backlog (MoSCoW → roadmap.md)
Must: bug-audit highs (N1 upsell price, N2 orphan orders, #18 coupon race, N1-stock/N2-mail auth, N3 middleware, #5 delivery truth). Should: SSR/metadata/JSON-LD/sitemap, filters polish, size guide, histogram. Could: loyalty, multi-currency display. Won't (Phase 0): marketplace sellers, app.

## 8. NFRs
Budgets (seo-technical-spec), availability, security (RLS verified, CSP, no card storage), WCAG 2.2 AA, Chrome/Safari mobile + desktop.

## 9. Analytics
GA4 e-commerce events + Search Console + funnel; admin KPIs stay in-app.

## 10. Assumptions / risks / ops
Assumes live Khalti/eSewa keys, real bank details, courier with zone pricing, packaging; risks: Daraz undercutting, COD fraud, size returns. Open: domain move date, free-shipping threshold (2000 vs all-free), guest checkout.
