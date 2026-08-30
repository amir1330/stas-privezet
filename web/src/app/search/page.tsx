import { ProductCard } from "@/components/ProductCard";
import { searchProducts } from "@/lib/api";

export const revalidate = 15;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; brand?: string; category?: string; offset?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q || "";
  const params: Record<string, string> = {};
  if (sp.brand) params.brand = sp.brand;
  if (sp.category) params.category = sp.category;
  if (sp.offset) params.offset = sp.offset;

  const result = q
    ? await searchProducts(q, params).catch(() => ({ items: [], total: 0, offset: 0, limit: 48, query: q }))
    : { items: [], total: 0, offset: 0, limit: 48, query: q };

  return (
    <div className="min-h-screen bg-white pb-10">
      <div className="px-[15px] pb-4 pt-6">
        <h1 className="unicorn-section-title">
          {q ? `Результаты: «${q}»` : "Поиск"}
        </h1>
        {q && <p className="mt-1 text-sm text-[#717171]">{result.total} товаров</p>}
      </div>

      <div className="mx-auto max-w-[1400px] px-[15px]">
        <div className="grid grid-cols-2 gap-x-2 gap-y-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {result.items.map((p) => (
            <ProductCard key={p.id} product={p} variant="grid" />
          ))}
        </div>

        {!q && <p className="mt-10 text-[#717171]">Введите запрос в поисковой строке на главной.</p>}
        {q && result.items.length === 0 && (
          <p className="mt-10 text-center text-[#717171]">Ничего не найдено</p>
        )}
      </div>
    </div>
  );
}
