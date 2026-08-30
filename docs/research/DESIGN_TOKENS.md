# Design Tokens — unicorngo.ru

Extracted via clone-website reconnaissance (2026-08-30, viewport 1440×900).

## Typography

| Token | Value |
|-------|-------|
| Body font | `"SF Pro Display", -apple-system, BlinkMacSystemFont, Roboto, sans-serif` |
| Body color | `#222222` (rgb(34,34,34)) |
| Body bg | `#ffffff` |
| Guarantee (h3) | 15px, center, margin 16px auto 24px |
| Section title (h2) | 32px desktop / 22px mobile, weight 800 |
| Hero title (h1) | clamp ~2rem–3.25rem mobile, condensed, weight 800 |

## Colors

| Token | Original unicorngo | Our override |
|-------|-------------------|--------------|
| Hero gradient | `radial-gradient(109.95% 50% at 50% 0%, #ffe0a2 0%, rgba(255,224,162,0) 100%)` | Keep original |
| Tile bg | `#efedec` | ✓ |
| Muted bg | `#f6f6f6` | ✓ |
| Cart button | `#ffa3ff` (56×56 desktop, 40×40 mobile) | `#7C3AED` per user |
| Sale link | `#ff385c` | ✓ |
| Buy button (sneaker) | `#304588` navy | `#5B21B6` purple-dark |
| Buy gradient (clothing) | pink→magenta | purple gradient |

## Spacing & radius

| Token | Value |
|-------|-------|
| Page padding | 15px |
| Tile radius | 20px |
| Search bar | height 56px, radius 999px, bg `#f6f6f6` |
| Brand card | white bg, ~10px radius |
| Gender tabs | 10px container radius, 8px tab radius |

## Header (desktop ≥1024px)

- Full horizontal nav: Каталог, Распродажа (red), Лукбук, Гарантия ▾, О нас ▾, Магазин в Москве, Доставка, Отзывы
- Right icons: profile, wishlist heart, cart circle
- Cart: 56×56px, border-radius 100%

## Header (mobile)

- Hamburger + search | UNICORN center | cart 40×40

## Product hero variants

### Sneaker
- Gray bg `#f3f2f1`
- Brand uppercase navy/purple above title
- Layered giant title **behind** cutout shoe (z-index layering)
- Heart top-right

### Clothing
- White bg, split layout desktop
- Title left, image right (no text overlap)
- Specs grid, size selector, gradient CTA bar
