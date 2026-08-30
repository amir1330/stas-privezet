import { HomePageContent } from "@/components/HomePageContent";
import { getBrands, getCategories, getProducts } from "@/lib/api";
import { getServerLocale } from "@/lib/locale-server";
import { getCategoryThumbnails, getSiteConfig } from "@/lib/site-config";

export const revalidate = 60;

export default async function HomePage() {
  const locale = await getServerLocale();
  const [siteConfig, categoryThumbs, products, categories, brands] = await Promise.all([
    getSiteConfig(),
    getCategoryThumbnails(),
    getProducts({ limit: "150" }, locale).catch(() => ({ items: [], next_cursor: null, total: 0 })),
    getCategories(locale).catch(() => []),
    getBrands(locale).catch(() => []),
  ]);

  const inStock = products.items.filter((p) => p.is_in_stock).slice(0, 24);

  return (
    <HomePageContent
      siteConfig={siteConfig}
      products={products.items}
      inStock={inStock}
      categories={categories}
      brands={brands}
      categoryThumbs={categoryThumbs}
    />
  );
}
