# Design System — Doko Pasal (Scenario B: keep fashion palette)

Base: existing tokens in `app/globals.css:5-28` (`--color-bg:#FAF8F4`, `--color-text:#1E1A16`, `--color-brand:#B5293A`, `--color-brand-dark:#8C1E2A`, `--color-gold:#C9963A`, `--color-saffron:#E8892B`, soft/muted text, `--color-border:#E8E3DB`). Add for commerce signals:

```css
@theme inline {
  --color-teal: #0E7C7B;        /* COD/verified-delivery trust badges */
  --color-teal-bg: #E6F4F3;
  --color-sale: #B5293A;        /* reuse brand for SALE */
  --color-rating: #C9963A;      /* stars (gold) */
}
```
Tailwind v4 `@theme` mappings, ready to paste into `app/globals.css`. Contrast: brand-on-white 7.0:1, gold text only ≥18px/bold (4.0:1 → use `--color-gold-dark:#9A6B1F` for small text). Don'ts: no gradients on buttons, max two accents per view.

## Typography
- Display/headings **Cormorant Garamond** (brand voice, already used), body **Nunito**. Drop JetBrains Mono + Outfit from storefront (keep Mono in admin).
- Scale: H1 32/44, H2 26/34, H3 20/26, body 16, small 14, caption 12. Inputs never below 16px (iOS zoom).

## Components (states for each)
Buttons (primary/secondary/ghost/destructive; hover/active/focus-visible/disabled/loading), inputs/select/checkbox/radio (focus ring gold, error red + helper), filter pills (selected = brand tint `#FBE9EC`), product card (image 4:5, SALE badge, category eyebrow, title 2-line clamp, price + strikethrough + %off, rating, wishlist heart), stepper, stars, drawer/modal (focus trap, Escape), toast (`z-[300]`, `aria-live`), accordion (FAQ `<details>`), breadcrumbs, carousel (arrows + dots + swipe + labels), skeletons, empty states, sticky ATC bar (ONE per page, `env(safe-area-inset-bottom)`), chat FAB (clears bars), coupon field, tables (admin), date display (NPR timezone `lib/timezone.ts`).

## Layout / motion / a11y
- 8pt scale, max-w-6xl (1200px), mobile product grid 2-col, section rhythm 48/64.
- Radius: cards 16, pills full, buttons 12. Elevation tokens as existing.
- Motion 150-250ms ease-out, `prefers-reduced-motion` respected, no layout-shift animations.
- WCAG 2.2 AA: landmarks, alt text, visible focus, 44×44px targets, labeled fields, `aria-live` cart/toasts, 200% zoom safe.
