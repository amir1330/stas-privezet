import type { ProductListItem } from "@/lib/api";

export type TileDefinition = {
  id: string;
  label: string;
  keywords: string[];
  categorySlugs?: string[];
  href?: string;
};

/** Keyword sets for matching product thumbnails to category tiles. */
export const TILE_DEFINITIONS: Record<string, TileDefinition[]> = {
  footwear: [
    { id: "sneakers", label: "Кроссовки и кеды", keywords: ["кросс", "кед", "sneaker", "dunk", "jordan", "yeezy", "runner", "trainer", "air max", "boost"] },
    { id: "sport", label: "Обувь для спорта", keywords: ["sport", "running", "бег", "training", "спорт"] },
    { id: "custom", label: "Кастомные кроссовки", keywords: ["custom", "кастом"] },
    { id: "boots", label: "Ботинки", keywords: ["boot", "ботин", "timberland", "dr martens"] },
    { id: "slippers", label: "Тапки", keywords: ["slipper", "тапк", "crocs", "сандал", "slide"] },
    { id: "high_boots", label: "Сапоги", keywords: ["сапог", "high boot", "ugg"] },
  ],
  clothing: [
    { id: "outerwear", label: "Верхняя одежда", keywords: ["куртк", "пальто", "outerwear", "jacket", "coat", "пухов", "ветров"] },
    { id: "tees", label: "Футболки", keywords: ["футбол", "tee", "t-shirt", "tshirt"] },
    { id: "sweatshirts", label: "Свитшоты", keywords: ["свитшот", "sweatshirt", "crewneck"] },
    { id: "hoodies", label: "Худи", keywords: ["худи", "hoodie", "hooded"] },
    { id: "hats", label: "Кепки и шапки", keywords: ["кепк", "шапк", "cap", "beanie", "hat", "панам"] },
    { id: "jeans", label: "Джинсы", keywords: ["джинс", "jeans", "denim pant"] },
  ],
  clothing_extra: [
    { id: "longsleeve", label: "Лонгсливы", keywords: ["лонгслив", "longsleeve", "long sleeve"] },
    { id: "shirts", label: "Рубашки", keywords: ["рубаш", "shirt", "oxford"] },
    { id: "polo", label: "Поло", keywords: ["polo", "поло"] },
    { id: "shorts", label: "Шорты", keywords: ["шорт", "shorts"] },
    { id: "tanks", label: "Майки", keywords: ["майк", "tank top", "top"] },
    { id: "sportswear", label: "Спортивная одежда", keywords: ["спортивн", "tracksuit", "sportswear"] },
    { id: "socks", label: "Носки", keywords: ["носк", "sock"] },
    { id: "underwear", label: "Трусы", keywords: ["трус", "underwear", "boxer"] },
    { id: "leather_jackets", label: "Кожаные куртки", keywords: ["кожан", "leather jacket"] },
    { id: "denim_jackets", label: "Джинсовые куртки", keywords: ["джинсов", "denim jacket"] },
    { id: "windbreakers", label: "Ветровки", keywords: ["ветров", "windbreaker", "wind runner"] },
    { id: "panama", label: "Панамы", keywords: ["панам", "bucket hat"] },
  ],
  accessories: [
    { id: "bags", label: "Сумки и рюкзаки", keywords: ["сумк", "рюкзак", "bag", "backpack", "tote", "crossbody", "shoulder bag", "handbag"] },
    { id: "watches", label: "Часы", keywords: ["час", "watch", "rolex", "casio"] },
    { id: "glasses", label: "Очки", keywords: ["очк", "glasses", "sunglasses", "eyewear"] },
    { id: "wallets", label: "Кошельки", keywords: ["кошел", "wallet", "card holder"] },
    { id: "cardholders", label: "Карточницы", keywords: ["карточ", "card case", "cardholder"] },
  ],
  accessories_extra: [
    { id: "crossbody", label: "Сумки через плечо", keywords: ["crossbody", "через плечо", "messenger"] },
    { id: "briefcases", label: "Портфели", keywords: ["портфел", "briefcase"] },
    { id: "gym_bags", label: "Спортивные сумки", keywords: ["gym bag", "duffle", "sport bag"] },
    { id: "scarves", label: "Шарфы", keywords: ["шарф", "scarf"] },
    { id: "belts", label: "Ремни", keywords: ["ремен", "belt"] },
    { id: "jewelry", label: "Украшения", keywords: ["украшен", "jewelry", "necklace", "bracelet", "ring"] },
    { id: "misc_acc", label: "Разные аксессуары", keywords: ["аксессуар", "accessory"] },
  ],
  mega: [
    { id: "sneakers_mega", label: "Кроссы и Кеды", keywords: ["кросс", "кед", "sneaker", "shoe"] },
    { id: "clothing_mega", label: "Одежда", keywords: ["куртк", "футбол", "худи", "hoodie", "jacket", "shirt", "pants"] },
    { id: "slippers_mega", label: "Тапочки и Кроксы", keywords: ["crocs", "slide", "сандал", "тапк", "slipper"] },
    { id: "boots_mega", label: "Ботинки и Лоферы", keywords: ["boot", "loafer", "ботин", "лофер"] },
    { id: "women_bags", label: "Женские сумочки", keywords: ["handbag", "сумк", "tote", "bag"] },
    { id: "men_bags", label: "Мужские сумки", keywords: ["backpack", "рюкзак", "messenger", "crossbody"] },
    { id: "cosmetics", label: "Косметика", keywords: ["cosmetic", "космет", "perfume", "cream", "makeup"] },
    { id: "watches_mega", label: "Часы", keywords: ["watch", "час"] },
    { id: "glasses_mega", label: "Очки", keywords: ["glasses", "очк", "sunglasses"] },
    { id: "gifts", label: "Подарки", keywords: ["gift", "подар"] },
    { id: "toys", label: "Игрушки", keywords: ["toy", "lego", "игруш"] },
    { id: "home", label: "Для дома", keywords: ["home", "дом", "decor", "furniture"] },
  ],
};

