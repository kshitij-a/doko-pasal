# SEO Technical Spec — Doko Pasal (Scenario B, clothing)

## Rendering migration (read `node_modules/next/dist/docs/` first)
- `/`, `/products`, `/products/[id]`, `/about`, `/faq`, `/contact`, `/return-policy` → Server Components, Supabase service-role reads server-side.
- Keep client islands: cart state, search input, gallery, chat, forms.
- ISR: product pages `revalidate: 3600`; listing `revalidate: 300`.

## Metadata templates
- Product: `{name} – Buy Online in Nepal | Doko Pasal` / desc: `{name} at Rs. {price}. {category}. Free delivery over Rs. 2,000.`
- Listing: `{Category} Clothing Online Nepal | Doko Pasal`; static for cart/checkout/contact/orders.
- Canonical per page; OG images per product (`image_url`); `metadataBase` from `NEXT_PUBLIC_BASE_URL=https://birthdaysuprise.me` (fail build if unset in prod — see `lib/site.ts`).

## JSON-LD
- Layout: `Organization` (name, logo, sameAs socials) + `WebSite` with `SearchAction` (`/products?search={q}`).
- `[id]`: `Product` (`name`, `image`, `description`, `sku=id`, `brand=Doko Pasal`) + `Offer` (`priceCurrency:NPR`, `price`, `availability` from `stock>0`) + `AggregateRating` ONLY if ≥1 real review + `BreadcrumbList`.
- FAQ page: `FAQPage`. Validate via Google Rich Results Test.

## URLs / sitemap / robots
- Keep `/products?category=&sort=&sale=` (already indexed behavior); add category landing aliases later if needed. Variants canonicalized to parent product.
- Dynamic `sitemap.ts`: `/`, `/products`, all active product IDs (real `updated_at`), 4 info pages. Priorities: 1.0 / 0.9 / 0.7 / 0.5.
- `robots.ts`: keep disallow `/admin/ /api/ /auth/`.

## Bilingual: English-primary + Nepali accents (Daraz/Giftmandu pattern)
- No `ne-NP` routes in Phase 1. Nepali in display headings (`दोको पसल`), hero, festival campaign copy. Revisit hreflang only if Nepali-query traffic justifies it.

## Internal linking
- Listing ↔ product, related products, "trending searches" block (from real search logs), contextual FAQ links, category SEO intros (Gifteria pattern).

## Performance budgets
- LCP < 2.5s mobile, INP < 200ms, CLS < 0.1; Lighthouse ≥ 90 all four on home/listing/product/checkout.
- `next/image` (AVIF/WebP, explicit dimensions, lazy below fold), fonts via `next/font` (2 families), code-split admin.

## Analytics
- GA4 e-commerce: `view_item, add_to_cart, begin_checkout, purchase, refund` + Search Console. Keep internal `activity_logs` for ops.
