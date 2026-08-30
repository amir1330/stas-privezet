import type { ProductListItem } from "@/lib/api";
import {
  TILE_DEFINITIONS,
  buildCategoryTiles,
  tileOverridesMap,
} from "@/lib/category-images";
import type { SiteConfig } from "@/lib/site-config";
import { CategoryGrid } from "@/components/CategoryGrid";
import { ProductCarousel } from "@/components/ProductCarousel";
import { Reveal } from "@/components/Reveal";
import { SeeAllButton } from "@/components/SeeAllButton";
import { SubcategoryRow } from "@/components/SubcategoryRow";
import { WatchAllButton } from "@/components/WatchAllButton";

function SectionBlock({
  title,
  href,
  tileDefsKey,
  products,
  inStock,
  recent,
  extraSubcategoriesKey,
  categoryThumbs,
  siteConfig,
  showInStock = true,
  showWatchAll = false,
  watchAllLabel,
}: {
  title: string;
  href: string;
  tileDefsKey: keyof typeof TILE_DEFINITIONS;
  products: ProductListItem[];
  inStock: ProductListItem[];
  recent: ProductListItem[];
  extraSubcategoriesKey?: keyof typeof TILE_DEFINITIONS;
  categoryThumbs: Record<string, string>;
  siteConfig: SiteConfig;
  showInStock?: boolean;
  showWatchAll?: boolean;
  watchAllLabel?: string;
}) {
  const overrides = tileOverridesMap(siteConfig.tile_overrides);
  const tiles = buildCategoryTiles(
    TILE_DEFINITIONS[tileDefsKey],
    products,
    href,
    categoryThumbs,
    overrides,
  ).map((t) => ({ name: t.label, href: t.href, thumb: t.thumb }));

  const extraTiles = extraSubcategoriesKey
    ? buildCategoryTiles(
        TILE_DEFINITIONS[extraSubcategoriesKey],
        products,
        href,
        categoryThumbs,
        overrides,
      )
    : [];

  return (
    <Reveal>
      <section className="unicorn-section pb-6">
        <div className="mb-3 flex items-center justify-between px-[15px]">
          <h2 className="unicorn-section-title">{title}</h2>
          <SeeAllButton href={href} />
        </div>

        <CategoryGrid tiles={tiles} />

        <div className="mt-4">
          <ProductCarousel title="Бестселлеры" products={products} seeAllHref={href} />
          {showInStock && (
            <ProductCarousel
              title="В наличии в Москве"
              products={inStock}
              seeAllHref={`${href}${href.includes("?") ? "&" : "?"}in_stock=true`}
            />
          )}
          <ProductCarousel title="Только что купили" products={recent} seeAllHref={href} />
        </div>

        {extraSubcategoriesKey && extraTiles.length > 0 && (
          <SubcategoryRow
            items={extraTiles.map((t) => t.label)}
            href={href}
            tiles={extraTiles.map((t) => ({ name: t.label, href: t.href, thumb: t.thumb }))}
          />
        )}

        {showWatchAll && <WatchAllButton href={href} label={watchAllLabel} />}
      </section>
    </Reveal>
  );
}

export function FootwearSection({
  products,
  inStock,
  categoryThumbs,
  siteConfig,
}: {
  categories: { id: string; name: string; slug: string }[];
  products: ProductListItem[];
  inStock: ProductListItem[];
  categoryThumbs: Record<string, string>;
  siteConfig: SiteConfig;
}) {
  const recent = [...products].reverse().slice(0, 12);

  return (
    <>
      <SectionBlock
        title="Обувь"
        href="/catalog?q=кросс"
        tileDefsKey="footwear"
        products={products}
        inStock={inStock}
        recent={recent}
        categoryThumbs={categoryThumbs}
        siteConfig={siteConfig}
        showWatchAll
      />
    </>
  );
}

export function ClothingSection({
  products,
  inStock,
  categoryThumbs,
  siteConfig,
}: {
  categories: { id: string; name: string; slug: string }[];
  products: ProductListItem[];
  inStock: ProductListItem[];
  categoryThumbs: Record<string, string>;
  siteConfig: SiteConfig;
}) {
  const recent = [...products].reverse().slice(0, 12);
  const rotated = products.slice(2).concat(products.slice(0, 2));

  return (
    <SectionBlock
      title="Одежда"
      href="/catalog?q=одежд"
      tileDefsKey="clothing"
      products={rotated}
      inStock={inStock}
      recent={recent}
      extraSubcategoriesKey="clothing_extra"
      categoryThumbs={categoryThumbs}
      siteConfig={siteConfig}
      showInStock={false}
    />
  );
}

export function AccessoriesSection({
  products,
  inStock,
  categoryThumbs,
  siteConfig,
}: {
  products: ProductListItem[];
  inStock: ProductListItem[];
  categoryThumbs: Record<string, string>;
  siteConfig: SiteConfig;
}) {
  const recent = [...products].reverse().slice(0, 12);
  const rotated = products.slice(4).concat(products.slice(0, 4));

  return (
    <SectionBlock
      title="Аксессуары"
      href="/catalog?q=сумк"
      tileDefsKey="accessories"
      products={rotated}
      inStock={inStock}
      recent={recent}
      extraSubcategoriesKey="accessories_extra"
      categoryThumbs={categoryThumbs}
      siteConfig={siteConfig}
      showInStock={false}
    />
  );
}
