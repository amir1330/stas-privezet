import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductPageMarker } from "@/components/ProductPageMarker";
import { ProductHero } from "@/components/ProductHero";
import { ProductGuarantees, ProductReviews, SimilarProducts } from "@/components/ProductPageExtras";
import { brandQueryValue, displayBrandName } from "@/lib/brands";
import { getProduct } from "@/lib/api";
import { getServerLocale } from "@/lib/locale-server";

export const revalidate = 60;

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getServerLocale();
  let product;
  try {
    product = await getProduct(slug, locale);
  } catch {
    notFound();
  }

  const brandLabel = displayBrandName(product.brand);
  const brandQuery = brandQueryValue(product.brand);

  return (
    <ProductPageMarker>
      <div className="pb-16">
        <ProductHero
        productId={product.id}
        title={product.title}
        brand={product.brand}
        categoryName={product.category_name}
        categorySlug={product.category_slug}
        priceKrw={product.price_krw}
        isInStock={Boolean(product.is_in_stock)}
        images={product.images ?? []}
        variants={product.variants ?? []}
        specs={(product.specs ?? [])
          .filter((s): s is { key: string; value: string } => Boolean(s.key && s.value))
          .map((s) => ({ key: s.key!, value: s.value! }))}
      />

      <div className="mx-auto max-w-[1400px] px-[15px] pt-4 lg:hidden">
        <nav className="text-sm text-[#717171]">
          <Link href="/catalog" className="hover:text-black">
            Каталог
          </Link>
          {product.category_name && (
            <>
              <span className="mx-1.5">›</span>
              <Link href="/catalog" className="hover:text-black">
                {product.category_name}
              </Link>
            </>
          )}
          {brandLabel && (
            <>
              <span className="mx-1.5">›</span>
              <Link
                href={`/catalog?brand=${encodeURIComponent(brandQuery ?? brandLabel)}`}
                className="hover:text-black"
              >
                {brandLabel}
              </Link>
            </>
          )}
        </nav>

        <h1 className="mt-4 text-xl font-bold leading-tight text-black md:text-2xl">
          {product.title}
        </h1>
        {brandLabel && (
          <Link
            href={`/search?q=${encodeURIComponent(brandQuery ?? brandLabel)}`}
            className="mt-2 inline-block text-sm font-semibold text-[var(--color-accent)]"
          >
            {brandLabel}
          </Link>
        )}
      </div>

      {product.description && (
        <section className="mx-auto max-w-[1400px] px-[15px] py-8">
          <h2 className="text-lg font-bold">Описание</h2>
          <p className="mt-4 max-w-3xl text-[#717171] leading-relaxed">{product.description}</p>
        </section>
      )}

      <ProductGuarantees />

      <SimilarProducts brand={product.brand} excludeSlug={product.slug} />

      <ProductReviews title={product.title} />
      </div>
    </ProductPageMarker>
  );
}