function haystack(p: ProductListItem): string {
  return `${p.title} ${p.category_name ?? ""} ${p.category_slug ?? ""}`.toLowerCase();
}

function scoreProduct(p: ProductListItem, keywords: string[]): number {
  if (!p.thumbnail_url) return -1;
  const text = haystack(p);
  let score = 0;
  for (const kw of keywords) {
    if (text.includes(kw.toLowerCase())) score += 10;
  }
  return score;
}

export function pickThumbnail(
  products: ProductListItem[],
  tile: TileDefinition,
  categoryThumbs?: Record<string, string>,
  manualUrl?: string | null,
): string | null {
  if (manualUrl) return manualUrl;

  if (tile.categorySlugs && categoryThumbs) {
    for (const slug of tile.categorySlugs) {
      const url = categoryThumbs[slug];
      if (url) return url;
    }
  }

  let best: ProductListItem | null = null;
  let bestScore = 0;
  for (const p of products) {
    const s = scoreProduct(p, tile.keywords);
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  if (best?.thumbnail_url) return best.thumbnail_url;

  // Fallback: any product with thumbnail
  return products.find((p) => p.thumbnail_url)?.thumbnail_url ?? null;
}

export function buildCategoryTiles(
  definitions: TileDefinition[],
  products: ProductListItem[],
  defaultHref: string,
  categoryThumbs?: Record<string, string>,
  overrides?: Record<string, { imageUrl?: string | null; categorySlug?: string | null }>,
) {
  return definitions.map((def) => {
    const override = overrides?.[def.id];
    const keywordHref =
      def.keywords[0] != null
        ? `/catalog?q=${encodeURIComponent(def.keywords[0])}`
        : defaultHref;
    const tile: TileDefinition & { href: string; thumb: string | null } = {
      ...def,
      href:
        def.href ??
        (override?.categorySlug
          ? `/catalog?category=${override.categorySlug}`
          : keywordHref),
      thumb: pickThumbnail(
        products,
        {
          ...def,
          categorySlugs: override?.categorySlug ? [override.categorySlug] : def.categorySlugs,
        },
        categoryThumbs,
        override?.imageUrl,
      ),
    };
    return tile;
  });
}

export type ProductHeroVariant = "sneaker" | "clothing";

const FOOTWEAR_PATTERN =
  /кросс|кед|sneaker|shoe|boot|обув|footwear|тапк|сапог|лофер|sandal|trainer|dunk|jordan|yeezy|crocs|slide|runner|air max|new balance \d/i;

export function getProductHeroVariant(
  title: string,
  categoryName: string | null,
  categorySlug?: string | null,
): ProductHeroVariant {
  const hay = `${title} ${categoryName ?? ""} ${categorySlug ?? ""}`;
  return FOOTWEAR_PATTERN.test(hay) ? "sneaker" : "clothing";
}

export function tileOverridesMap(
  overrides: { id: string; image_url?: string | null; category_slug?: string | null }[],
): Record<string, { imageUrl?: string | null; categorySlug?: string | null }> {
  const map: Record<string, { imageUrl?: string | null; categorySlug?: string | null }> = {};
  for (const o of overrides) {
    map[o.id] = { imageUrl: o.image_url, categorySlug: o.category_slug };
  }
  return map;
}
