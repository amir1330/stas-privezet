import Link from "next/link";
import type { ProductListItem } from "@/lib/api";
import { TILE_DEFINITIONS, buildCategoryTiles, tileOverridesMap } from "@/lib/category-images";
import { DEFAULT_PROMO_TILES, type SiteConfig } from "@/lib/site-config";
import { Reveal } from "@/components/Reveal";

type CategoryItem = {
  label: string;
  count?: string;
  unit?: string;
  href: string;
  thumb?: string | null;
  promo?: boolean;
  promoSub?: string;
  promoColor?: string;
};

const MEGA_COUNTS: Record<string, { count: string; unit: string }> = {
  "Кроссы и Кеды": { count: "23 000", unit: "пар" },
  Одежда: { count: "48 000", unit: "штук" },
  "Тапочки и Кроксы": { count: "10 000", unit: "пар" },
  "Ботинки и Лоферы": { count: "20 000", unit: "пар" },
  "Женские сумочки": { count: "29 000", unit: "вариантов" },
  "Мужские сумки": { count: "14 000", unit: "вариантов" },
  Косметика: { count: "87 000", unit: "тюбиков" },
  Часы: { count: "12 000", unit: "вариантов" },
  Очки: { count: "25 000", unit: "вариантов" },
  Подарки: { count: "40 000", unit: "товаров" },
  Игрушки: { count: "98 000 000", unit: "кубиков лего" },
  "Для дома": { count: "10 000", unit: "диванов" },
};

export function MegaCategoryGrid({
  products,
  categoryThumbs,
  siteConfig,
}: {
  products: ProductListItem[];
  categoryThumbs: Record<string, string>;
  siteConfig: SiteConfig;
}) {
  const overrides = tileOverridesMap(siteConfig.tile_overrides);
  const matched = buildCategoryTiles(
    TILE_DEFINITIONS.mega,
    products,
    "/catalog",
    categoryThumbs,
    overrides,
  );

  const promos = (siteConfig.promo_tiles?.length ? siteConfig.promo_tiles : DEFAULT_PROMO_TILES)
    .filter((p) => p.enabled)
    .sort((a, b) => a.order - b.order);

  const categoryItems: CategoryItem[] = matched.map((m) => ({
    label: m.label,
    href: m.href,
    thumb: m.thumb,
    ...MEGA_COUNTS[m.label],
  }));

  const items: CategoryItem[] = [];
  if (promos[0]) {
    items.push({
      label: promos[0].label,
      promo: true,
      promoSub: promos[0].sublabel ?? undefined,
      promoColor: promos[0].color,
      href: promos[0].href,
    });
  }
  items.push(...categoryItems.slice(0, 3));
  if (promos[1]) {
    items.push({
      label: promos[1].label,
      promo: true,
      promoSub: promos[1].sublabel ?? undefined,
      promoColor: promos[1].color,
      href: promos[1].href,
    });
  }
  items.push(...categoryItems.slice(3, 8), ...categoryItems.slice(8));
  for (const promo of promos.slice(2)) {
    items.push({
      label: promo.label,
      promo: true,
      promoSub: promo.sublabel ?? undefined,
      promoColor: promo.color,
      href: promo.href,
    });
  }

  return (
    <Reveal>
      <section className="pb-4">
        <div className="category-scroll flex gap-3 overflow-x-auto px-[15px]">
          {items.map((item) => (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className="group tile-hover flex w-[90px] shrink-0 flex-col items-center text-center"
            >
              {item.promo ? (
                <div
                  className="anim-promo-tile flex h-[90px] w-[90px] flex-col items-center justify-center rounded-[16px] p-2 text-white"
                  style={{ background: item.promoColor ?? "#222" }}
                >
                  {item.promoSub && (
                    <span className="text-[9px] leading-tight opacity-90">{item.promoSub}</span>
                  )}
                  <span className="mt-1 text-[11px] font-bold leading-tight">{item.label}</span>
                </div>
              ) : (
                <>
                  <div className="relative flex h-[90px] w-[90px] items-end justify-center">
                    {item.thumb && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumb}
                        alt=""
                        className="anim-mega-image max-h-[80px] w-auto max-w-[90px] object-contain"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <span className="mt-1 text-[11px] font-bold leading-tight text-black">{item.label}</span>
                  {item.count && (
                    <span className="text-[10px] text-[#717171]">
                      {item.count} {item.unit}
                    </span>
                  )}
                </>
              )}
            </Link>
          ))}
        </div>
      </section>
    </Reveal>
  );
}
