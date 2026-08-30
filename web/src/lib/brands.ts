/** Maps Korean / mixed brand strings from Poizon imports to canonical English keys. */
const BRAND_ALIASES: Record<string, string> = {
  나이키: "Nike",
  nike: "Nike",
  아디다스: "Adidas",
  adidas: "Adidas",
  "뉴발란스": "New Balance",
  "new balance": "New Balance",
  조던: "Jordan",
  jordan: "Jordan",
  "air jordan": "Jordan",
  아식스: "Asics",
  asics: "Asics",
  푸마: "Puma",
  puma: "Puma",
  컨버스: "Converse",
  converse: "Converse",
  반스: "Vans",
  vans: "Vans",
};

/** Returns canonical Latin brand name for UI display and logo lookup. */
export function displayBrandName(brand: string | null | undefined): string | null {
  if (!brand) return null;
  const trimmed = brand.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  if (BRAND_ALIASES[lower]) return BRAND_ALIASES[lower];
  if (BRAND_ALIASES[trimmed]) return BRAND_ALIASES[trimmed];

  for (const [alias, canonical] of Object.entries(BRAND_ALIASES)) {
    if (lower.includes(alias.toLowerCase())) return canonical;
  }

  return trimmed;
}

/** @deprecated Use displayBrandName */
export const normalizeBrandName = displayBrandName;

export function brandsMatch(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean {
  const na = displayBrandName(a);
  const nb = displayBrandName(b);
  if (!na || !nb) return false;
  return na.toLowerCase() === nb.toLowerCase();
}

/** Brand string safe for catalog/search query params. */
export function brandQueryValue(brand: string | null | undefined): string | null {
  return displayBrandName(brand);
}
