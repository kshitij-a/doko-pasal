# Competitive Comparison Matrix — Scenario B (keep Doko Pasal clothing)

Method: live visits 2026-09-20, desktop 1366×900 + mobile 390×844 windows, screenshots in `docs/screenshots/`.
Limits (TO-VERIFY): PDP/cart/checkout depth captured for Giftmandu only; other sites homepage + category evidence; mobile renders for Giftmandu + Daraz; speeds are observed, not Lighthouse-measured.

## 1. Giftmandu (giftmandu.com) — conversion-pattern source
- Positioning: "Nepal's favourite gift shop, delivering since 2010". Trust via longevity.
- Delivery: 2-hour express (Ring Road), same-day Valley with live cutoff countdown "Order closing in 08:12:17", red "order by 4pm" pill, "Need it in 2 hours?" upsell.
- IA: Shop by Occasion pills (Birthday, Anniversary, Corporate, Personalized, Flowers, Surprise!), sub-pills (Cakes, Flowers, Combos, Personalized, Photo Cakes), price-bucket filters (Under Rs1000…).
- Promo: coupon bar, code SURPRISEME. SEO intro paragraph on category pages. URLs: `/occasions/birthday/`, OpenCart `.html` product URLs, `cart.php/login.php`.
- **Copy/adapt:** cutoff countdown, express upsell, coupon bar, SEO intro paragraphs, occasion pills → adapt as "Shop by Need" (Festive, Wedding, Winter, Sale).

## 2. Koseli Xpress (koselixpress.com) — coverage proof
- Same-day 200+ locations listed by name (Kathmandu, Pokhara, Chitwan, Biratnagar, Dharan…). Diaspora-abroad funnel, 4-step ordering, Visa/Mastercard/eSewa/Khalti.
- Prices plain numbers (7,100). **Copy:** location list as delivery-zone table + diaspora messaging.

## 3. Daraz Nepal (daraz.com.np) — DIRECT benchmark (catalog, pricing, bilingual)
- Orange `#F57224`, search-dominant header, app-download banner, Flash Sale with countdown + sold counts, strikethrough + `-65%` badges, bilingual (Nepali display + English product titles), category icon grid, trending searches.
- **Copy:** discount-% badges, flash-sale block with countdown, bilingual headings, sticky mobile Buy Now, ratings-distribution bars, spec tables.

## 4. SmartDoko (smartdoko.com) — loyalty + trust
- "MY DOKO" cart, reward points per product ("Earning Points 15.19"), PROMPT DELIVERY / REWARD POINTS / GENUINE PRODUCTS / MODE OF PAYMENT trust strip, flash sales with "Ends in 04 day(s)", rated-star counts.
- **Copy:** loyalty points, trust strip, per-product points label.

## 5. Thulo (thulo.com) — dead as marketplace
- Domain now sells SME business software. Drop as benchmark; replace with Sastodeal for Phase 1.

## 6. OkDam (okdam.com) — unreachable
- Empty response on visit. Drop; replace with Sastodeal.

## 7. CakeZake (cakezake.com) — finder UX
- Location gate (country/city modal before shopping), Gift Finder (Occasion × Type × Relationship), 4.8/5 badge, phone number in header, NPR 5,000 free-shipping threshold.
- **Copy:** guided finder (adapt: Occasion × Category × Size), location-aware delivery promise, visible phone support.

## 8. Gifteria (gifteria.com.np) — category SEO
- Deep category tree (Flowers/Basket/Bouquets/Combos/Heart Shaped/Plants…), English-primary, long SEO intro ("premier online gift store in Kathmandu").
- **Copy:** deep category landing pages with SEO intros.

## 9. VoloNepal (volonepal.com) — diaspora forex
- Currency selector AUD/USD/GBP/CAD/EUR, "send gifts from anywhere in the world" messaging, wishlist hearts on cards.
- **Copy:** multi-currency display (if diaspora buyers targeted).

## 10. Moonpig US (moonpig.com/us/birthday) — personalization flow
- "Create in minutes" 3-step explainer, recipient-segmented cards (Her/Him/Kids), photo-mug personalization, delivery-date choice, drafts.
- **Copy:** 3-step explainer pattern for size-guide/returns; recipient segmentation → adapt as Shop by Family Member.

## 11. Funky Pigeon (funkypigeon.com) — promo mechanics
- Multi-buy ("3 for £8"), 50% off nav badges, same-day dispatch cutoffs, deep card taxonomy.
- **Copy:** bundle offers (e.g. "Tee + cap combo"), nav promo badges.

## Gap column: what Doko Pasal must copy/adapt/beat
| Gap | Source | Ticket |
|---|---|---|
| Discount-% badges + flash sale w/ countdown | Daraz | Phase 2 |
| Real free-delivery threshold bar (Rs. 2,000) | self-fix + Daraz pattern | Phase 1 |
| Cutoff/express delivery labels | Giftmandu | Phase 2 |
| Loyalty points | SmartDoko | Phase 3 |
| Guided finder + location-aware promise | CakeZake | Phase 2 |
| SEO category intros + deep landing pages | Gifteria | Phase 1 |
| Multi-currency display | VoloNepal | Phase 3 (if diaspora) |
| Coupon bar + codes | Giftmandu | exists, needs races fixed |
| Currency/price formatting consistency (Rs. vs plain) | Koseli/Daraz | Phase 1 (standardize `Rs.`) |
