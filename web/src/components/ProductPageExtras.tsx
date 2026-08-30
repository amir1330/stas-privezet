import { ProductCarousel } from "@/components/ProductCarousel";
import { brandQueryValue, brandsMatch, displayBrandName } from "@/lib/brands";
import { getProducts } from "@/lib/api";

export async function SimilarProducts({
  brand,
  excludeSlug,
}: {
  brand: string | null;
  excludeSlug: string;
}) {
  const products = await getProducts().catch(() => ({ items: [] }));
  const similar = products.items
    .filter((p) => p.slug !== excludeSlug && (!brand || brandsMatch(p.brand, brand)))
    .slice(0, 12);

  if (similar.length === 0) return null;

  const brandLabel = displayBrandName(brand);
  const searchBrand = brandQueryValue(brand);

  return (
    <section className="border-t border-[#eaeaea] pt-6">
      <ProductCarousel
        title={brandLabel ? `Похожие ${brandLabel}` : "Похожие товары"}
        products={similar}
        seeAllHref={searchBrand ? `/search?q=${encodeURIComponent(searchBrand)}` : "/catalog"}
      />
    </section>
  );
}

export function ProductGuarantees() {
  const items = [
    "Товар сертифицирован и опломбирован.",
    "Проверяем на оригинальность по 16 параметрам.",
    "Если придёт подделка — вернём деньги в трёхкратном размере.",
  ];

  return (
    <section className="mx-auto max-w-[1400px] px-[15px] py-8">
      <ul className="space-y-3">
        {items.map((text) => (
          <li key={text} className="flex gap-2 text-sm text-[#717171]">
            <span className="text-[var(--color-accent)]">✓</span>
            {text}
          </li>
        ))}
      </ul>
      <a href="/catalog" className="mt-4 inline-block text-sm font-medium text-[var(--color-accent)] underline">
        Как мы проверяем товары
      </a>
    </section>
  );
}

export function ProductReviews({ title }: { title: string }) {
  return (
    <section className="mx-auto max-w-[1400px] border-t border-[#eaeaea] px-[15px] py-8">
      <h2 className="text-lg font-bold">Отзывы на {title}</h2>
      <p className="mt-4 text-sm text-[#717171]">Пока нет отзывов. Будьте первым!</p>
    </section>
  );
}
