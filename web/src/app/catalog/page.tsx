import { Suspense } from "react";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { FilterBar } from "@/components/FilterBar";
import { getBrands, getCategories, getProducts } from "@/lib/api";
import { getServerLocale } from "@/lib/locale-server";

export const revalidate = 30;

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{
    cursor?: string;
    category?: string;
    brand?: string;
    in_stock?: string;
    q?: string;
  }>;
}) {
  const sp = await searchParams;
  const locale = await getServerLocale();
  const params: Record<string, string> = {};
  if (sp.category) params.category = sp.category;
  if (sp.brand) params.brand = sp.brand;
  if (sp.in_stock) params.in_stock = sp.in_stock;
  if (sp.q) params.q = sp.q;
  if (sp.cursor) params.cursor = sp.cursor;

  const [{ items, next_cursor, total }, categories, brands] = await Promise.all([
    getProducts(params, locale).catch(() => ({ items: [], next_cursor: null, total: 0 })),
    getCategories(locale).catch(() => []),
    getBrands(locale).catch(() => []),
  ]);

  const activeFilters = [sp.brand, sp.category, sp.q, sp.in_stock ? "в наличии" : null].filter(Boolean);

  return (
    <div className="min-h-screen bg-white pb-10">
      <div className="mx-auto max-w-[1400px] px-[15px] pb-4 pt-6">
        <h1 className="unicorn-section-title">Каталог</h1>
        <p className="mt-1 text-sm text-[#717171]">
          {total ?? items.length} товаров
          {activeFilters.length > 0 && ` · ${activeFilters.join(" · ")}`}
        </p>
      </div>

      <div className="mx-auto flex max-w-[1400px] gap-8 px-[15px]">
        <Suspense fallback={null}>
          <FilterBar brands={brands} categories={categories} layout="sidebar" />
        </Suspense>

        <div className="min-w-0 flex-1">
          <Suspense fallback={null}>
            <FilterBar brands={brands} categories={categories} layout="inline" />
          </Suspense>

          <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} variant="grid" />
            ))}
          </div>

          {items.length === 0 && (
            <p className="py-20 text-center text-[#717171]">Товары не найдены — попробуйте сбросить фильтры</p>
          )}

          {next_cursor && (
            <div className="mt-10 text-center">
              <Link
                href={`/catalog?${new URLSearchParams({ ...params, cursor: next_cursor }).toString()}`}
                className="inline-flex rounded-tile bg-[#efedec] px-8 py-3 text-sm font-bold text-black"
              >
                Загрузить ещё
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
