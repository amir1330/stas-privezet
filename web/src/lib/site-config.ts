import { apiFetch } from "@/lib/api";

export type ThemeConfig = {
  accent: string;
  accent_dark: string;
  accent_light: string;
  cart_button: string;
  hero_yellow: string;
};

export type HomepageSection = {
  id: string;
  type: string;
  enabled: boolean;
  order: number;
  title?: string | null;
};

export type TileOverride = {
  id: string;
  label: string;
  image_url?: string | null;
  category_slug?: string | null;
  keywords?: string[];
};

export type PromoTile = {
  id: string;
  label: string;
  sublabel?: string | null;
  color: string;
  href: string;
  enabled: boolean;
  order: number;
};

export type PricingConfig = {
  default_markup_percent: number;
  site_discount_percent: number;
};

export type SiteConfig = {
  theme: ThemeConfig;
  sections: HomepageSection[];
  tile_overrides: TileOverride[];
  promo_tiles: PromoTile[];
  pricing: PricingConfig;
  remove_bg_default: boolean;
};

export const DEFAULT_PROMO_TILES: PromoTile[] = [
  {
    id: "garage_sale",
    label: "Garage Sale",
    sublabel: "С 24 по 31 августа",
    color: "#ff385c",
    href: "/catalog",
    enabled: true,
    order: 0,
  },
  {
    id: "discount",
    label: "Забери скидку",
    sublabel: "до 31 августа",
    color: "#7c3aed",
    href: "/catalog",
    enabled: true,
    order: 1,
  },
  {
    id: "app",
    label: "Скачай приложение",
    sublabel: "Получи скидку",
    color: "#222222",
    href: "/catalog",
    enabled: false,
    order: 2,
  },
  {
    id: "photo_search",
    label: "Найди товар по фотке",
    sublabel: "Байер сервис",
    color: "#222222",
    href: "/search",
    enabled: false,
    order: 3,
  },
];

export const DEFAULT_SECTIONS: HomepageSection[] = [
  { id: "hero", type: "hero", enabled: true, order: 0 },
  { id: "guarantee", type: "guarantee", enabled: true, order: 1 },
  { id: "mega_categories", type: "mega_categories", enabled: true, order: 2 },
  { id: "brands", type: "brands", enabled: true, order: 3 },
  { id: "gender_tabs", type: "gender_tabs", enabled: true, order: 4 },
  { id: "footwear", type: "footwear", enabled: true, order: 5 },
  { id: "clothing", type: "clothing", enabled: true, order: 6 },
  { id: "lookbook", type: "lookbook", enabled: false, order: 7 },
  { id: "accessories", type: "accessories", enabled: true, order: 8 },
  { id: "curated", type: "curated", enabled: false, order: 9 },
  { id: "pickup", type: "pickup", enabled: false, order: 10 },
  { id: "gift_cert", type: "gift_cert", enabled: false, order: 11 },
];

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  theme: {
    accent: "#7C3AED",
    accent_dark: "#5B21B6",
    accent_light: "#EDE9FE",
    cart_button: "#7C3AED",
    hero_yellow: "#EDE9FE",
  },
  sections: DEFAULT_SECTIONS,
  tile_overrides: [],
  promo_tiles: DEFAULT_PROMO_TILES,
  pricing: { default_markup_percent: 0, site_discount_percent: 0 },
  remove_bg_default: true,
};

export const SECTION_LABELS: Record<string, string> = {
  hero: "Главный баннер",
  guarantee: "Гарантия",
  mega_categories: "Категории (горизонт)",
  brands: "Бренды",
  gender_tabs: "Пол",
  footwear: "Обувь",
  clothing: "Одежда",
  lookbook: "Лукбук",
  accessories: "Аксессуары",
  curated: "Подборки",
  pickup: "Забрать сегодня",
  gift_cert: "Подарочный сертификат",
};

export async function getSiteConfig(): Promise<SiteConfig> {
  try {
    const data = await apiFetch<SiteConfig>("/site/config", { next: { revalidate: 30 } });
    return {
      ...DEFAULT_SITE_CONFIG,
      ...data,
      theme: { ...DEFAULT_SITE_CONFIG.theme, ...data.theme },
      promo_tiles: data.promo_tiles?.length ? data.promo_tiles : DEFAULT_PROMO_TILES,
      pricing: data.pricing ?? DEFAULT_SITE_CONFIG.pricing,
    };
  } catch {
    return DEFAULT_SITE_CONFIG;
  }
}

export async function getCategoryThumbnails(): Promise<Record<string, string>> {
  try {
    return await apiFetch<Record<string, string>>("/catalog/category-thumbnails", {
      next: { revalidate: 120 },
    });
  } catch {
    return {};
  }
}

export function sortedSections(config: SiteConfig): HomepageSection[] {
  return [...config.sections]
    .filter((s) => s.enabled)
    .sort((a, b) => a.order - b.order);
}

export function themeCssVars(theme: ThemeConfig): Record<string, string> {
  return {
    "--color-accent": theme.accent,
    "--color-accent-dark": theme.accent_dark,
    "--color-accent-light": theme.accent_light,
    "--color-cart-pink": theme.cart_button,
    "--color-hero-yellow": theme.hero_yellow,
    "--color-navy": theme.accent_dark,
  };
}
