/** Browser: same-origin proxy (/api → backend). SSR: direct backend URL. */
export function getApiBase(): string {
  if (typeof window !== "undefined") {
    return "/api";
  }
  return process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
}

export const API = getApiBase();

export const LOCALES = ["ru", "en", "kk"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ru";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

const API_TIMEOUT_MS = 4000;

export type ProductListItem = {
  id: string;
  slug: string;
  title: string;
  brand: string | null;
  price_krw: number | null;
  price_original_krw?: number | null;
  is_in_stock: boolean | null;
  thumbnail_url: string | null;
  category_name?: string | null;
  category_slug?: string | null;
};

export type SearchResult = {
  items: ProductListItem[];
  total: number;
  offset: number;
  limit: number;
  query: string;
};

export async function apiFetch<T>(
  path: string,
  init?: RequestInit & { locale?: Locale },
): Promise<T> {
  const { locale, ...rest } = init ?? {};
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(rest.headers as Record<string, string> | undefined),
  };
  if (locale) {
    headers["Accept-Language"] = locale;
  }

  const base = getApiBase();
  const res = await fetch(`${base}${path}`, {
    ...rest,
    signal: rest.signal ?? AbortSignal.timeout(API_TIMEOUT_MS),
    credentials: "include",
    headers,
  });
  if (!res.ok) throw new Error(`API ${path}: ${res.status}`);
  return res.json();
}

export async function getProducts(params?: Record<string, string>, locale?: Locale) {
  const qs = params ? `?${new URLSearchParams(params)}` : "";
  return apiFetch<{ items: ProductListItem[]; next_cursor: string | null; total?: number }>(
    `/catalog/products${qs}`,
    { next: { revalidate: 30 }, locale },
  );
}

export async function searchProducts(q: string, params?: Record<string, string>, locale?: Locale) {
  const sp = new URLSearchParams({ q, ...params });
  return apiFetch<SearchResult>(`/catalog/search?${sp}`, { next: { revalidate: 15 }, locale });
}

export type ProductDetail = {
  id: string;
  slug: string;
  spu_id: number;
  title: string;
  brand: string | null;
  description: string | null;
  price_krw: number | null;
  price_original_krw: number | null;
  is_in_stock: boolean | null;
  category_name: string | null;
  category_slug: string | null;
  images: { cdn_url: string; width: number | null; height: number | null; source: string | null }[];
  variants: { id: string; size: string | null; price_krw: number | null; in_stock: boolean }[];
  specs: { key: string; value: string }[];
};

export async function getProduct(slug: string, locale?: Locale) {
  return apiFetch<ProductDetail>(`/catalog/products/${slug}`, { next: { revalidate: 60 }, locale });
}

export async function getCategories(locale?: Locale) {
  return apiFetch<{ id: string; name: string; slug: string }[]>("/catalog/categories", {
    next: { revalidate: 300 },
    locale,
  });
}

export async function getBrands(locale?: Locale) {
  return apiFetch<string[]>("/catalog/brands", { next: { revalidate: 300 }, locale });
}
