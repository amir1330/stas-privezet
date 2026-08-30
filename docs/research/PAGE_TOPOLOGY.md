# Page Topology — unicorngo.ru/men-home

Top-to-bottom section map for clone build.

| # | Section | Type | Notes |
|---|---------|------|-------|
| 1 | Header | sticky | Mobile: hamburger; Desktop: full nav |
| 2 | Hero + Search | static | Yellow radial gradient, h1, search pill, AI toggle (removed in clone) |
| 3 | Guarantee | text | Centered h3, 15px |
| 4 | Mega categories | horizontal scroll | 90px tiles, promo cards interleaved |
| 5 | Brands | horizontal scroll | White cards on `#f6f6f6` bg |
| 6 | Gender tabs | toggle | Мужчинам / Женщинам |
| 7 | Обувь | section | Title + Все, 2+3 category grid, 3 carousels |
| 8 | Актуальные подборки | CTA | Watch all button |
| 9 | Одежда | section | Masonry-style grid (desktop), carousels |
| 10 | Lookbook | promo | — |
| 11 | Аксессуары | section | Same pattern as footwear |
| 12 | Авторские подборки | curator | Influencer picks |
| 13 | Забрать сегодня | pickup | Moscow pickup |
| 14 | Gift cert | promo | — |
| 15 | Footer | links | Multi-column |

## Interaction model

- **Scroll-driven**: horizontal category/brand/product carousels (touch scroll, no snap)
- **Click-driven**: gender tabs, product cards, category tiles, menu
- **Sticky**: header with fade gradient

## Desktop vs mobile differences

- Header: full nav vs hamburger
- Section titles: 32px vs 22px
- Clothing grid: complex masonry desktop vs 2-col mobile
- Cart button: 56px vs 40px
